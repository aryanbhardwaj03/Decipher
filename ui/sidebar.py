"""
Sidebar Component.
Handles file upload, document management, and settings.
"""

import streamlit as st

import config
from utils.file_utils import (
    save_uploaded_file,
    delete_uploaded_file,
    get_uploaded_files,
    get_file_type,
    format_file_size,
)
from core.document_processor import DocumentProcessor
from core.ocr_engine import OCREngine


def render_sidebar():
    """Render the sidebar with upload and settings."""
    with st.sidebar:
        # ── Logo & Title ─────────────────────────────────────────
        st.markdown(
            '<div class="app-header">🔬 Research AI</div>',
            unsafe_allow_html=True,
        )
        st.markdown(
            '<div class="app-subtitle">Upload papers. Ask anything.</div>',
            unsafe_allow_html=True,
        )

        st.markdown("---")

        # ── LLM Status ───────────────────────────────────────────
        _render_llm_status()

        st.markdown("---")

        # ── File Upload ──────────────────────────────────────────
        _render_upload_section()

        st.markdown("---")

        # ── Document List ────────────────────────────────────────
        _render_document_list()

        st.markdown("---")

        # ── Settings ─────────────────────────────────────────────
        _render_settings()


def _render_llm_status():
    """Show LLM connection status."""
    if "llm_engine" in st.session_state:
        llm = st.session_state.llm_engine
        is_available = llm.is_available()
        if is_available:
            st.markdown(
                '<span class="status-badge status-online">● LLM Connected</span>',
                unsafe_allow_html=True,
            )
        else:
            st.markdown(
                '<span class="status-badge status-offline">● LLM Offline</span>',
                unsafe_allow_html=True,
            )
            st.caption(f"Start Ollama: `ollama serve`\nThen: `ollama pull {config.OLLAMA_MODEL}`")


def _render_upload_section():
    """Render file upload widget."""
    st.markdown("### 📤 Upload Documents")

    uploaded_files = st.file_uploader(
        "Drop PDFs or images here",
        type=["pdf", "png", "jpg", "jpeg"],
        accept_multiple_files=True,
        key="file_uploader",
        label_visibility="collapsed",
    )

    if uploaded_files:
        for uploaded_file in uploaded_files:
            # Check if already processed
            if uploaded_file.name in st.session_state.get("processed_files", set()):
                continue

            with st.spinner(f"Processing {uploaded_file.name}..."):
                _process_uploaded_file(uploaded_file)


def _process_uploaded_file(uploaded_file):
    """Process and index an uploaded file."""
    # Initialize tracking set
    if "processed_files" not in st.session_state:
        st.session_state.processed_files = set()

    # Save file
    file_path = save_uploaded_file(uploaded_file)
    file_type = get_file_type(uploaded_file.name)

    processor = DocumentProcessor()

    if file_type == "pdf":
        # Check if scanned
        if processor.is_scanned_pdf(str(file_path)):
            st.info("📸 Scanned PDF detected. Running OCR...")
            try:
                ocr = OCREngine()
                ocr_text = ocr.process_pdf(str(file_path))
                # Create chunks from OCR text
                from core.document_processor import DocumentChunk
                from langchain_text_splitters import RecursiveCharacterTextSplitter

                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=config.CHUNK_SIZE,
                    chunk_overlap=config.CHUNK_OVERLAP,
                )
                chunks_text = splitter.split_text(ocr_text)
                result = {
                    "chunks": [
                        DocumentChunk(
                            text=t,
                            metadata={
                                "source": uploaded_file.name,
                                "page": 0,
                                "chunk_index": i,
                                "type": "ocr",
                            },
                        )
                        for i, t in enumerate(chunks_text)
                    ],
                    "images": [],
                    "tables": [],
                    "metadata": {"source": uploaded_file.name},
                }
            except Exception as e:
                st.warning(f"OCR failed: {e}. Falling back to standard extraction.")
                result = processor.process_pdf(str(file_path))
        else:
            result = processor.process_pdf(str(file_path))
    elif file_type == "image":
        result = processor.process_image(str(file_path))
    else:
        st.error(f"Unsupported file type: {file_type}")
        return

    # Add to vector store
    if result["chunks"] and "vector_store" in st.session_state:
        num_added = st.session_state.vector_store.add_chunks(result["chunks"])
        st.success(f"✅ Indexed **{uploaded_file.name}** — {num_added} chunks")

    # Store images for vision features
    if result["images"]:
        if "document_images" not in st.session_state:
            st.session_state.document_images = {}
        st.session_state.document_images[uploaded_file.name] = result["images"]

    # Mark as processed
    st.session_state.processed_files.add(uploaded_file.name)

    # Store document metadata
    if "document_metadata" not in st.session_state:
        st.session_state.document_metadata = {}
    st.session_state.document_metadata[uploaded_file.name] = result.get("metadata", {})


def _render_document_list():
    """Show list of indexed documents."""
    st.markdown("### 📚 Documents")

    if "vector_store" not in st.session_state or st.session_state.vector_store.size == 0:
        st.caption("No documents indexed yet.")
        return

    sources = st.session_state.vector_store.get_sources()

    for source in sources:
        meta = st.session_state.get("document_metadata", {}).get(source, {})
        pages = meta.get("total_pages", "?")
        size = meta.get("file_size_mb", "?")

        col1, col2 = st.columns([5, 1])
        with col1:
            icon = "📄" if source.lower().endswith(".pdf") else "🖼️"
            st.markdown(
                f"""<div class="doc-card">
                    <span class="doc-icon">{icon}</span>
                    <div class="doc-info">
                        <div class="doc-name">{source}</div>
                        <div class="doc-meta">{pages} pages · {size} MB</div>
                    </div>
                </div>""",
                unsafe_allow_html=True,
            )
        with col2:
            if st.button("🗑️", key=f"del_{source}", help=f"Remove {source}"):
                st.session_state.vector_store.remove_source(source)
                st.session_state.processed_files.discard(source)
                delete_uploaded_file(source)
                st.rerun()

    # Stats
    total_chunks = st.session_state.vector_store.size
    st.markdown(
        f"""<div class="metric-card" style="margin-top: 0.8rem;">
            <div class="metric-value">{total_chunks}</div>
            <div class="metric-label">Total Chunks Indexed</div>
        </div>""",
        unsafe_allow_html=True,
    )


def _render_settings():
    """Render model settings."""
    with st.expander("⚙️ Settings", expanded=False):
        st.session_state.temperature = st.slider(
            "Temperature",
            min_value=0.0,
            max_value=1.0,
            value=config.LLM_TEMPERATURE,
            step=0.1,
            key="temp_slider",
        )

        st.session_state.top_k = st.slider(
            "Retrieved Chunks (Top-K)",
            min_value=1,
            max_value=15,
            value=config.RETRIEVAL_TOP_K,
            step=1,
            key="topk_slider",
        )

        st.markdown(f"**Model:** `{config.OLLAMA_MODEL}`")
        st.markdown(f"**Embeddings:** `{config.EMBEDDING_MODEL}`")

        if st.button("🗑️ Clear All Data", type="secondary"):
            if "vector_store" in st.session_state:
                st.session_state.vector_store.clear()
            st.session_state.processed_files = set()
            st.session_state.document_images = {}
            st.session_state.document_metadata = {}
            st.session_state.chat_history = []
            st.success("All data cleared.")
            st.rerun()
