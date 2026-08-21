"""
Quiz Routes.
Generate structured quizzes and evaluate answers.
"""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import get_db
from db import crud
from api.middleware.auth import get_current_or_guest_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


class QuizGenerateRequest(BaseModel):
    num_questions: int = 5
    difficulty: str = "medium"
    question_types: list[str] = ["mcq", "true_false", "short_answer", "fill_blanks"]
    topic_focus: str = ""


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: list[dict]  # [{question_index: int, answer: str}]


class AnswerEvaluateRequest(BaseModel):
    question: str
    correct_answer: str
    user_answer: str


@router.post("/{doc_id}/generate")
def generate_quiz(
    doc_id: str,
    req: QuizGenerateRequest,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """Generate a structured quiz from a document."""
    doc = crud.get_document(db, doc_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")


    if doc.status != "ready":
        raise HTTPException(status_code=400, detail="Document is still processing")

    from core.vector_store import get_vector_store
    from core.llm_engine import get_llm_engine
    from utils.prompt_templates import QUIZ_SYSTEM_PROMPT, build_structured_quiz_prompt

    vs = get_vector_store()
    llm = get_llm_engine()

    results = vs.get_all_chunks_by_doc(doc_id)

    if not results:
        raise HTTPException(status_code=400, detail="This document has no readable text.")

    # Combine up to ~20k characters (~5k tokens) to stay within Groq's 6k TPM limit
    combined = "\n\n".join([r["text"] for r in results])[:20000]

    prompt = build_structured_quiz_prompt(
        text=combined,
        num_questions=req.num_questions,
        difficulty=req.difficulty,
        question_types=req.question_types,
    )

    try:
        response = llm.generate(
            prompt=prompt,
            system_prompt=QUIZ_SYSTEM_PROMPT,
            temperature=0.5,
            format="json",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Parse JSON from LLM response
    questions = _parse_quiz_json(response)

    if not questions:
        raise HTTPException(status_code=500, detail="Failed to parse quiz questions. Try again.")

    # Save quiz to DB
    quiz = crud.create_quiz(
        db=db,
        document_id=doc_id,
        user_id=user.id,
        questions=questions,
        difficulty=req.difficulty,
    )

    return {
        "quiz_id": quiz.id,
        "questions": questions,
        "total": len(questions),
        "difficulty": req.difficulty,
    }


@router.post("/submit")
def submit_quiz(
    req: QuizSubmitRequest,
    user=Depends(get_current_or_guest_user),
    db: Session = Depends(get_db),
):
    """Submit quiz answers and get score."""
    quiz = db.query(crud.Quiz).filter(crud.Quiz.id == req.quiz_id).first()
    if not quiz or quiz.user_id != user.id:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = quiz.questions
    score = 0
    results = []

    # Pre-evaluate short answers in parallel to speed up submission
    short_answers_to_eval = []
    for answer in req.answers:
        idx = answer.get("question_index", 0)
        user_answer = answer.get("answer", "").strip()
        if idx < len(questions):
            q = questions[idx]
            q_type = q.get("type", "mcq")
            correct = q.get("correct_answer", "")
            if q_type == "short_answer" and user_answer and user_answer.lower().strip() != str(correct).lower().strip():
                short_answers_to_eval.append((idx, q.get("question", ""), correct, user_answer))

    eval_results = {}
    if short_answers_to_eval:
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {
                executor.submit(_evaluate_short_answer, q_text, correct, u_ans): idx
                for idx, q_text, correct, u_ans in short_answers_to_eval
            }
            for future in futures:
                idx = futures[future]
                try:
                    eval_results[idx] = future.result()
                except Exception:
                    eval_results[idx] = False

    for answer in req.answers:
        idx = answer.get("question_index", 0)
        user_answer = answer.get("answer", "").strip()

        if idx >= len(questions):
            continue

        q = questions[idx]
        correct = q.get("correct_answer", "")
        q_type = q.get("type", "mcq")

        is_correct = False
        if q_type in ("mcq", "true_false", "multiple_choice"):
            is_correct = user_answer.upper() == str(correct).upper()
        elif q_type == "fill_blanks":
            is_correct = user_answer.lower().strip() == str(correct).lower().strip()
        elif q_type == "short_answer":
            if not user_answer:
                is_correct = False
            elif user_answer.lower().strip() == str(correct).lower().strip():
                is_correct = True
            else:
                is_correct = eval_results.get(idx, False)

        if is_correct:
            score += 1

        results.append({
            "question_index": idx,
            "user_answer": user_answer,
            "correct_answer": correct,
            "is_correct": is_correct,
            "explanation": q.get("explanation", ""),
        })

    # Calculate XP
    xp_earned = score * 10
    if score == len(questions):
        xp_earned += 50  # Perfect score bonus

    # Update quiz and user
    crud.update_quiz_score(db, quiz.id, score, xp_earned)
    crud.update_user_xp(db, user.id, xp_earned, reason="Quiz Completed")

    return {
        "score": score,
        "total": len(questions),
        "percentage": round(score / max(len(questions), 1) * 100),
        "xp_earned": xp_earned,
        "results": results,
    }


@router.post("/evaluate-answer")
def evaluate_answer(
    req: AnswerEvaluateRequest,
    user=Depends(get_current_or_guest_user),
):
    """Evaluate a short answer using the LLM."""
    is_correct = _evaluate_short_answer(req.question, req.correct_answer, req.user_answer)

    from core.llm_engine import get_llm_engine
    llm = get_llm_engine()

    explanation = llm.generate(
        prompt=f"""Question: {req.question}
Correct answer: {req.correct_answer}
Student's answer: {req.user_answer}

Is the student's answer correct or close enough? Provide a brief 1-2 sentence explanation.""",
        system_prompt="You are a helpful teacher evaluating student answers. Be fair but accurate.",
        max_tokens=150,
    )

    return {
        "is_correct": is_correct,
        "explanation": explanation,
    }


def _evaluate_short_answer(question: str, correct: str, user_answer: str) -> bool:
    """Use LLM to evaluate if a short answer is correct."""
    if not user_answer.strip():
        return False

    # Quick exact match
    if user_answer.lower().strip() == correct.lower().strip():
        return True

    try:
        from core.llm_engine import get_llm_engine
        import json
        llm = get_llm_engine()

        result_text = llm.generate(
            prompt=f"""Question: {question}
Correct answer: {correct}
Student's answer: {user_answer}

Is the student's answer essentially correct or close enough? 
Return a JSON object with a single boolean field "is_correct" set to true or false. 
Example: {{"is_correct": false}}""",
            system_prompt="You evaluate answers. Return ONLY valid JSON.",
            max_tokens=20,
            temperature=0.0,
            format="json"
        )
        
        # Parse JSON to avoid false positives with words like "YES" in explanations
        try:
            start = result_text.find("{")
            end = result_text.rfind("}") + 1
            if start >= 0 and end > start:
                data = json.loads(result_text[start:end])
                return bool(data.get("is_correct", False))
        except json.JSONDecodeError:
            pass
            
        return "TRUE" in result_text.upper() or '"IS_CORRECT": TRUE' in result_text.upper()
    except Exception:
        return False


def _parse_quiz_json(response: str) -> list:
    """Parse quiz questions from LLM response."""
    # Try to find JSON in the response
    try:
        # Look for JSON array
        start = response.find("[")
        end = response.rfind("]") + 1
        if start >= 0 and end > start:
            return json.loads(response[start:end])
    except json.JSONDecodeError:
        pass

    # Try to find JSON object with questions key
    try:
        start = response.find("{")
        end = response.rfind("}") + 1
        if start >= 0 and end > start:
            data = json.loads(response[start:end])
            return data.get("questions", [])
    except json.JSONDecodeError:
        pass

    return []
