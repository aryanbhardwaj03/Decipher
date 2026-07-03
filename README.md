# Decipher — AI-Powered 

![Decipher Hero Image](https://via.placeholder.com/1200x600/09090b/ea580c?text=Decipher+-+Unlock+Your+Documents)

Decipher is an intelligent, AI-powered study companion that transforms how you interact with your documents. Upload PDFs, Word documents, or presentations, and instantly unlock interactive chats, automated summaries, quizzes, and flashcards.

## 🌟 Key Features

- **Conversational Document Chat (RAG)**: Chat directly with your documents. Ask questions and get answers with precise page citations.
- **Smart Summarization**: Generate instant, comprehensive summaries of lengthy study materials.
- **Auto-Generated Quizzes**: Test your knowledge with AI-generated multiple-choice questions based directly on your document's content.
- **Interactive Flashcards**: Quickly review key concepts with auto-generated flashcards.
- **Multi-Format Support**: Upload PDFs, DOCX, PPTX, TXT, and Markdown files.
- **Rich Document Viewer**: View your documents side-by-side while chatting, with clickable page citations that jump straight to the source.
- **Sleek, Modern UI**: Built with a beautiful, responsive dark-mode-first interface using Tailwind CSS and glassmorphism design.

## 🏗️ Architecture

Decipher is built using a modern, scalable tech stack:

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State & UI**: Framer Motion, Lucide Icons, Custom UI Components
- **Authentication**: Google OAuth

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: PostgreSQL with [pgvector](https://github.com/pgvector/pgvector) for vector search via SQLAlchemy
- **AI / LLMs**: 
  - **Text Generation**: [Groq](https://groq.com/) (Llama-3.1-8b-instant) for ultra-fast, high-quality responses.
  - **Embeddings**: [Google Gemini](https://ai.google.dev/) (`gemini-embedding-001`) for 768-dimensional document vectorization.
- **Document Processing**: PyMuPDF, OCR integrations for text extraction.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- PostgreSQL database with the `pgvector` extension installed
- API Keys for Groq and Google Gemini

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your environment variables in `.env`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/decipher
   GEMINI_API_KEY=your_gemini_key
   GROQ_API_KEY=your_groq_key
   LLM_PROVIDER=groq
   ```
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment

Decipher is designed to be easily deployed:
- **Frontend**: Optimized for deployment on [Vercel](https://vercel.com).
- **Backend**: Can be hosted on [Hugging Face Spaces](https://huggingface.co/spaces) (using Docker) or platforms like Render and Railway.

## 📄 License

This project is licensed under the MIT License.
