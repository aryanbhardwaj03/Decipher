---
title: Decipher
emoji: 🧠
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---
<div align="center">

# 🧠 Decipher
### AI-Powered Document Intelligence Platform

Transform PDFs, DOCX, PPT, TXT, and other documents into interactive learning experiences using **Large Language Models (LLMs)** and **Retrieval-Augmented Generation (RAG)**.

<p align="center">
  <img src="./assets/dashboard.png" alt="Decipher Dashboard" width="900"/>
</p>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

🌐 **Live Demo:** https://decipherr.vercel.app

</div>

---

# 📖 About

**Decipher** is an AI-powered study companion that helps students, researchers, and professionals understand documents faster.

Instead of reading hundreds of pages manually, users can upload documents and instantly:

- 💬 Chat with documents
- 📝 Generate AI summaries
- 🧠 Create flashcards
- ❓Generate quizzes
- 📚 Produce study notes
- 🔍 Extract key insights

Built using **LLMs**, **Vector Search**, and **Retrieval-Augmented Generation (RAG)**, Decipher delivers context-aware responses grounded in the uploaded documents.

---

# ✨ Features

## 📄 AI Document Summarizer

Upload your study material and receive concise AI-generated summaries within seconds.

<p align="center">
<img src="./assets/summarizer.png" width="900">
</p>

---

## 💬 Intelligent Document Chat

Ask natural language questions and receive context-aware answers directly from your uploaded documents.

- Context-aware responses
- Source-grounded answers
- Fast inference using Groq API
- RAG-powered retrieval

---

## 📚 Study Tools

Generate learning resources automatically:

- 📝 AI Notes
- 🧠 Flashcards
- ❓Quizzes
- 📊 Key Insights
- 📄 Smart Summaries

---

## 🧭 Clean & Modern Navigation

Everything is organized into intuitive study tools.

<p align="center">
<img src="./assets/navigation.png" width="900">
</p>

---

## 🔐 Secure Authentication

Users can securely create an account or continue with Google Authentication.

<p align="center">
<img src="./assets/login.png" width="550">
</p>

Features:

- Google OAuth
- Secure Sessions
- Cross-device Sync

---

# 🖥 Dashboard

A modern workspace where users upload documents, manage files, and access AI tools.

<p align="center">
<img src="./assets/dashboard.png" width="900">
</p>

Dashboard Features

- Upload PDFs, DOCX, PPTX & TXT
- AI Chat
- Flashcards
- Summaries
- Notes
- Quizzes
- Search Documents
- Recent Activity
- Progress Tracking

---

# 🏗 Tech Stack

## Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide Icons

---

## Backend

- FastAPI
- Python
- SQLAlchemy
- PostgreSQL
- pgvector

---

## AI Stack

- Groq API
- Llama 3.1 Instant
- Google Gemini Embeddings
- Retrieval-Augmented Generation (RAG)
- Vector Embeddings

---

## Authentication

- Google OAuth

---

## Payments

- Razorpay

Premium subscription support with secure payment processing.

---

## DevOps

- Docker
- Vercel
- GitHub

---

# ⚙ Architecture

```
                User
                  │
                  ▼
         Next.js Frontend
                  │
                  ▼
          FastAPI Backend
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
 PostgreSQL   Groq API   Gemini Embeddings
     │
     ▼
 pgvector Database
     │
     ▼
 Retrieval-Augmented Generation
     │
     ▼
 AI Responses
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/aryanbhardwaj03/Decipher.git

cd Decipher
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

source venv/bin/activate
# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

Create `.env`

```env
DATABASE_URL=

GROQ_API_KEY=

GEMINI_API_KEY=

LLM_PROVIDER=groq
```

Run server

```bash
uvicorn main:app --reload
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Create `.env.local`

```env
NEXT_PUBLIC_API_URL=

NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

Open

```
http://localhost:3000
```

---

# 📂 Supported Files

- PDF
- DOCX
- PPT
- PPTX
- TXT

---

# 🎯 Future Roadmap

- ✅ AI Chat
- ✅ Flashcards
- ✅ Notes
- ✅ Summaries
- ✅ Quizzes
- ✅ Google Authentication
- ✅ Razorpay Integration
- 🔄 Team Collaboration
- 🔄 Mobile Application
- 🔄 Voice Conversations
- 🔄 AI Mind Maps
- 🔄 Citation Export
- 🔄 Multi-language Support

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository

2. Create a feature branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Added new feature"
```

4. Push changes

```bash
git push origin feature-name
```

5. Open a Pull Request

---

# 🌐 Live Demo

**Website**

https://decipherr.vercel.app

---

# 👨‍💻 Author

**Aryan Bhardwaj**

- LinkedIn: https://linkedin.com/in/aryanbhardwaj03
- GitHub: https://github.com/aryanbhardwaj03

---

# ⭐ Support

If you found this project helpful,

⭐ Star the repository

🍴 Fork it

🧠 Share it with others

Your support motivates future development!

---

# 📜 License

This project is licensed under the **MIT License**.
