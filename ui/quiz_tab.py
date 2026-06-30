"""
Quiz Tab.
Generate quiz questions from uploaded documents.
"""

import streamlit as st

import config
from features.quiz_generator import QuizGenerator


def render_quiz_tab():
    """Render the quiz generation tab."""
    st.markdown(
        '<div class="animate-fade-in">'
        "<h2>📝 Quiz Generator</h2>"
        "</div>",
        unsafe_allow_html=True,
    )

    # Check prerequisites
    if "vector_store" not in st.session_state or st.session_state.vector_store.size == 0:
        st.info("📤 Upload a document first to generate quiz questions.")
        return

    sources = st.session_state.vector_store.get_sources()

    # Settings
    col1, col2, col3 = st.columns(3)

    with col1:
        source = st.selectbox(
            "📄 Document",
            ["All Documents"] + sources,
            key="quiz_source",
        )

    with col2:
        num_questions = st.slider(
            "❓ Number of Questions",
            min_value=3,
            max_value=15,
            value=5,
            key="quiz_num",
        )

    with col3:
        difficulty = st.select_slider(
            "📈 Difficulty",
            options=["easy", "medium", "hard"],
            value="medium",
            key="quiz_difficulty",
        )

    q_type = st.radio(
        "Question Type",
        ["mixed", "mcq", "true_false", "short_answer"],
        horizontal=True,
        format_func=lambda x: {
            "mixed": "🎲 Mixed",
            "mcq": "🔘 Multiple Choice",
            "true_false": "✅ True/False",
            "short_answer": "✍️ Short Answer",
        }.get(x, x),
        key="quiz_type",
    )

    # Topic focus
    topic = st.text_input(
        "🎯 Focus topic (optional)",
        placeholder="e.g., methodology, results, specific concept...",
        key="quiz_topic",
    )

    # Generate button
    if st.button("🎯 Generate Quiz", type="primary", use_container_width=True):
        _generate_quiz(
            source if source != "All Documents" else None,
            num_questions,
            difficulty,
            q_type,
            topic,
        )


def _generate_quiz(
    source: str | None,
    num_questions: int,
    difficulty: str,
    q_type: str,
    topic: str = "",
):
    """Generate and display quiz questions."""
    with st.spinner("🧠 Generating quiz questions..."):
        try:
            generator = QuizGenerator(
                vector_store=st.session_state.vector_store,
                llm_engine=st.session_state.llm_engine,
            )

            quiz = generator.generate(
                source=source,
                num_questions=num_questions,
                difficulty=difficulty,
                q_type=q_type,
                topic=topic,
            )

            st.markdown("---")
            st.markdown("### 📋 Generated Quiz")
            st.markdown(
                f'<div class="quiz-question">{quiz}</div>',
                unsafe_allow_html=True,
            )

            # Download button
            st.download_button(
                label="📥 Download Quiz",
                data=quiz,
                file_name="quiz.md",
                mime="text/markdown",
            )

        except Exception as e:
            st.error(f"❌ Quiz generation failed: {str(e)}")
