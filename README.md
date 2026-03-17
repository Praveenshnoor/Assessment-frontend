# 🎓 MCQ Exam Portal

<div align="center">

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1.1-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-≥18.0.0-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)](https://postgresql.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow)](https://tensorflow.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**A comprehensive, AI-powered online examination portal designed for conducting secure MCQ and coding assessments with real-time proctoring capabilities.**

[🚀 Live Demo](#) • [📖 Documentation](#) • [🐛 Report Bug](https://github.com/yourusername/mcq-exam-portal/issues) • [✨ Request Feature](https://github.com/yourusername/mcq-exam-portal/issues)

![MCQ Exam Portal Preview](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=MCQ+Exam+Portal+Preview)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Installation](#-installation)
- [🎯 Usage](#-usage)
- [📡 API Endpoints](#-api-endpoints)
- [🖼️ Screenshots](#️-screenshots)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)

---

## ✨ Features

<div align="center">

| 🎯 Feature | 📝 Description |
|------------|----------------|
| **📝 Multiple Choice Questions** | Create and manage MCQ tests with various question types and difficulty levels |
| **💻 Coding Assessments** | Integrated Monaco editor for programming challenges with syntax highlighting |
| **🤖 AI-Powered Proctoring** | Real-time monitoring using TensorFlow.js and MediaPipe for face detection and behavior analysis |
| **🔐 Secure Authentication** | Firebase-based authentication with OTP verification and session management |
| **📊 Real-time Analytics** | Live test monitoring, performance tracking, and detailed analytics dashboard |
| **🏫 Institute Management** | Multi-institute support with admin controls and role-based access |
| **📱 Responsive Design** | Modern, mobile-first UI built with React and Tailwind CSS |
| **🔄 Real-time Communication** | Socket.io integration for live updates and instant notifications |
| **🛡️ Security Features** | Rate limiting, session verification, and advanced anti-cheating measures |
| **📈 Performance Monitoring** | Comprehensive logging and performance tracking with Redis caching |

</div>

---

## 🛠️ Tech Stack

<div align="center">

### 🎨 Frontend
| Technology | Purpose |
|------------|---------|
| ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react) | Modern JavaScript library for building user interfaces |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite) | Fast build tool and development server |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css) | Utility-first CSS framework |
| ![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=flat&logo=tensorflow) | Machine learning in the browser for proctoring |
| ![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-007ACC?style=flat&logo=visual-studio-code) | Code editor for programming questions |
| ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io) | Real-time bidirectional communication |

### ⚙️ Backend
| Technology | Purpose |
|------------|---------|
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js) | JavaScript runtime environment |
| ![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express) | Web application framework |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql) | Relational database management |
| ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase) | Authentication and real-time database |
| ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis) | Caching and session management |
| ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io) | Real-time communication server |

</div>

---

## 📋 Prerequisites

<div align="center">

