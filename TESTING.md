# Testing Documentation

This document describes the testing approach, test scenarios, edge cases considered, and known limitations.

---

## Testing Stack

| Tool | Purpose |
|---|---|
| Jest | Test runner and assertion library |
| Supertest | HTTP endpoint testing |
| mongodb-memory-server | In-memory MongoDB for isolated tests |

---

## Test Setup

- **In-memory database** — Each test suite uses `mongodb-memory-server` for a fresh, isolated MongoDB instance
- **Auto-cleanup** — All collections are cleared between tests via `afterEach`
- **No external deps** — Tests don't require Groq API, Telegram, or any external service

---

## Test Scenarios

### Authentication Tests (`auth.test.js`)

| Scenario | Expected Result |
|---|---|
| Register with valid data | 201, returns user + JWT token |
| Register with duplicate email | 409, CONFLICT error |
| Register without name | 422, VALIDATION_ERROR |
| Register with invalid email | 422, VALIDATION_ERROR |
| Register with short password (<6 chars) | 422, VALIDATION_ERROR |
| Login with valid credentials | 200, returns user + JWT token |
| Login with wrong password | 401, UNAUTHORIZED |
| Login with non-existent email | 401, UNAUTHORIZED |
| Login without required fields | 422, VALIDATION_ERROR |

### Meeting Tests (`meeting.test.js`)

| Scenario | Expected Result |
|---|---|
| Create meeting with valid data | 201, meeting with transcript stored |
| Create meeting without authentication | 401, UNAUTHORIZED |
| Create meeting without title | 422, VALIDATION_ERROR |
| Create meeting with empty transcript | 422, VALIDATION_ERROR |
| Create meeting with invalid participant emails | 422, VALIDATION_ERROR |
| Create meeting with invalid date | 422, VALIDATION_ERROR |
| List meetings with pagination | 200, correct page size and total |
| List meetings with page + limit params | Correct subset returned |
| Filter meetings by title | Only matching meetings returned |
| Get meeting by valid ID | 200, full meeting with transcript |
| Get meeting with non-existent ID | 404, NOT_FOUND |

### Action Item Tests (`actionItem.test.js`)

| Scenario | Expected Result |
|---|---|
| Create action item | 201, default status PENDING |
| Create without task | 422, VALIDATION_ERROR |
| Create without assignee | 422, VALIDATION_ERROR |
| Create with invalid status | 422, VALIDATION_ERROR |
| Update status to IN_PROGRESS | 200, status updated |
| Update status to COMPLETED | 200, status updated |
| Update with invalid status value | 422, VALIDATION_ERROR |
| Update non-existent item | 404, NOT_FOUND |
| List all action items | 200, returns all items |
| Filter by status | Only matching status returned |
| Filter by assignee | Only matching assignee returned |
| Get overdue items (past due, not completed) | Returns only overdue items |
| Completed items excluded from overdue | Not returned in overdue list |

### Misc Endpoint Tests

| Scenario | Expected Result |
|---|---|
| GET /health | 200, `{ status: "UP" }` |
| GET /api/evaluation | 200, candidate info |
| GET /api/nonexistent | 404, NOT_FOUND |

---

## Edge Cases Considered

### Input Validation
- Empty strings for required fields
- Invalid email formats (no @, no domain)
- Extremely long strings (max length validation)
- Invalid ISO 8601 date formats
- Invalid MongoDB ObjectId values
- Invalid enum values for status

### Authentication
- Missing Authorization header
- Malformed Bearer token
- Expired JWT token
- Invalid JWT signature

### Data Integrity
- Duplicate user registration
- Accessing another user's meetings (ownership check)
- Accessing non-existent resources (404 handling)
- Invalid ObjectId in URL params (CastError handling)

### Overdue Detection
- Items with no due date (should not appear in overdue)
- Completed items with past due dates (should not appear)
- Items with future due dates (should not appear)
- Boundary: item due exactly now

---

## Test Coverage

Run tests with coverage:
```bash
npm run test:coverage
```

### Coverage Areas
- ✅ Utility functions (apiResponse, apiError)
- ✅ Auth flow (register, login)
- ✅ Meeting CRUD (create, list, get)
- ✅ Action item lifecycle (create, update status, list, filter)
- ✅ Overdue detection logic
- ✅ Health and evaluation endpoints
- ✅ 404 handling
- ✅ Input validation for all endpoints

---

## Limitations

### AI Analysis Tests
- AI analysis endpoint is **not tested in automated tests** because it requires a live Groq API key
- The AI service functions (`validateCitations`, `parseAIResponse`) can be unit-tested independently
- Manual testing was performed to verify AI output and citation accuracy

### Telegram Integration
- Telegram webhook calls are **not tested in CI** to avoid sending actual messages
- The service is structured for easy mocking in future integration tests

### Scheduler
- The cron scheduler is **not tested with real timers** in unit tests
- The `processOverdueItems` function can be tested independently by calling it directly
- Duplicate reminder prevention (24-hour window) is verified manually

### Concurrent Operations
- Concurrent status updates to the same action item are not explicitly tested
- MongoDB's atomic document updates provide basic concurrency safety
