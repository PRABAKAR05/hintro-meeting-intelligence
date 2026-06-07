# Technical Decisions

This document explains the key technical decisions made during the development of the Hintro Meeting Intelligence Service, including rationale, alternatives considered, and trade-offs.

---

## 1. Database: MongoDB

### Why Chosen
- **Flexible schema** — Meeting transcripts and AI-generated analysis have nested, variable-length structures (arrays of objects with sub-arrays). MongoDB's document model naturally supports embedding these without complex JOINs.
- **Mongoose ODM** — Provides schema validation, middleware hooks (e.g., password hashing on save), and a clean query API.
- **Easy setup** — MongoDB Atlas offers a free tier, making deployment straightforward.

### Alternatives Considered
| Alternative | Reason Not Chosen |
|---|---|
| PostgreSQL | Requires rigid schema migrations; storing transcript arrays and nested analysis objects would need JSONB columns or multiple join tables, adding complexity |
| SQLite | Single-file database, not suitable for production deployments; no concurrent write support |

### Trade-offs
- No ACID transactions across collections (though single-document operations are atomic in MongoDB)
- Less mature tooling for complex analytical queries compared to PostgreSQL

---

## 2. Authentication: JWT (JSON Web Tokens)

### Why Chosen
- **Stateless** — No server-side session storage needed; the token carries all necessary user info
- **Scalable** — Works seamlessly across multiple server instances without shared session stores
- **Simple** — Easy to implement with `jsonwebtoken` and `bcryptjs`
- **Industry standard** — Well-understood by evaluators and commonly used in REST APIs

### Alternatives Considered
| Alternative | Reason Not Chosen |
|---|---|
| Session-based auth | Requires server-side session storage (Redis/DB), adding infrastructure complexity |
| OAuth 2.0 | Over-engineered for a single-service backend; adds external provider dependency |
| API Key auth | Less secure; no built-in expiry or user identity encoding |

### Trade-offs
- Tokens cannot be revoked without maintaining a blacklist
- Token payload increases request header size slightly
- Token expiry means users must re-authenticate periodically

---

## 3. AI Provider: Groq

### Why Chosen
- **Fast inference** — Groq's LPU (Language Processing Unit) provides extremely fast response times
- **Free tier** — Generous free API access for development and evaluation
- **Open models** — Uses `llama-3.3-70b-versatile`, an open model with strong instruction-following
- **JSON mode** — Supports `response_format: { type: "json_object" }` for reliable structured output

### Alternatives Considered
| Alternative | Reason Not Chosen |
|---|---|
| OpenAI (GPT-4) | Higher cost; free tier is limited |
| Google Gemini | Good option but Groq's speed advantage is significant |
| Claude | No free API tier; higher latency |
| OpenRouter | Adds an intermediary layer; direct provider is simpler |

### Trade-offs
- Groq's model selection is more limited than OpenAI's
- Rate limits on free tier may affect high-volume usage
- Open-source models may produce slightly less refined JSON compared to GPT-4

---

## 4. External Integration: Telegram Bot API

### Why Chosen
- **Zero infrastructure cost** — No server needed; uses HTTP POST to Telegram's API
- **Instant delivery** — Messages arrive immediately on mobile and desktop
- **Rich formatting** — Supports MarkdownV2 for well-formatted reminder messages
- **Simple setup** — Just a bot token from @BotFather and a chat ID
- **Well-documented API** — Telegram's Bot API is thorough and reliable

### Alternatives Considered
| Alternative | Reason Not Chosen |
|---|---|
| Discord Webhook | Equally simple, but Telegram has broader personal use (not everyone uses Discord) |
| Slack Webhook | Requires workspace access; more enterprise-oriented |
| Email (SendGrid) | Higher latency; emails may land in spam; requires domain verification |
| Notion API | More complex setup; not a notification channel |

### Trade-offs
- Requires users to have Telegram installed
- Bot messages go to a single chat ID (group or personal); no per-user routing without additional logic
- MarkdownV2 has strict escaping requirements (mitigated by plain-text fallback)

---

## 5. Project Structure: Layered MVC

### Why Chosen
- **Separation of concerns** — Routes → Controllers → Services → Models keeps each layer focused
- **Testability** — Services can be unit-tested independently of HTTP handling
- **Maintainability** — New features can be added by creating files in the appropriate layer
- **Readability** — Evaluators can navigate the codebase intuitively

### Alternatives Considered
| Alternative | Reason Not Chosen |
|---|---|
| Microservices | Over-engineered for a single-purpose service; adds deployment and communication complexity |
| Flat structure | Becomes unmanageable as file count grows |
| Feature-based modules | Good for large apps but adds indirection for a project of this size |

### Trade-offs
- Some files are thin (e.g., routes that just wire validators to controllers)
- Cross-cutting concerns (like auth) must be applied at the middleware level

---

## 6. Input Validation: express-validator

### Why Chosen
- **Express-native** — Designed specifically for Express middleware chains
- **Declarative** — Validators are defined as arrays of chained rules, making them readable
- **Rich built-in validators** — `isEmail()`, `isISO8601()`, `isMongoId()`, etc.
- **Sanitization** — Built-in `trim()`, `normalizeEmail()`, etc.

### Alternatives Considered
| Alternative | Reason Not Chosen |
|---|---|
| Joi | Powerful but heavier; requires wrapping in middleware manually |
| Zod | TypeScript-first; less natural in a plain JavaScript project |
| Manual validation | Error-prone, verbose, hard to maintain |

### Trade-offs
- Validation rules are spread across separate validator files (vs. co-located schema definitions in Joi/Zod)
- Error message customization requires per-rule `.withMessage()` calls

---

## 7. Logging: Winston

### Why Chosen
- **Structured JSON logs** — Essential for production log aggregation and searching
- **Transport flexibility** — Can add file, HTTP, or cloud transports without code changes
- **Log levels** — Built-in debug/info/warn/error hierarchy
- **Trace ID correlation** — Custom format includes request trace IDs for request-level debugging

### Trade-offs
- Slightly heavier than `pino` (but more familiar and feature-rich)
- Console transport with colorization is dev-only aesthetic

---

## 8. Scheduled Jobs: node-cron

### Why Chosen
- **Lightweight** — No external dependencies (Redis, message queues)
- **Familiar syntax** — Standard cron expressions
- **In-process** — Runs within the Node.js process, no separate worker needed

### Alternatives Considered
| Alternative | Reason Not Chosen |
|---|---|
| Bull/BullMQ | Requires Redis; overkill for a single scheduled job |
| Agenda | Requires MongoDB job storage; more complex setup |
| OS-level cron | Not portable; can't be deployed to PaaS platforms |

### Trade-offs
- Job state is not persisted (if server restarts mid-cycle, the current run is lost)
- Not suitable for distributed/multi-instance deployments (would send duplicate reminders)
