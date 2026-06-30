"""
🔬 AI Research Assistant
Main Streamlit Application.

Upload PDFs, images, or research papers and ask questions in natural language.
Features: Summarize, Explain Figures, Generate Quizzes, Compare Papers.
"""

import logging
# pyrefly: ignore [missing-import]
import streamlit as st

import config
from core.vector_store import VectorStore
from core.llm_engine import LLMEngine
from core.retriever import Retriever
from core.vision_engine import VisionEngine
from ui.styles import get_custom_css
from ui.sidebar import render_sidebar
from ui.chat_tab import render_chat_tab
from ui.compare_tab import render_compare_tab
from ui.quiz_tab import render_quiz_tab

# ── Logging ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ── Page Config ──────────────────────────────────────────────────────────
st.set_page_config(
    page_title="AI Research Assistant",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        "About": "AI Research Assistant — RAG + Vision + LLM powered paper analysis.",
    },
)


def init_session_state():
    """Initialize all session state variables."""
    if "initialized" in st.session_state:
        return

    logger.info("Initializing session state...")

    # Core engines
    st.session_state.vector_store = VectorStore()
    st.session_state.llm_engine = LLMEngine()
    st.session_state.retriever = Retriever(
        vector_store=st.session_state.vector_store,
        llm_engine=st.session_state.llm_engine,
    )

    # Vision engine (optional)
    try:
        st.session_state.vision_engine = VisionEngine()
    except Exception:
        st.session_state.vision_engine = None

    # UI state
    st.session_state.chat_history = []
    st.session_state.processed_files = set()
    st.session_state.document_images = {}
    st.session_state.document_metadata = {}
    st.session_state.temperature = config.LLM_TEMPERATURE
    st.session_state.top_k = config.RETRIEVAL_TOP_K

    # Try loading persisted index
    if config.INDEX_DIR.exists():
        loaded = st.session_state.vector_store.load(config.INDEX_DIR)
        if loaded:
            logger.info("Loaded persisted vector store.")

    st.session_state.initialized = True
    logger.info("Session state initialized.")


def render_main_content():
    """Render the main content area with tabs."""
    # App header
    st.markdown(get_custom_css(), unsafe_allow_html=True)

    # ── Tab Layout ───────────────────────────────────────────────────
    tab_chat, tab_summarize, tab_compare, tab_quiz, tab_figures = st.tabs(
        ["💬 Chat", "📝 Summarize", "🔀 Compare", "🎯 Quiz", "🖼️ Figures"]
    )

    with tab_chat:
        render_chat_tab()

    with tab_summarize:
        render_summarize_tab()

    with tab_compare:
        render_compare_tab()

    with tab_quiz:
        render_quiz_tab()

    with tab_figures:
        render_figures_tab()


def render_summarize_tab():
    """Render the summarization tab."""
    st.markdown(
        '<div class="animate-fade-in"><h2>📝 Summarize Documents</h2></div>',
        unsafe_allow_html=True,
    )

    if "vector_store" not in st.session_state or st.session_state.vector_store.size == 0:
        st.info("📤 Upload a document first to generate summaries.")
        return

    sources = st.session_state.vector_store.get_sources()

    col1, col2 = st.columns(2)
    with col1:
        source = st.selectbox(
            "📄 Document",
            ["All Documents"] + sources,
            key="summary_source",
        )
    with col2:
        level = st.select_slider(
            "📏 Detail Level",
            options=["brief", "abstract", "detailed"],
            value="detailed",
            key="summary_level",
        )

    custom = st.text_input(
        "🎯 Focus (optional)",
        placeholder="e.g., Focus on methodology, or summarize the results section...",
        key="summary_custom",
    )

    if st.button("📝 Generate Summary", type="primary", use_container_width=True):
        with st.spinner("📖 Reading and summarizing..."):
            try:
                from features.summarizer import Summarizer

                summarizer = Summarizer(
                    vector_store=st.session_state.vector_store,
                    llm_engine=st.session_state.llm_engine,
                )

                selected_source = source if source != "All Documents" else None

                # Stream the summary
                response_placeholder = st.empty()
                full_response = ""
                for chunk in summarizer.summarize_stream(
                    source=selected_source,
                    level=level,
                    custom_instruction=custom,
                ):
                    full_response += chunk
                    response_placeholder.markdown(full_response + "▌")
                response_placeholder.markdown(full_response)

                # Download button
                st.download_button(
                    label="📥 Download Summary",
                    data=full_response,
                    file_name="summary.md",
                    mime="text/markdown",
                )
            except Exception as e:
                st.error(f"❌ Summarization failed: {str(e)}")


def render_figures_tab():
    """Render the figures/images analysis tab."""
    st.markdown(
        '<div class="animate-fade-in"><h2>🖼️ Analyze Figures</h2></div>',
        unsafe_allow_html=True,
    )

    doc_images = st.session_state.get("document_images", {})

    if not doc_images:
        st.info("📤 Upload a PDF with figures to analyze them.")
        st.caption("Figures are automatically extracted when you upload a PDF.")
        return

    # Document selection
    source = st.selectbox(
        "📄 Select Document",
        list(doc_images.keys()),
        key="figure_source",
    )

    images = doc_images.get(source, [])
    if not images:
        st.warning("No figures found in this document.")
        return

    st.markdown(f"**{len(images)} figures found**")

    # Display figures in a grid
    cols_per_row = 3
    for i in range(0, len(images), cols_per_row):
        cols = st.columns(cols_per_row)
        for j, col in enumerate(cols):
            idx = i + j
            if idx >= len(images):
                break

            img_info = images[idx]
            with col:
                st.image(
                    img_info["image"],
                    caption=f"Figure (Page {img_info['page']})",
                    use_container_width=True,
                )
                if st.button(f"🔍 Explain", key=f"explain_{source}_{idx}"):
                    with st.spinner("Analyzing figure..."):
                        try:
                            from features.figure_explainer import FigureExplainer

                            explainer = FigureExplainer(
                                llm_engine=st.session_state.llm_engine,
                                vector_store=st.session_state.vector_store,
                                vision_engine=st.session_state.get("vision_engine"),
                            )
                            explanation = explainer.explain_figure(
                                image=img_info["image"],
                                source=source,
                                figure_label=f"Figure on page {img_info['page']}",
                            )
                            st.markdown(explanation)
                        except Exception as e:
                            st.error(f"Analysis failed: {str(e)}")


# ── Main ─────────────────────────────────────────────────────────────────
def main():
    """Main application entry point."""
    init_session_state()
    render_sidebar()
    render_main_content()


if __name__ == "__main__":
    main()