| Requirement | Version | Purpose |
|-------------|---------|---------|
| ![Node.js](https://img.shields.io/badge/Node.js-≥18.0.0-green) | ≥ 18.0.0 | JavaScript runtime |
| ![npm](https://img.shields.io/badge/npm-≥8.0.0-red) | ≥ 8.0.0 | Package manager |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue) | 13+ | Database |
| ![Firebase](https://img.shields.io/badge/Firebase-Project-yellow) | Latest | Authentication |
| ![Redis](https://img.shields.io/badge/Redis-6+-red) | 6+ | Caching (optional) |

</div>

---

## 🚀 Installation

### ⚙️ Backend Setup

<details>
<summary><strong>Click to expand backend setup steps</strong></summary>

1. **📂 Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **📦 Install dependencies:**
   ```bash
   npm install
   ```

3. **🗄️ Setup database:**
   ```bash
   npm run setup-db
   ```

4. **🔧 Configure environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://username:password@localhost:5432/mcq_portal
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY=your_private_key
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your_jwt_secret
   ```

5. **▶️ Start the backend server:**
   ```bash
   npm run dev
   ```

</details>

### 🎨 Frontend Setup

<details>
<summary><strong>Click to expand frontend setup steps</strong></summary>

1. **📂 Navigate to frontend directory:**
   ```bash
   cd mcq-exam-portal
   ```

2. **📦 Install dependencies:**
   ```bash
   npm install
   ```

3. **🔧 Configure environment variables:**
   Create a `.env` file in the mcq-exam-portal directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   ```

4. **▶️ Start the development server:**
   ```bash
   npm run dev
   ```

</details>

---

## 🎯 Usage

<div align="center">

### 🚀 Quick Start

1. **🌐 Access the application:**
   Open [http://localhost:5173](http://localhost:5173) in your browser

2. **👨‍💼 Admin Setup:**
   ```bash
   # Run admin creation script
   cd backend && node create-admin.js
   ```

3. **📝 Create Tests:**
   - Login to admin panel
   - Create MCQ tests and coding challenges
   - Configure proctoring settings

4. **🎓 Student Access:**
   - Register/Login as student
   - Take available tests
   - Real-time proctoring monitors the session

</div>

---

## 📡 API Endpoints

<div align="center">

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | 🔐 User authentication |
| `POST` | `/api/auth/register` | 📝 User registration |
| `POST` | `/api/auth/verify-otp` | ✅ OTP verification |
| `GET` | `/api/tests` | 📋 Get available tests |
| `POST` | `/api/tests/submit` | 📤 Submit test answers |
| `GET` | `/api/tests/:id/results` | 📊 Get test results |
| `POST` | `/api/admin/tests` | ➕ Create new test |
| `GET` | `/api/admin/students` | 👥 Get student list |
| `PUT` | `/api/admin/settings` | ⚙️ Update system settings |

</div>

---

## 🖼️ Screenshots

<div align="center">

### 📱 Dashboard
<img src="https://via.placeholder.com/400x250/4F46E5/FFFFFF?text=Dashboard" alt="Dashboard Screenshot" width="400"/>

### 💻 Coding Interface
<img src="https://via.placeholder.com/400x250/059669/FFFFFF?text=Coding+Interface" alt="Coding Interface Screenshot" width="400"/>

### 📊 Admin Panel
<img src="https://via.placeholder.com/400x250/DC2626/FFFFFF?text=Admin+Panel" alt="Admin Panel Screenshot" width="400"/>

</div>

---

## 🗺️ Roadmap

- [ ] 📱 Mobile App Development
- [ ] 🌐 Multi-language Support
- [ ] 📈 Advanced Analytics Dashboard
- [ ] 🎥 Video Proctoring Enhancement
- [ ] 🤝 Integration with LMS Platforms
- [ ] 📧 Automated Email Notifications
- [ ] 🔄 Offline Test Taking Capability

---

## 🤝 Contributing

<div align="center">

We love your input! We want to make contributing to this project as easy and transparent as possible.

### 📋 How to Contribute

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔄 Open a Pull Request

### 🐛 Bug Reports & Feature Requests

- 🐛 [Report a Bug](https://github.com/yourusername/mcq-exam-portal/issues/new?template=bug_report.md)
- ✨ [Request a Feature](https://github.com/yourusername/mcq-exam-portal/issues/new?template=feature_request.md)

</div>

---

## 📄 License

<div align="center">

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

## 🙏 Acknowledgments

<div align="center">

**Made with ❤️ for secure online examinations**

Special thanks to:
- 🎨 [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) communities
- 🤖 [TensorFlow.js](https://tensorflow.org/) for AI capabilities
- 🔥 [Firebase](https://firebase.google.com/) for authentication services
- 📊 [Socket.io](https://socket.io/) for real-time communication
- 🌟 All contributors and testers

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/mcq-exam-portal?style=social)](https://github.com/yourusername/mcq-exam-portal/stargazers)

</div>

</div>

## 🙏 Acknowledgments

- React and Vite communities
- TensorFlow.js for AI capabilities
- Firebase for authentication services
- All contributors and testers

---

Made with ❤️ for secure online examinations
