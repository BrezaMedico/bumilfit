# BumilFit Monorepo

BumilFit adalah platform pendamping kesehatan dan kebugaran komprehensif untuk ibu hamil berbasis web, dilengkapi dengan backend API, database PostgreSQL (Neon DB / Prisma), dan asisten AI pintar (Google Gemini).

## 📁 Struktur Monorepo

```
bumilfit-monorepo/
├── backend/          # REST API (Express, TypeScript, Prisma, Neon DB)
├── frontend/         # Web App (React 19, TypeScript, Tailwind CSS, Lucide Icons)
├── package.json      # Monorepo configuration
└── README.md
```

## 🚀 Panduan Memulai (Getting Started)

### 1. Prasyarat
- **Node.js**: v18+ atau v20+
- **NPM** atau **Yarn**

### 2. Instalasi Dependencies
Jalankan perintah berikut di root folder untuk menginstal dependency:
```bash
npm install
```

### 3. Konfigurasi Environment Variables

#### Backend (`backend/.env`)
Salin template dari `backend/.env.example` ke `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET="your-secret-key-here"
GEMINI_API_KEY="your-gemini-api-key-here"
```

#### Frontend (`frontend/.env`)
Salin template dari `frontend/.env.example` ke `frontend/.env`:
```env
VITE_GEMINI_API_KEY="your-gemini-api-key-here"
```

### 4. Database Setup & Migration (Backend)
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 5. Menjalankan Aplikasi

#### Backend (Development Server):
```bash
cd backend
npm run dev
```

#### Frontend (Development Server):
```bash
cd frontend
npm run dev
```

---

## 🛠️ Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, Neon PostgreSQL, JWT, BCrypt
- **AI Integration**: Google Gemini API
