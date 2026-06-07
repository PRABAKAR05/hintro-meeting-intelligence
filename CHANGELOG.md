# Changelog

All notable changes to the Hintro Meeting Intelligence Service.

---

## [1.0.0] - 2026-06-07

### 🏗️ Project Setup
- Initialized Node.js project with Express
- Configured ESM-compatible project structure with layered MVC architecture
- Added development tooling (nodemon, jest, supertest)

### 🔐 Authentication
- Implemented JWT-based authentication (register/login)
- Password hashing with bcryptjs (12 salt rounds)
- Auth middleware for protected route access
- Input validation for registration and login

### 📋 Meeting Management
- Meeting CRUD operations (create, list, get)
- Transcript storage with embedded document schema
- Pagination support on list endpoint
- Filtering by title, date range, and participant email

### 🤖 AI Meeting Analysis
- Integrated Groq AI (llama-3.3-70b-versatile) for meeting analysis
- Generates summaries, action items, decisions, and follow-ups
- Grounded citation system referencing transcript timestamps
- Post-processing citation validation to prevent hallucination
- Low temperature (0.1) for deterministic output
- JSON mode for reliable structured responses

### ✅ Action Item Management
- Action item CRUD with status tracking (PENDING, IN_PROGRESS, COMPLETED)
- Filtering by status, assignee, and meeting ID
- Pagination support

### ⏰ Overdue Detection
- Overdue action item detection endpoint
- Query: status != COMPLETED AND dueDate < now

### 📱 Telegram Integration
- Telegram Bot API integration for reminder notifications
- Rich message formatting with MarkdownV2 (plain-text fallback)
- Overdue reminders include task, assignee, due date, and overdue duration

### ⏲️ Scheduled Reminder Job
- node-cron scheduled job (configurable, default: every 30 minutes)
- Detects overdue action items and sends Telegram reminders
- Duplicate prevention: skips items reminded within last 24 hours
- ReminderLog model for audit trail

### 📚 API Documentation
- Swagger/OpenAPI documentation at /api-docs
- All endpoints documented with request/response schemas
- Interactive Swagger UI

### 🛡️ Non-Functional Requirements
- Unified API response format (traceId, success, data/error)
- Request trace ID generation (UUID) with x-trace-id header support
- Structured JSON logging with Winston (timestamp, traceId, method, path, status)
- Global error handling (Mongoose errors, JWT errors, validation errors, 404s)
- Input validation with express-validator
- CORS enabled for all origins
- Helmet security headers

### 🧪 Testing
- Unit tests with Jest + Supertest
- In-memory MongoDB via mongodb-memory-server
- Test coverage: auth, meetings, action items, overdue, health, evaluation, 404

### 🐳 Docker
- Dockerfile with Node.js 18 Alpine
- Docker health check endpoint
- .dockerignore for lean builds

### 📖 Documentation
- README.md with setup instructions and API examples
- DECISIONS.md with technical rationale
- AI_APPROACH.md with prompt design and citation strategy
- TESTING.md with test scenarios and edge cases
- CHANGELOG.md (this file)
- CHECKLIST.md with submission checklist
