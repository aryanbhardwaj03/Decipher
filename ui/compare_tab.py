"""
Compare Tab.
Side-by-side comparison of two documents.
"""

import streamlit as st

import config
from features.paper_comparator import PaperComparator


def render_compare_tab():
    """Render the document comparison tab."""
    st.markdown(
        '<div class="animate-fade-in">'
        "<h2>🔀 Compare Documents</h2>"
        "</div>",
        unsafe_allow_html=True,
    )

    # Check prerequisites
    if "vector_store" not in st.session_state or st.session_state.vector_store.size == 0:
        st.info("📤 Upload at least two documents to compare them.")
        return

    sources = st.session_state.vector_store.get_sources()

    if len(sources) < 2:
        st.warning("⚠️ Upload at least **2 documents** to enable comparison.")
        return

    # Document selection
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("### 📄 Document A")
        doc_a = st.selectbox(
            "Select first document",
            sources,
            key="compare_doc_a",
            label_visibility="collapsed",
        )

    with col2:
        st.markdown("### 📄 Document B")
        # Default to second document
        default_b = 1 if len(sources) > 1 else 0
        doc_b = st.selectbox(
            "Select second document",
            sources,
            index=default_b,
            key="compare_doc_b",
            label_visibility="collapsed",
        )

    if doc_a == doc_b:
        st.warning("Please select two **different** documents.")
        return

    # Custom comparison focus
    focus = st.text_input(
        "🎯 Comparison focus (optional)",
        placeholder="e.g., Compare their methodology, or focus on results...",
        key="compare_focus",
    )

    # Compare button
    if st.button("🔀 Compare Documents", type="primary", use_container_width=True):
        _run_comparison(doc_a, doc_b, focus)


def _run_comparison(doc_a: str, doc_b: str, focus: str = ""):
    """Run the comparison and display results."""
    with st.spinner("🔄 Analyzing and comparing documents..."):
        try:
            comparator = PaperComparator(
                vector_store=st.session_state.vector_store,
                llm_engine=st.session_state.llm_engine,
            )

            result = comparator.compare(doc_a, doc_b, focus=focus)

            st.markdown("---")
            st.markdown("### 📊 Comparison Results")
            st.markdown(
                f'<div class="glass-card">{result}</div>',
                unsafe_allow_html=True,
            )

        except Exception as e:
            st.error(f"❌ Comparison failed: {str(e)}")
