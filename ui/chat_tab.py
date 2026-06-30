"""
Chat Tab.
Main chat interface for asking questions about uploaded documents.
"""

import streamlit as st

import config


def render_chat_tab():
    """Render the chat interface tab."""
    st.markdown(
        '<div class="animate-fade-in">'
        "<h2>💬 Ask Your Documents</h2>"
        "</div>",
        unsafe_allow_html=True,
    )

    # Check if documents are loaded
    if "vector_store" not in st.session_state or st.session_state.vector_store.size == 0:
        st.info("📤 Upload a PDF or image in the sidebar to get started.")
        _render_example_questions()
        return

    # Initialize chat history
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    # Render chat history
    _render_chat_history()

    # Chat input
    user_input = st.chat_input(
        "Ask a question about your research papers...",
        key="chat_input",
    )

    if user_input:
        _handle_user_message(user_input)


def _render_example_questions():
    """Show example questions when no documents are loaded."""
    st.markdown("### 💡 Example Questions")

    examples = [
        "📝 Summarize this research paper",
        "🔍 What is the main methodology used?",
        "📊 Explain the results in Table 2",
        "🧪 What are the key findings?",
        "⚠️ What are the limitations of this study?",
        "📋 Generate quiz questions from this paper",
    ]

    cols = st.columns(2)
    for i, example in enumerate(examples):
        with cols[i % 2]:
            st.markdown(
                f'<div class="glass-card" style="font-size: 0.85rem;">{example}</div>',
                unsafe_allow_html=True,
            )


def _render_chat_history():
    """Render the chat message history."""
    for message in st.session_state.chat_history:
        role = message["role"]
        content = message["content"]

        if role == "user":
            with st.chat_message("user", avatar="🧑‍🔬"):
                st.markdown(content)
        else:
            with st.chat_message("assistant", avatar="🤖"):
                st.markdown(content)

                # Show sources if available
                if "sources" in message:
                    _render_sources(message["sources"])


def _handle_user_message(user_input: str):
    """Process a user message and generate a response."""
    # Add user message to history
    st.session_state.chat_history.append({"role": "user", "content": user_input})

    # Display user message
    with st.chat_message("user", avatar="🧑‍🔬"):
        st.markdown(user_input)

    # Generate response
    with st.chat_message("assistant", avatar="🤖"):
        retriever = st.session_state.get("retriever")
        if retriever is None:
            st.error("LLM not initialized. Please check your Ollama connection.")
            return

        # Get retrieval results for source display
        top_k = st.session_state.get("top_k", config.RETRIEVAL_TOP_K)
        results = retriever.retrieve(user_input, top_k=top_k)
        context = retriever.build_context(results)

        from utils.prompt_templates import RAG_SYSTEM_PROMPT, build_rag_prompt

        prompt = build_rag_prompt(user_input, context)

        # Stream the response
        response_placeholder = st.empty()
        full_response = ""

        try:
            llm = st.session_state.llm_engine
            temp = st.session_state.get("temperature", config.LLM_TEMPERATURE)

            for chunk in llm.generate_stream(
                prompt=prompt,
                system_prompt=RAG_SYSTEM_PROMPT,
                temperature=temp,
            ):
                full_response += chunk
                response_placeholder.markdown(full_response + "▌")

            response_placeholder.markdown(full_response)

        except Exception as e:
            full_response = f"❌ Error generating response: {str(e)}\n\nPlease check that Ollama is running (`ollama serve`) and the model is downloaded (`ollama pull {config.OLLAMA_MODEL}`)."
            response_placeholder.markdown(full_response)

        # Extract sources
        sources = []
        seen = set()
        for r in results:
            source = r["metadata"].get("source", "Unknown")
            page = r["metadata"].get("page", "?")
            key = f"{source}_p{page}"
            if key not in seen:
                sources.append({"source": source, "page": page, "score": r["score"]})
                seen.add(key)

        if sources:
            _render_sources(sources)

        # Save to history
        st.session_state.chat_history.append(
            {
                "role": "assistant",
                "content": full_response,
                "sources": sources,
            }
        )


def _render_sources(sources: list[dict]):
    """Render source citations."""
    if not sources:
        return

    st.markdown("---")
    st.markdown("**📎 Sources:**")
    tags = ""
    for s in sources[:5]:
        score_pct = int(s["score"] * 100)
        tags += (
            f'<span class="source-tag">'
            f'📄 {s["source"]} · p.{s["page"]} · {score_pct}%'
            f"</span> "
        )
    st.markdown(tags, unsafe_allow_html=True)
