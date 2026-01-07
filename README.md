<div align="center">

# NoteTree 🌳

**Bring your notes to life: An AI and visualization-based personal knowledge base system**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Status](https://img.shields.io/badge/status-Alpha-orange)
![Docker](https://img.shields.io/badge/deployment-docker--compose-blue)
![NestJS](https://img.shields.io/badge/backend-NestJS-E0234E)
![Python](https://img.shields.io/badge/ai-Python%20%7C%20FastAPI-3776AB)

[Features](#-Features) •
[Core Architecture](#-Core-Architecture) •
[Quick Start](#-Quick-Start) •
[Development Guide](#-Development-Guide)

---

</div>

## 📖 Introduction

**NoteTree** aims to solve the problem of having a large number of personal notes that are "stored but not easily retrieved." It's not just a note-taking tool, but an intelligent knowledge gardener.

Through **RAG (Retrieval Augmented Generation)** technology and **D3.js visualized knowledge trees**, NoteTree transforms fragmented Markdown notes into a structured knowledge graph, allowing you to both overview the knowledge network and perform precise, granular searches using natural language.

## ✨ Features

- 🕸️ **Visualized Knowledge Tree**: Abandon traditional folders and display note relationships with a dynamically growing tree diagram.
- 🤖 **AI Smart Q&A (RAG)**: Query your note library like talking to a person, supporting contextual relevance.
- ⚡ **Event-Driven Architecture**: Based on Redis Streams, achieving perfect decoupling of millisecond-level response and asynchronous AI inference.
- 🐳 **One-Click Deployment**: Complete Docker Compose orchestration, ready to use out of the box.
- 🔍 **Hybrid Retrieval**: Combining full-text search and FAISS vector search for maximum recall. ## 🏗 Core Architecture

NoteTree employs an **event-driven architecture**, ensuring complete decoupling and scalable flexibility between the business logic (Node.js/NestJS) and AI-intensive computations (Python). ### 🛠 Technology Stack

| Area           | Technology Selection     | Function                                              |
| :------------- | :----------------------- | :---------------------------------------------------- |
| **Frontend**   | React, Tailwind, D3.js   | UI Interaction, SVG Rendering, WebSocket Client       |
| **Backend**    | NestJS (Node.js)         | API Gateway, Authentication (RBAC), Business Logic    |
| **AI Worker**  | Python (FastAPI Runtime) | RAG Pipeline, Embedding, LLM Inference                |
| **Data Store** | MongoDB, Redis, FAISS    | Document Storage, Message Queue & Cache, Vector Index |

### 📐 System Context (C4 Context)

```mermaid
C4Context
title Container Diagram: NoteTree System

Person(user, "User", "Content Creator / Knowledge Seeker")

System_Boundary(c1, "NoteTree System") {
Container(web_app, "Single Page App", "React + Tailwind + D3", "UI Interaction, WebSocket Client")
Container(api_gateway, "Business Service", "NestJS", "API, Auth, WS Gateway")
Container(ai_worker, "AI Worker", "Python", "RAG Pipeline, FAISS Index")

ContainerDb(db_mongo, "Doc Store", "MongoDB", "Notes, User Profile")
ContainerDb(db_redis, "Message Broker", "Redis", "Streams (MQ), Cache")
ContainerDb(fs_faiss, "Vector Index", "Local Disk / S3", "FAISS Index Snapshots")
}

Rel(user, web_app, "Uses", "HTTPS")
Rel(web_app, api_gateway, "REST / Socket.io")

Rel(api_gateway, db_mongo, "Mongoose")
Rel(api_gateway, db_redis, "Publishes Events (XADD)")

Rel(ai_worker, db_redis, "Consumes (XREADGROUP)")
Rel(ai_worker, fs_faiss, "Load/Save")
Rel(ai_worker, db_mongo, "PyMongo")

UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## 🔄 Data Flow and Logic

### 1. Note Indexing Process (Write Path)

When a user uploads a note, the system uses Redis Stream for asynchronous decoupling, enabling "instant response, background processing".

```mermaid
sequenceDiagram
    title DataFlow: Note Indexing Pipeline
    autonumber
    participant U as User (React)
    participant N as NestJS (API)
    participant M as MongoDB
    participant R as Redis (Stream)
    participant P as Python Worker
    participant F as FAISS Index

    Note over U, N: Phase 1: Business Write
    U->>N: POST /notes (Title, Content)
    activate N
    N->>M: Get atomic auto-increment ID (faiss_id)
    N->>M: Insert note (Status: PENDING)
    N->>R: XADD "job:embedding"
    N-->>U: 201 Created
    deactivate N

    Note over R, P: Phase 2: AI Asynchronous Processing
    activate P
    P->>R: XREADGROUP (Consume task)
    P->>M: Read original note content
    P->>P: Generate Embedding & Automatic Classification

    Note over P, F: Phase 3: Update Index
    P->>F: add_with_ids (Write to vector database)
    P->>M: Update note status (READY)
    P->>R: XACK (Acknowledge consumption)
    P->>N: PubSub Notification (INDEX_DONE)
    deactivate P

    N-->>U: WebSocket Push: "Node is ready"
```

### 2. RAG Search Process (Read Path)

After the user asks a question, the Python Worker retrieves data from the vector database and document database in parallel, constructs a prompt, and sends it to the LLM to generate an answer.

```mermaid
sequenceDiagram
    title DataFlow: RAG Search
    participant FE as Frontend
    participant Nest as NestJS
    participant Redis as Redis
    participant Worker as Python Worker
    participant FAISS as FAISS
    participant Mongo as MongoDB
    participant LLM as LLM Service

    FE->>Nest: POST /search
    Nest->>Redis: XADD stream:search
    Nest-->>FE: Return jobId (Entering thinking state)

    Worker-->>Redis: XREADGROUP (Get query)
    Worker->>FAISS: Vector Search (Top K)
    Worker->>Mongo: Retrieve corresponding note snippets
    Worker->>LLM: Context assembly + Generate answer
    Worker->>Redis: Publish SEARCH_DONE

    Redis->>Nest: Trigger SEARCH_DONE event
    Nest->>FE: WebSocket streaming push (Answer + citation sources)
```

---

## 🚀 Quick Start

This project only supports **Docker Compose** for local development orchestration, which is the simplest way to get started.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (v20.10+)
- Ollama API

### Startup Steps

1.  **Clone the repository**

```bash
git clone https://github.com/Chenghao-Wen/NoteTree
cd notetree
```

2.  **Environment Configuration**
    Copy `.env.example` and fill in the necessary API Key.

```bash
cp .env.example .env
# Open .env with a text editor and fill in OPENAI_API_KEY
```

3.  **Start the cluster**

```bash
docker-compose up -d --build
```
