# 📝 Development Doc for NoteTree

## 📖 Project Overview

- **Project Name**: NoteTree: Note management for life-long learners
- **One-line Description**: Use AI tools to build your knowledge tree automatically.
- **Key Features**: Build a personal knowledge for quick review, Note-Knowledge Unit automatic matching, Online notes preview, Multi-system support, Local Distribution, Free-to-Use
- **Target Users**: Learners who want to build their own knowledge system at anytime, anywhere through any device.
- **Tech Stack**:

  - Frontend: React / D3.js
  - Backend: Node.js (Express / Nest.js)
  - Database: MongoDB
  - Others: Redis / FastAPI / Docker
  - Languages: Python, JavaScript, TypeScript
  - Deep/Machine Learning: SentenceTransformer, K-Means

## ⚙️ Backend Documentation

### Directory Structure

```bash
backend/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── services/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   └── utils/
```

## 🗄️ Database Design

### Overview

- Database type: MongoDB

## 🔌 API Documentation

### Authentication

- **POST** `/users/login` → Login
- **POST** `/users/signup` → Register
- **POST** `/files/upload` → Upload a file to be matched
- **POST** `/tree/:userID/add-node` → Add NoteNode to user's Tree
- **POST** `/tree/:userID/remove-node` → Remove a NoteNode from user's Tree
- **POST** `/tree/:userID/remove-node` → Move a NoteNode in user's Tree
- **POST** `/files/upload` → Upload
- **GET** `/users/getTree` → Get user's tree
- **GET** `/users/uploadRecords` → Get user's uploaded notes
- **GET** `/users/unmatchedRecords` → Get user's notes awaiting match
- **GET** `/files/fetch` → Get spcific file

## 📜 License

- MIT / Apache-2.0 / GPL-3.0

---
