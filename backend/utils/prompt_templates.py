"""
Prompt Templates.
All LLM prompts used across the application.
"""

RAG_SYSTEM_PROMPT = """You are an expert AI Study Assistant. You help students and professionals understand, analyze, and learn from documents of any type — textbooks, research papers, reports, presentations, notes, and more.

Rules:
1. Answer ONLY based on the provided document context. If the context lacks the answer, say so.
2. Cite page numbers when possible.
3. Be clear, thorough, and educational.
4. Format responses with markdown for readability.
5. Explain complex concepts simply when asked."""


def build_rag_prompt(question: str, context: str) -> str:
    return f"""Based on the following document context, answer the question.

## Document Context
{context}

## Question
{question}

Answer based strictly on the context. Cite page numbers where relevant. Use markdown formatting."""


SUMMARIZER_SYSTEM_PROMPT = """You produce clear, well-structured summaries tailored to the requested level of detail."""


def build_summary_prompt(text: str, level: str = "detailed") -> str:
    instructions = {
        "short": "Write a short summary in 2-3 paragraphs capturing the main points.",
        "detailed": """Write a comprehensive detailed summary with these sections:
## Overview
## Key Points
## Important Details
## Conclusions""",
        "bullet": "Create a bullet-point summary with the most important takeaways. Use nested bullets for sub-points.",
        "takeaways": "Extract the top 5-10 key takeaways. Number each one and explain it in 1-2 sentences.",
        "executive": "Write a professional executive summary (200-300 words) suitable for a business audience.",
        "beginner": "Explain the content in simple terms as if teaching a beginner. Avoid jargon and use analogies.",
        "technical": "Write a technical summary focusing on methodology, data, formulas, and technical details.",
    }

    instruction = instructions.get(level, instructions["detailed"])
    return f"""{instruction}

## Content
{text}"""


QUIZ_SYSTEM_PROMPT = """You generate high-quality quiz questions from document content. Always return valid JSON."""


def build_structured_quiz_prompt(
    text: str, num_questions: int = 5, difficulty: str = "medium",
    question_types: list[str] = None,
) -> str:
    if question_types is None:
        question_types = ["mcq", "true_false", "short_answer"]

    type_examples = {
        "mcq": '{"type": "mcq", "question": "What is...?", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct_answer": "A", "explanation": "Because..."}',
        "true_false": '{"type": "true_false", "question": "Statement...", "correct_answer": "True", "explanation": "Because..."}',
        "short_answer": '{"type": "short_answer", "question": "Explain...", "correct_answer": "The answer is...", "explanation": "This is important because..."}',
        "fill_blanks": '{"type": "fill_blanks", "question": "The process of ___ converts...", "correct_answer": "photosynthesis", "explanation": "..."}',
    }

    examples = [type_examples[t] for t in question_types if t in type_examples]

    return f"""Generate exactly {num_questions} quiz questions at {difficulty} difficulty from the content below.

Use these question types: {', '.join(question_types)}

Return ONLY a JSON array. Each element must have: type, question, correct_answer, explanation.
For MCQ: also include "options" array with 4 choices prefixed A) B) C) D).

Example format:
[
  {', '.join(examples[:2])}
]

## Content
{text}

Return ONLY the JSON array."""
