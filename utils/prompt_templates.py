"""
Prompt Templates.
All LLM prompts used across the application.
"""

# ── RAG Prompts ──────────────────────────────────────────────────────────

RAG_SYSTEM_PROMPT = """You are an expert AI Research Assistant. You help researchers understand, analyze, and extract insights from scientific papers and documents.

Rules:
1. Answer questions based ONLY on the provided context. If the context doesn't contain the answer, say so clearly.
2. Cite specific sources and page numbers when possible.
3. Be precise, thorough, and use academic language when appropriate.
4. If asked about figures or tables, describe what you can infer from the context about them.
5. Format your responses with markdown for readability."""


def build_rag_prompt(question: str, context: str) -> str:
    """Build a RAG prompt with context and question."""
    return f"""Based on the following context from research documents, answer the question.

## Context
{context}

## Question
{question}

## Instructions
- Answer based strictly on the provided context.
- If the context doesn't contain enough information, acknowledge the limitation.
- Cite the source document and page numbers where relevant.
- Use markdown formatting for clarity."""


# ── Summarization Prompts ────────────────────────────────────────────────

SUMMARIZER_SYSTEM_PROMPT = """You are an expert research paper summarizer. You produce clear, structured summaries that capture the key contributions, methodology, results, and limitations of scientific papers."""


def build_summary_prompt(text: str, level: str = "detailed") -> str:
    """Build a summarization prompt."""
    if level == "brief":
        instruction = "Provide a brief 3-5 sentence summary of the following research content."
    elif level == "abstract":
        instruction = "Generate an abstract-style summary (150-250 words) of the following research content."
    else:
        instruction = """Provide a detailed structured summary of the following research content with these sections:
## Key Findings
## Methodology
## Results
## Limitations
## Future Work (if mentioned)"""

    return f"""{instruction}

## Content
{text}"""


# ── Quiz Generation Prompts ─────────────────────────────────────────────

QUIZ_SYSTEM_PROMPT = """You are an educational AI that generates high-quality quiz questions from research content. Generate questions that test understanding, not just recall."""


def build_quiz_prompt(
    text: str, num_questions: int = 5, difficulty: str = "medium", q_type: str = "mixed"
) -> str:
    """Build a quiz generation prompt."""
    type_instruction = {
        "mcq": "Generate only multiple choice questions (MCQ) with 4 options (A, B, C, D). Mark the correct answer.",
        "true_false": "Generate only True/False questions. State the correct answer.",
        "short_answer": "Generate only short answer questions. Provide model answers.",
        "mixed": "Generate a mix of MCQ, True/False, and short answer questions. Provide correct answers for all.",
    }.get(q_type, "Generate a mix of question types.")

    return f"""Generate {num_questions} quiz questions at {difficulty} difficulty level from the following research content.

{type_instruction}

Format each question clearly with:
- **Question N:** [question text]
- **Options** (for MCQ): A) ... B) ... C) ... D) ...
- **Answer:** [correct answer]
- **Explanation:** [brief explanation of why]

## Content
{text}"""


# ── Paper Comparison Prompts ─────────────────────────────────────────────

COMPARISON_SYSTEM_PROMPT = """You are an expert at comparative analysis of research papers. You identify similarities, differences, and complementary findings across papers."""


def build_comparison_prompt(context_a: str, context_b: str, source_a: str, source_b: str) -> str:
    """Build a paper comparison prompt."""
    return f"""Compare the following two research papers/documents in detail.

## Document A: {source_a}
{context_a}

## Document B: {source_b}
{context_b}

## Comparison Structure
Please compare these documents across the following dimensions:

### 1. Research Objectives
### 2. Methodology
### 3. Key Findings
### 4. Similarities
### 5. Differences
### 6. Strengths & Weaknesses
### 7. Complementary Insights"""


# ── Figure Explanation Prompts ───────────────────────────────────────────

FIGURE_SYSTEM_PROMPT = """You are an expert at analyzing and explaining figures, charts, and diagrams from scientific papers. Provide clear, detailed explanations."""


def build_figure_prompt(surrounding_text: str = "") -> str:
    """Build a figure explanation prompt for the vision model."""
    base = """Analyze this figure/image from a scientific paper. Provide:

1. **Description**: What does the figure show?
2. **Key Observations**: What are the main takeaways?
3. **Data Interpretation**: If it's a chart/graph, interpret the trends and patterns.
4. **Significance**: Why is this figure important for the paper's argument?"""

    if surrounding_text:
        base += f"""

## Surrounding Text Context
{surrounding_text}

Use the surrounding text to provide additional context for your explanation."""

    return base
