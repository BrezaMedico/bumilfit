<div align="center">
  
  # BumilFit 
  ### Personal Pregnancy Companion for Healthy Mother & Stunting-Free Generation
  
  [![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Site-success?style=for-the-badge)](bumilfit.vercel.app)
  [![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/BrezaMedico/bumilfit)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
  
  **Submission for ITECHNO CUP 2026 - Web Development**
  
  **By VIOLET**
  
</div>

---

## 📑 Daftar Isi

- [👥 Tim Developer](#-tim-developer)
- [🎯 Tentang Proyek](#-tentang-proyek)
  - [Latar Belakang](#latar-belakang)
  - [Solusi yang Ditawarkan](#solusi-yang-ditawarkan)
  - [Tujuan Proyek](#tujuan-proyek)
- [✨ Fitur Unggulan](#-fitur-unggulan)
  - [Fitur Utama](#fitur-utama)
  - [Fitur Tambahan](#fitur-tambahan)
- [📸 Demo & Screenshot](#-demo--screenshot)
- [🛠️ Teknologi](#️-teknologi)
  - [Tech Stack](#tech-stack)
  - [Alasan Pemilihan Teknologi](#alasan-pemilihan-teknologi)
  - [Dependencies Utama](#dependencies-utama)
- [🏗️ Arsitektur Sistem](#️-arsitektur-sistem)
  - [System Architecture](#system-architecture)
  - [Database Schema](#database-schema)
  - [Folder Structure](#folder-structure)
- [⚙️ Instalasi & Setup](#️-instalasi--setup)
- [🚀 Penggunaan](#-penggunaan)
- [📚 API Documentation](#-api-documentation)
- [📄 Lisensi](#-lisensi)

---

# 👥 Tim Developer

| Nama | Role | GitHub |
|---|---|---|
| **Breza Artha Medico** | Full Stack Developer | https://github.com/BrezaMedico |
| **Halipah Mubarok** | Technical Writer & UI/UX Designer | https://github.com/Shiin14 |
| **M. Fayyadh Al Barr H** | System Analyst & UI/UX Designer | https://github.com/Jaxc5 |

---

# 🎯 Tentang Proyek

## Latar Belakang

Stunting merupakan salah satu tantangan kesehatan di Indonesia. Upaya pencegahan stunting perlu dilakukan sejak periode **1.000 Hari Pertama Kehidupan (HPK)**, termasuk sejak masa kehamilan.

Dalam praktiknya, ibu hamil dapat menghadapi beberapa permasalahan, seperti:

- Kurangnya kepatuhan dalam mengkonsumsi Tablet Tambah Darah (TTD), vitamin, dan suplemen.
- Informasi mengenai kehamilan dan nutrisi yang tidak terstruktur serta adanya informasi atau mitos yang dapat menyesatkan.
- Jadwal pemeriksaan kehamilan atau **Antenatal Care (ANC)** yang dapat terlewat.
- Kesulitan dalam memantau aktivitas kesehatan dan kebutuhan nutrisi selama kehamilan.

Berdasarkan permasalahan tersebut, dibutuhkan sebuah platform digital yang dapat membantu ibu hamil dalam memantau aktivitas kesehatan, memperoleh informasi, mengingatkan jadwal penting, serta mendukung pemenuhan kebutuhan nutrisi selama kehamilan.

## Solusi yang Ditawarkan

**BumilFit** menawarkan pendekatan sebagai **personal pregnancy companion** yang mengintegrasikan berbagai kebutuhan ibu hamil ke dalam satu platform digital.

Solusi yang diberikan meliputi:

- **Smart Health Reminder** berbasis To-Do List untuk membantu pengguna lebih teratur menjalankan aktivitas kesehatan seperti konsumsi TTD, vitamin, suplemen, hidrasi, olahraga ringan, dan pemeriksaan ANC.
- **Kalkulator Kehamilan & EDD** untuk memberikan informasi usia kehamilan dan perkiraan tanggal persalinan berdasarkan data usia kehamilan saat registrasi.
- **Kalkulator Gizi dan Cek Gizi** untuk membantu pengguna memahami kebutuhan nutrisi harian serta memperoleh informasi kandungan gizi makanan melalui foto atau kamera.
- **AI Chatbot** sebagai pendamping informasi umum seputar kehamilan dan kesehatan secara interaktif.
- **Konsultasi Dokter** untuk memberikan akses yang lebih mudah kepada pengguna dalam memperoleh layanan konsultasi kesehatan.
- **Health Product Marketplace** yang memungkinkan pengguna memilih dan membeli produk kesehatan seperti vitamin, suplemen, dan kebutuhan kehamilan.
- **WhatsApp Reminder** untuk membantu menyampaikan pengingat aktivitas kesehatan kepada pengguna melalui WhatsApp.

Pendekatan BumilFit tidak hanya berfokus pada penyediaan informasi, tetapi juga mendorong pengguna untuk **mengubah informasi menjadi tindakan nyata** melalui pengingat, pencatatan aktivitas, pemantauan kebutuhan nutrisi, dan akses layanan kesehatan dalam satu ekosistem.

Dengan pendekatan tersebut, BumilFit diharapkan dapat membantu meningkatkan kesadaran dan keteraturan ibu hamil dalam menjaga kesehatan serta **berkontribusi dalam upaya pencegahan stunting sejak masa kehamilan**.

## Tujuan Proyek

- 🎯 **Tujuan Utama**: Membantu ibu hamil menerapkan pola hidup sehat, memenuhi kebutuhan nutrisi harian, serta memantau berbagai aktivitas kesehatan selama masa kehamilan secara lebih terarah.
- 📊 **Target Pengguna**: Ibu hamil yang membutuhkan pendamping digital untuk membantu memantau aktivitas kesehatan, kebutuhan nutrisi, informasi kehamilan, konsultasi dokter, dan akses produk kesehatan.
- 💡 **Value Proposition**: Menghadirkan pendamping kehamilan dalam satu platform yang menggabungkan Smart Health Reminder, kalkulator kehamilan dan EDD, kalkulator gizi, Cek Gizi berbasis AI, AI Chatbot, konsultasi dokter, serta akses produk kesehatan untuk mendukung kesehatan ibu dan berkontribusi pada upaya pencegahan stunting sejak masa kehamilan.
---

# ✨ Fitur Unggulan

## Fitur Utama

| Fitur | Deskripsi | Keunggulan |
|---|---|---|
| 📝 **Smart Health Reminder** | To-Do List yang membantu pengguna mengatur dan menyelesaikan aktivitas kesehatan selama kehamilan, seperti konsumsi TTD, vitamin, suplemen, minum air, olahraga ringan, dan pemeriksaan ANC. | Membantu pengguna lebih konsisten menjalankan aktivitas kesehatan harian melalui sistem pengingat dan pencatatan aktivitas. |
| 🤰 **Kalkulator Kehamilan & EDD** | Menampilkan usia kehamilan dan Estimated Due Date (EDD) berdasarkan usia kehamilan yang dimasukkan pengguna saat registrasi. | Memberikan informasi perkembangan kehamilan dan perkiraan waktu persalinan secara praktis dalam satu aplikasi. |
| 🥗 **Kalkulator Gizi** | Membantu pengguna menghitung kebutuhan nutrisi harian selama masa kehamilan. | Membantu pengguna memahami kebutuhan nutrisi harian sebagai bagian dari penerapan pola hidup sehat selama kehamilan. |
| 📸 **Cek Gizi** | Membantu pengguna memperoleh informasi mengenai kandungan gizi makanan atau minuman melalui upload foto atau pemindaian menggunakan kamera. | Mempermudah pengguna mendapatkan informasi gizi makanan secara praktis dengan memanfaatkan teknologi analisis berbasis AI. |
| 👨‍⚕️ **Konsultasi Dokter** | Menyediakan akses bagi pengguna untuk melakukan konsultasi dengan dokter melalui aplikasi. | Memudahkan pengguna mendapatkan akses konsultasi kesehatan tanpa harus berpindah ke platform lain. |
| 🤖 **AI Chatbot** | Membantu memberikan informasi umum seputar kehamilan dan kesehatan menggunakan teknologi AI. | Memberikan akses informasi secara interaktif dan cepat sebagai pendamping informasi kesehatan pengguna.|

> **Catatan:** Informasi dari AI Chatbot bersifat umum dan tidak menggantikan diagnosis maupun konsultasi langsung dengan tenaga kesehatan.

## Fitur Tambahan

### Action-Oriented Tracking

Pengguna tidak hanya mendapatkan informasi, tetapi juga dapat melakukan tracking aktivitas kesehatan melalui sistem To-Do List dan menandai aktivitas yang telah selesai.

### Early Stunting Prevention Focus

Fitur-fitur BumilFit dirancang untuk membantu meningkatkan perhatian terhadap kesehatan dan nutrisi sejak masa kehamilan sebagai bagian dari upaya pencegahan stunting.

### Lightweight & Responsive

Antarmuka dirancang agar mudah digunakan, ringan, dan responsif pada berbagai ukuran perangkat.

### Sistem Subscription

BumilFit menggunakan model monetisasi **Hybrid Monetization**, yaitu kombinasi antara komisi transaksi dan layanan berlangganan.

| Paket | Benefit |
|---|---|
| **Basic** | Konsultasi dokter gratis selama 1 minggu |
| **Pro** | Konsultasi dokter gratis selama 1 bulan |
| **Premium** | Konsultasi dokter gratis selama 3 bulan + cek gizi menggunakan kamera/upload foto |
| **Premium+** | Konsultasi dokter gratis selama 9 bulan + cek gizi menggunakan kamera/upload foto |

---

# 📸 Demo & Screenshot

## Live Demo

**URL:** bumilfit.vercel.app
### Screenshot Aplikasi

<div align="center">
  <img src="screeenshot/homepage" alt="Homepage" width="800"/>
  <p><em>Homepage - Tampilan utama aplikasi</em></p>

  <img src="[Sesuaikan dengan URL atau path screenshot Smart Health Reminder]" alt="Smart Health Reminder" width="800"/>
  <p><em>Smart Health Reminder - To-Do List untuk aktivitas kesehatan ibu hamil</em></p>

  <img src="[Sesuaikan dengan URL atau path screenshot Kalkulator Gizi & Cek Gizi]" alt="Kalkulator Gizi & Cek Gizi" width="800"/>
  <p><em>Kalkulator Gizi & Cek Gizi - Fitur untuk membantu pengguna memahami kebutuhan dan kandungan gizi</em></p>

  <img src="[Sesuaikan dengan URL atau path screenshot Konsultasi Dokter]" alt="Konsultasi Dokter" width="800"/>
  <p><em>Konsultasi Dokter - Fitur untuk mengakses layanan konsultasi kesehatan</em></p>

  <img src="[Sesuaikan dengan URL atau path screenshot Komunitas]" alt="Komunitas" width="800"/>
  <p><em>Komunitas - Ruang interaksi dan berbagi informasi bagi ibu hamil</em></p>

  <img src="[Sesuaikan dengan URL atau path screenshot Pembelian Obat]" alt="Pembelian Obat" width="800"/>
  <p><em>Pembelian Obat - Halaman untuk memilih dan membeli produk kesehatan seperti obat, vitamin, dan suplemen</em></p>
</div>


---

# 🛠️ Teknologi

## Tech Stack

### Frontend

| Teknologi | Penggunaan |
|---|---|
| React | Library utama untuk membangun antarmuka aplikasi |
| TypeScript | Type safety pada pengembangan aplikasi |
| Vite | Development server dan build tool |
| Tailwind CSS | Styling dan responsive UI |
| Zustand | Global state management |
| Lucide React | Icon pada antarmuka |
| Canvas Confetti | Efek visual pada interaksi tertentu |

### Backend & API

| Teknologi | Penggunaan |
|---|---|
| Node.js | Runtime backend |
| Express.js | Framework untuk REST API |
| TypeScript | Type safety pada backend |
| Prisma ORM | Interaksi dengan database |
| JWT | Authentication |
| BCrypt | Password hashing |
| Google Gemini API | AI dan fitur berbasis kecerdasan buatan |

### Database

| Teknologi | Penggunaan |
|---|---|
| Neon PostgreSQL | Cloud PostgreSQL database |

### Supporting Tools

| Teknologi | Penggunaan |
|---|---|
| Axios | HTTP Client |
| Zod | Data validation |
| Git | Version control |
| GitHub | Repository dan collaboration |

## DevOps & Tools

| Bagian | Teknologi |
|---|---|
| Version Control | Git & GitHub |
| Deployment | Vercel / Render |
| CI/CD | **Monorepo + GitHub** dengan deployment otomatis. **Frontend (Vercel)** melakukan build menggunakan `npm run build` dan otomatis deploy saat terdapat commit/push ke branch `main`. **Backend (Render)** melakukan build menggunakan `npm install && npx prisma generate && npm run build`, kemudian menjalankan `npm run start`. **Database (Neon PostgreSQL)** menggunakan Prisma ORM untuk sinkronisasi skema melalui `npx prisma db push`. |

## Alasan Pemilihan Teknologi

| Teknologi | Alasan Pemilihan |
|-----------|------------------|
| **React + TypeScript** | Digunakan untuk membangun antarmuka yang modular, interaktif, dan lebih mudah dipelihara dengan dukungan type safety dari TypeScript. |
| **Vite** | Digunakan sebagai build tool karena menyediakan development environment yang cepat dan proses build yang efisien. |
| **Tailwind CSS** | Digunakan untuk mempercepat proses pengembangan UI serta membantu membuat tampilan yang responsive dan konsisten. |
| **Node.js + Express.js** | Digunakan untuk membangun backend dan RESTful API yang menangani proses autentikasi, data pengguna, transaksi, serta komunikasi dengan database. |
| **PostgreSQL + Neon** | Digunakan sebagai database relasional untuk menyimpan data pengguna, profil kehamilan, aktivitas, transaksi, dan data aplikasi lainnya. |
| **Prisma ORM** | Digunakan untuk mempermudah pengelolaan database dan interaksi antara backend dengan PostgreSQL. |
| **Zustand** | Digunakan untuk mengelola state global aplikasi, termasuk state yang berkaitan dengan shopping cart. |
| **Google Gemini API** | Digunakan untuk mendukung fitur berbasis AI seperti AI Chatbot dan analisis informasi gizi. |
| **Axios** | Digunakan untuk mempermudah komunikasi antara frontend dan backend melalui HTTP request. |
| **Zod** | Digunakan untuk melakukan validasi data agar input pengguna sesuai dengan format yang telah ditentukan. |
| **Lucide React** | Digunakan sebagai library ikon untuk meningkatkan tampilan dan konsistensi antarmuka aplikasi. |
| **JSON Web Token (JWT)** | Digunakan untuk mendukung autentikasi berbasis token dan pengelolaan sesi pengguna. |
| **BCrypt** | Digunakan untuk melakukan password hashing sebelum password disimpan ke database. |


## Dependencies Utama
```
{
  "dependencies": {
    "react": "^19.2.8",
    "typescript": "~7.0.2",
    "vite": "^8.2.0",
    "tailwindcss": "^4.3.3",
    "zustand": "^5.0.15",
    "axios": "^1.19.0",
    "zod": "^4.4.3",
    "lucide-react": "^1.33.0",
    "express": "^5.2.1",
    "prisma": "^7.9.1",
    "jsonwebtoken": "^9.0.3",
    "bcrypt": "^6.0.0"
  }
}

```
---

# 🏗️ Arsitektur Sistem

## System Architecture

```text
┌──────────────────────────────┐
│          User / Bumil        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      React Frontend          │
│      + Tailwind CSS          │
└──────────────┬───────────────┘
               │
               │ REST API
               ▼
┌──────────────────────────────┐
│      Express.js Backend      │
│                              │
│  ┌────────────────────────┐  │
│  │ Authentication / JWT   │  │
│  ├────────────────────────┤  │
│  │ Controllers            │  │
│  ├────────────────────────┤  │
│  │ Services               │  │
│  ├────────────────────────┤  │
│  │ Routes                 │  │
│  └────────────────────────┘  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│          Prisma ORM          │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       Neon PostgreSQL        │
│                              │
│  Users / Profiles            │
│  Activities / Orders         │
│  Application Data            │
└──────────────────────────────┘
```
---

## Database Schema

Database BumilFit menggunakan **PostgreSQL** dengan **Prisma ORM** sebagai ORM untuk mengelola struktur dan relasi data.

Diagram database:

![Database Schema]( [Sesuaikan dengan path atau URL ERD database BumilFit] )

> **Catatan:** Diagram di atas menggambarkan struktur tabel, atribut, primary key (PK), foreign key (FK), serta relasi antar-entitas yang digunakan dalam aplikasi BumilFit.

## Folder Structure

~~~text
BumilFit/
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── data/
│       ├── hooks/
│       ├── lib/
│       ├── pages/
│       ├── router/
│       ├── store/
│       ├── App.tsx
│       └── main.tsx
│
├── backend/
│   ├── prisma/
│   └── src/
│       ├── controllers/
│       ├── lib/
│       ├── middlewares/
│       ├── routes/
│       ├── services/
│       ├── app.ts
│       └── server.ts
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
~~~

---

# ⚙️ Instalasi & Setup

## Prerequisites

Pastikan perangkat telah memiliki:

- Node.js v18+ atau v20+
- npm
- Git
- PostgreSQL / Neon PostgreSQL
- API Key Google Gemini


## Langkah Instalasi

### 1. Clone Repository

~~~bash
git clone https://github.com/BrezaMedico/bumilfit.git
cd BumilFit
~~~

### 2. Install Dependencies

~~~bash
cd frontend
npm install
~~~

Kemudian:

~~~bash
cd ../backend
npm install
~~~

### 3. Konfigurasi Environment Variable

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


### 5. Setup Prisma

Masuk ke folder backend:

~~~bash
cd backend
~~~

Generate Prisma Client:

~~~bash
npx prisma generate
~~~

Push database schema:

~~~bash
npx prisma db push
~~~

[Sesuaikan dengan migration command jika implementasi final menggunakan Prisma Migration]

### 6. Jalankan Aplikasi

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

Kemudian buka aplikasi melalui browser:
http://localhost:5173


---

# 🚀 Penggunaan

## Menjalankan Aplikasi

Setelah frontend dan backend berhasil dijalankan:

1. Buka browser.
2. Akses:
   
   ~~~text
   http://localhost:5173
   ~~~

3. Lakukan registrasi akun.
4. Masukkan data kehamilan yang diperlukan.
5. Gunakan fitur yang tersedia pada dashboard.

## User Guide

### Untuk Pengguna Umum

#### 1. Registrasi

Pengguna melakukan registrasi dengan mengisi:

- Nama
- Email
- Password
- Usia kehamilan saat registrasi
- Riwayat penyakit
- Data lain yang dibutuhkan oleh aplikasi


#### 2. Melihat Informasi Kehamilan

Setelah registrasi, sistem menampilkan:

- Usia kehamilan
- Estimated Due Date (EDD)

Data tersebut ditentukan berdasarkan usia kehamilan yang dimasukkan saat registrasi.

#### 3. Menggunakan Smart Health Reminder

Pengguna dapat melihat aktivitas kesehatan melalui To-Do List, seperti:

- Konsumsi TTD
- Konsumsi vitamin/suplemen
- Minum air
- Olahraga ringan
- Dll

Pengguna dapat menandai aktivitas yang telah selesai.

#### 4. WhatsApp Reminder

Pengguna dapat menerima pengingat aktivitas kesehatan melalui WhatsApp.


#### 5. Kalkulator Gizi

Pengguna dapat menggunakan kalkulator untuk membantu mengetahui kebutuhan nutrisi harian.

#### 6. Cek Gizi

Pengguna dapat:

1. Mengunggah foto makanan/minuman.
2. Menggunakan kamera.
3. Melihat informasi hasil analisis.


#### 7. Konsultasi Dokter

Pengguna dapat mengakses layanan konsultasi dengan dokter melalui aplikasi.


#### 8. Membeli Produk Kesehatan

Pengguna dapat:

1. Memilih produk kesehatan.
2. Memasukkan produk ke keranjang.
3. Melakukan checkout.
4. Menyelesaikan transaksi.


#### 9. Subscription

Pengguna dapat memilih paket premium sesuai kebutuhan:

- Basic
- Pro
- Premium
- Premium+

---

# 📚 API Documentation

### Base URL

~~~text
Development: [Sesuaikan dengan Base URL API development]
Production: [Sesuaikan dengan domain API production]/api
~~~

### Endpoints

#### Authentication

~~~http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
~~~

#### [Sesuaikan dengan Resource 1]

~~~http
GET    /api/[resource]        # Get all
GET    /api/[resource]/:id    # Get by ID
POST   /api/[resource]        # Create
PUT    /api/[resource]/:id    # Update
DELETE /api/[resource]/:id    # Delete
~~~

## Example Request

~~~javascript
// Get Daily Todos
const response = await fetch('/api/todo/daily', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
~~~

~~~javascript
// Complete / Toggle Todo
const response = await fetch('/api/todo/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    masterTodoId: 'TODO_MASTER_ID',
    isCompleted: true
  })
});
~~~

---

# 📄 Lisensi

Project ini menggunakan **MIT License**.

~~~text
MIT License

Copyright (c) 2026 BumilFit

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files, to deal in the Software
without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the
Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
~~~

<div align="center">

## 🤰 BumilFit

**Personal Pregnancy Companion for Healthy Mother & Stunting-Free Generation**

Developed for **ITechnoCup 2026 – Web Development**

**GitHub:** [https://github.com/BrezaMedico/bumilfit](https://github.com/BrezaMedico/bumilfit)

**Email:** [bumilfit@gmail.com](mailto:bumilfit@gmail.com)

**Website:** [bumilfit.vercel.app](https://bumilfit.vercel.app)

---

**© 2026 BumilFit Team. All Rights Reserved.**

</div>

