# 🧠 DocIntel — AI Document Intelligence Platform

> Extract structured data from PDFs, invoices, contracts, and receipts using OCR + LLM + RAG.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)
![React](https://img.shields.io/badge/React-18-61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎯 Overview

DocIntel is an end-to-end AI-powered document intelligence platform that converts unstructured documents into structured and searchable information.

The platform allows users to:

- 📤 Upload PDFs and images
- 🔍 Extract text using OCR
- 🧠 Understand documents using an LLM through Groq
- 📊 Extract structured information into JSON
- ✅ Validate and clean extracted data
- 💬 Ask questions about documents using RAG
- 📚 Search across documents
- 📥 Work with structured document data

---

## ✨ Features

### 📄 Document Processing

- PDF and image upload support
- Multi-page PDF processing
- PDF-to-image conversion
- OCR text extraction
- OCR confidence scores
- Page-level processing
- Support for PNG, JPG/JPEG, TIFF, and BMP

### 🧠 AI Document Extraction

- Automatic document type classification
- Invoice extraction
- Receipt extraction
- Contract extraction
- Generic document extraction
- Structured JSON output
- OCR error correction
- Date and amount normalization
- Line-item extraction

### ✅ Data Validation

The platform includes a validation layer for cleaning and verifying extracted information.

Examples:

- Date normalization
- Amount normalization
- Text cleanup
- Line-item cleanup
- Subtotal validation
- Tax validation
- Total validation
- Missing-field calculation
- Tax-rate calculation where possible

For invoices, the system can verify relationships such as:

```text
Subtotal + Tax ≈ Total
```

### 💬 RAG Document Chat

DocIntel supports document-based question answering using Retrieval-Augmented Generation (RAG).

Features include:

- Semantic document search
- Natural-language Q&A
- Document-specific conversations
- Cross-document queries
- Chat history
- Source references
- Similarity scores
- Embedding-based retrieval

---

## 🔐 Authentication

The backend uses:

- JWT authentication
- bcrypt password hashing
- Protected API routes
- User-based document access
- Bearer-token authentication from the frontend

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | FastAPI |
| Language | Python 3.11 |
| Database | MongoDB |
| OCR | Tesseract |
| PDF Processing | PyMuPDF |
| LLM | Groq |
| LLM Model | `openai/gpt-oss-120b` |
| Embeddings | Sentence Transformers |
| Vector Database | ChromaDB |
| Authentication | JWT + bcrypt |
| API Client | Axios |

---

## 🏗️ Architecture

```text
                         ┌───────────────────┐
                         │       User        │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  React Frontend   │
                         │      Vercel       │
                         └─────────┬─────────┘
                                   │
                              REST API
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  FastAPI Backend  │
                         │      Render       │
                         └─────────┬─────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
       ┌────────────┐       ┌────────────┐       ┌────────────┐
       │  Tesseract │       │    Groq    │       │  MongoDB   │
       │    OCR     │       │    LLM     │       │   Atlas    │
       └────────────┘       └────────────┘       └────────────┘
                                   │
                                   ▼
                           ┌────────────────┐
                           │  RAG Pipeline  │
                           │ Embeddings     │
                           │ ChromaDB       │
                           │ Retrieval      │
                           └────────────────┘
```

---

## 📁 Project Structure

```text
doc-intelligence/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── documents.py
│   │   │   ├── extraction.py
│   │   │   └── chat.py
│   │   ├── auth/
│   │   ├── models/
│   │   ├── services/
│   │   │   ├── pdf_service.py
│   │   │   ├── ocr_service.py
│   │   │   ├── llm_service.py
│   │   │   ├── prompt_templates.py
│   │   │   ├── extraction_service.py
│   │   │   ├── validation_service.py
│   │   │   ├── embedding_service.py
│   │   │   ├── vector_service.py
│   │   │   └── rag_service.py
│   │   └── utils/
│   ├── uploads/
│   ├── processed/
│   ├── vectordb/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── .env.example
│
├── docker-compose.yml
├── render.yaml
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

Install the following before running the project:

- Python 3.11+
- Node.js 18+
- MongoDB or MongoDB Atlas
- Tesseract OCR
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/doc-intelligence.git
cd doc-intelligence
```

---

## ⚙️ Backend Setup

Open a terminal and go to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

### Windows PowerShell

```powershell
.env\Scripts\Activate.ps1
```

### Windows CMD

```cmd
venv\Scriptsctivate
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Create your environment file from:

```text
backend/.env.example
```

and save it as:

```text
backend/.env
```

Configure MongoDB, JWT, Groq, and other required values.

Run the backend:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

Swagger API documentation:

```text
http://localhost:8000/docs
```

Health check:

```text
http://localhost:8000/health
```

---

## 🎨 Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

For local development, create:

```text
frontend/.env.development
```

Example:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
```

Start the frontend:

```bash
npm start
```

Frontend:

```text
http://localhost:3000
```

---

## 🔐 Environment Variables

Never commit real secrets or credentials to GitHub.

### Backend Example

```env
ENV=development
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=doc_intelligence_dev
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-120b
ALLOWED_ORIGINS=http://localhost:3000
MAX_FILE_SIZE=52428800
```

### Frontend Development

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
```

### Production Frontend

The production frontend should use the deployed Render backend URL:

```env
REACT_APP_API_URL=https://your-production-backend.onrender.com
REACT_APP_ENV=production
```

Environment files containing real secrets should remain local and should be excluded by `.gitignore`.

---

## 🌐 Deployment

The planned deployment architecture is:

```text
Frontend
   │
   ▼
Vercel
   │
   ▼
FastAPI Backend
   │
   ▼
Render
   │
   ├── MongoDB Atlas
   └── Groq API
```

### Frontend

Deploy the React application to Vercel.

Configure:

```text
REACT_APP_API_URL
REACT_APP_ENV
```

The frontend uses the production Render backend URL after deployment.

### Backend

Deploy the FastAPI application to Render.

Configure the required backend environment variables in Render.

The backend should listen on the port provided by the hosting platform.

### Database

For production, use MongoDB Atlas rather than a local MongoDB instance.

---

## 🐳 Docker

Docker configuration can be used for local or deployment environments.

Build and start the services:

```bash
docker compose up --build
```

Stop the services:

```bash
docker compose down
```

---

## 🔒 Security

- Never commit `.env` files.
- Never commit API keys.
- Never commit database passwords.
- Use strong JWT secrets in production.
- Configure CORS with trusted frontend origins.
- Store production secrets in the hosting platform's environment variables.
- Do not expose MongoDB credentials in frontend code.

---

## 📊 API Documentation

When the backend is running, FastAPI automatically provides:

### Swagger UI

```text
http://localhost:8000/docs
```

### OpenAPI Schema

```text
http://localhost:8000/openapi.json
```

---

## 🧪 Local Development

Recommended workflow:

1. Start MongoDB or connect to MongoDB Atlas.
2. Start the FastAPI backend.
3. Start the React frontend.
4. Register/login to the application.
5. Upload a document.
6. Run document extraction.
7. Review extracted and validated data.
8. Use document chat for RAG-based questions.

---

## 📌 Project Status

DocIntel is an end-to-end document intelligence application combining:

- OCR
- PDF processing
- LLM-based document understanding
- Structured extraction
- Data validation
- Embeddings
- Vector search
- RAG
- Authentication
- Document chat

The project is designed as a full-stack AI application suitable for demonstrating practical AI, backend, frontend, database, and deployment skills.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Ravsaheb Bansode**

GitHub: `https://github.com/ravsaheb7841`

LinkedIn: `https://linkedin.com/in/ravsaheb-bansode`