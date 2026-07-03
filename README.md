<div align="center">
  <img src="./assets/hero.png" alt="Decipher Logo" width="600" />
  
  <h3 align="center">Your Intelligent Study Companion</h3>

  <p align="center">
    Transform how you interact with your documents. Instantly unlock interactive chats, automated summaries, quizzes, and flashcards.
    <br />
    <a href="https://github.com/aryanbhardwaj03/Decipher"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="#">View Demo</a>
    ·
    <a href="https://github.com/aryanbhardwaj03/Decipher/issues">Report Bug</a>
    ·
    <a href="https://github.com/aryanbhardwaj03/Decipher/issues">Request Feature</a>
  </p>
</div>

---

## 🚀 About Decipher

**Decipher** is not just another PDF viewer—it's a comprehensive AI study assistant designed to help students, researchers, and professionals extract knowledge from their documents faster than ever before.

By combining cutting-edge Large Language Models (LLMs) with Vector Search (RAG), Decipher allows you to converse directly with your notes, auto-generate study materials, and build a personalized knowledge base.

![Decipher Dashboard](./assets/dashboard.png)

### 🌟 Why Decipher?

- **Conversational Document Chat**: Chat directly with your documents. Ask questions and get answers with precise, clickable page citations.
- **Smart Summarization**: Generate instant, comprehensive summaries of lengthy study materials.
- **Auto-Generated Quizzes**: Test your knowledge with AI-generated multiple-choice questions based directly on your document's content.
- **Interactive Flashcards**: Quickly review key concepts with auto-generated flashcards.
- **Seamless Onboarding**: Simple, secure sign-in with Google OAuth.

![Decipher Navigation & Tools](./assets/navigation.png)

---

## 📸 Sneak Peek

### The AI Summarizer
No more reading 100-page documents to find the main idea. Upload your file, and let Decipher distill it for you.
![AI Summarizer](./assets/summarizer.png)

### Secure Login
Your documents are securely stored and tied to your account across all your devices.
<div align="center">
  <img src="./assets/login.png" alt="Secure Login" width="500" />
</div>

---

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

---

## 💻 Getting Started

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

---

## 🌐 Deployment

Decipher is designed to be easily deployed:
- **Frontend**: Optimized for deployment on [Vercel](https://vercel.com).
- **Backend**: Can be hosted on [Hugging Face Spaces](https://huggingface.co/spaces) (using Docker) or platforms like Render and Railway.

## 📄 License

This project is licensed under the MIT License.
