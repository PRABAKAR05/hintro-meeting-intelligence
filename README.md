# Hintro Meeting Intelligence Service

AI-powered Meeting Intelligence Service that helps users manage meetings, extract actionable insights from transcripts, and stay on top of follow-ups with automated reminders.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js + Express | REST API server |
| Database | MongoDB + Mongoose | Data persistence |
| Authentication | JWT (jsonwebtoken + bcryptjs) | Stateless auth |
| AI Provider | Groq (llama-3.3-70b-versatile) | Meeting analysis |
| External Integration | Telegram Bot API | Reminder notifications |
| Scheduler | node-cron | Overdue detection |
| Validation | express-validator | Input validation |
| Logging | Winston | Structured JSON logs |
| API Docs | swagger-jsdoc + swagger-ui-express | OpenAPI documentation |
| Testing | Jest + Supertest + mongodb-memory-server | Unit & integration tests |

## Features

- ✅ JWT Authentication (register/login)
- ✅ Meeting CRUD with transcript storage
- ✅ AI-powered meeting analysis with Groq
- ✅ Grounded citations from transcript (hallucination prevention)
- ✅ Action item management with status tracking
- ✅ Overdue action item detection
- ✅ Scheduled reminder job (node-cron)
- ✅ Telegram Bot notifications for overdue items
- ✅ Swagger/OpenAPI documentation
- ✅ Unified API response format with trace IDs
- ✅ Structured logging
- ✅ Global error handling
- ✅ Input validation
- ✅ Docker support

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Groq API Key ([get one free](https://console.groq.com/keys))
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/prabakar/hintro-meeting-intelligence.git
cd hintro-meeting-intelligence
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `JWT_EXPIRES_IN` | Token expiry (default: 7d) | No |
| `GROQ_API_KEY` | Groq API key for AI analysis | Yes |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather | Yes |
| `TELEGRAM_CHAT_ID` | Telegram chat ID for reminders | Yes |
| `REMINDER_CRON` | Cron expression for reminder job (default: */30 * * * *) | No |

### 4. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 5. Run tests

```bash
npm test
```

## API Usage Examples

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Prabakar","email":"ppraba0705@gmail.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ppraba0705@gmail.com","password":"password123"}'
```

### Create Meeting
```bash
curl -X POST http://localhost:3000/api/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Sprint Planning",
    "participants": ["alice@example.com", "bob@example.com"],
    "meetingDate": "2026-05-20T10:00:00Z",
    "transcript": [
      {"timestamp": "00:10", "speaker": "John", "text": "We should launch next Friday."},
      {"timestamp": "00:20", "speaker": "Alice", "text": "I will prepare release notes."},
      {"timestamp": "00:30", "speaker": "Bob", "text": "Let me handle the deployment."}
    ]
  }'
```

### Analyze Meeting
```bash
curl -X POST http://localhost:3000/api/meetings/MEETING_ID/analyze \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Action Item
```bash
curl -X POST http://localhost:3000/api/action-items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"task":"Prepare release notes","assignee":"Alice","dueDate":"2026-05-25T00:00:00Z"}'
```

### Update Action Item Status
```bash
curl -X PATCH http://localhost:3000/api/action-items/ITEM_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"status":"IN_PROGRESS"}'
```

### Get Overdue Items
```bash
curl http://localhost:3000/api/action-items/overdue \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Health Check
```bash
curl http://localhost:3000/health
```

## API Documentation

Interactive Swagger documentation is available at:

- **Local:** http://localhost:3000/api-docs
- **Production:** https://hintro-meeting-intelligence.onrender.com/api-docs

## Project Structure

```
├── src/
│   ├── config/          # Database, environment, logger configuration
│   ├── middleware/       # Auth, error handling, trace ID, validation
│   ├── models/          # Mongoose schemas (User, Meeting, ActionItem, ReminderLog)
│   ├── routes/          # Express routes with Swagger annotations
│   ├── controllers/     # Request handlers
│   ├── services/        # AI, Telegram, scheduler business logic
│   ├── validators/      # express-validator rules
│   ├── utils/           # ApiError, apiResponse, constants
│   └── app.js           # Express app setup
├── tests/               # Jest unit tests
├── server.js            # Entry point
├── Dockerfile           # Docker support
├── DECISIONS.md         # Technical decisions
├── AI_APPROACH.md       # AI integration approach
├── TESTING.md           # Testing documentation
├── CHANGELOG.md         # Implementation milestones
└── CHECKLIST.md         # Submission checklist
```

## Deployment (Render)

1. Push code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repo
4. Set build command: `npm install`
5. Set start command: `node server.js`
6. Add all environment variables from `.env.example`
7. Deploy

## Docker

```bash
docker build -t hintro-meeting-intelligence .
docker run -p 3000:3000 --env-file .env hintro-meeting-intelligence
```

## License

ISC
