# 📘 Task Manager API

A backend API for user authentication and task management with secure JWT-based access. Supports PostgreSQL/MongoDB via repository abstraction.

---

## ⚙️ Tech Stack

- Node.js
- Express.js
- JWT Authentication
- PostgreSQL / MongoDB (switchable)
- Docker
- Zod (validation)

---

## Setup Instructions

### 1. Clone repo
git clone <repo-url>
cd task-manager-api

### 2. Install dependencies
npm install

### 3. Environment variables

#### update enviroment variables in docker-compose.yml

### 4. Run with Docker (recommended)

docker compose up --build -d

### OR run locally

npm start

---

## Authentication

All `/tasks` routes require JWT token.

Authorization: Bearer <token>

---

## AUTH ROUTES

### Register User
POST /auth/register

Body:
{
  "username": "ankit",
  "email": "ankit@example.com",
  "password": "password123"
}

---

### Login User
POST /auth/login

Body:
{
  "email": "ankit@example.com",
  "password": "password123"
}

---

Response:
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "username": "ankit",
    "email": "ankit@example.com"
  }
}

---

## 📌 TASK ROUTES (Protected)

### Create Task
POST /tasks

Body:
{
  "title": "Finish project",
  "description": "Complete backend API",
  "status": "pending",
  "due_date": "2026-04-30"
}

---

### Get All Tasks
GET /tasks

---

### Get Task by ID
GET /tasks/:taskId

---

### Update Task
PUT /tasks/:taskId

Body:
{
  "title": "Updated title",
  "status": "completed"
}

---

### Delete Task
DELETE /tasks/:taskId

---

### Filter Tasks by Status
GET /tasks/status/:status

---

### Get Overdue Tasks
GET /tasks/overdue

---

## Task Status Values
- pending
- completed

---

## Architecture

Request → Middleware → Routes → Services → Repository → DB

---

## Docker Commands

docker compose up --build -d
docker compose down

---


