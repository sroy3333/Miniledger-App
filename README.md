# MiniLedger

MiniLedger is a small full-stack app for tracking money lent to friends. It includes a Node.js + TypeScript + Express API, PostgreSQL storage, mock phone OTP login, and an Expo React Native client.

> **Important demo note:** OTPs are printed in the backend terminal and are intended only for local development. This is not production authentication. Do not use real financial or personal data.

## Features

- Phone-number login with a mock OTP (printed in server logs)
- Add a loan with friend name, amount, and due date
- Mark a loan as repaid
- Summary: total lent, total repaid, and currently overdue outstanding amount
- Overdue loans highlighted in the mobile UI
- Optional receipt image attachment is not included in this MVP; it can be added with an object-storage service later.
- API validation and basic automated tests

## Project structure

```text
miniledger/
├── backend/        # Express + TypeScript + PostgreSQL
└── mobile/         # Expo + React Native + TypeScript
```

## Requirements

- Node.js 20+
- npm
- PostgreSQL 14+ (or a compatible hosted PostgreSQL database)
- Expo Go on a phone, or an Android/iOS simulator

## 1. Start PostgreSQL

Create a database and user, for example:

```sql
CREATE USER miniledger WITH PASSWORD 'miniledger_dev';
CREATE DATABASE miniledger OWNER miniledger;
```

Alternatively, from the project root, start the included PostgreSQL service using Docker Compose:

```bash
docker compose up -d db
```

The default local database URL is:
`postgresql://miniledger:miniledger_dev@localhost:5432/miniledger`

## 2. Start the backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

The API runs at `http://localhost:4000`. The server creates the tables through the migration script.

### Backend environment variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | API port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | local MiniLedger DB |
| `JWT_SECRET` | Secret used to sign demo access tokens | development-only value |
| `OTP_TTL_MINUTES` | OTP expiry time | `5` |
| `CORS_ORIGIN` | Allowed browser origin (Expo native requests generally don't send browser CORS headers) | `*` |

### Phone login demo

1. Enter a phone number with 10–15 digits (country code is accepted).
2. Tap **Send OTP**.
3. Look at the backend terminal for a line like `MiniLedger demo OTP for +919876543210: 123456`.
4. Enter that code and verify.

The OTP is generated randomly and stored in memory for five minutes. Restarting the server clears pending OTPs. This is intentionally a mock flow, not SMS delivery.

## 3. Start the mobile app

```bash
cd mobile
cp .env.example .env
npm install
npm start
```

Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to an address reachable from your phone:
- Android emulator: `http://10.0.2.2:4000`
- iOS simulator: `http://localhost:4000`
- Physical phone: `http://YOUR_COMPUTER_LAN_IP:4000` (phone and computer must be on the same Wi-Fi)

Scan the Expo QR code with Expo Go. If you change the API URL, restart Expo.

## API reference

All protected endpoints require `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/auth/request-otp` | Request a mock OTP |
| `POST` | `/api/auth/verify-otp` | Verify OTP and receive a JWT |
| `GET` | `/api/loans` | List the current user's loans |
| `POST` | `/api/loans` | Create a loan |
| `PATCH` | `/api/loans/:id/repay` | Mark an unpaid loan as repaid |
| `GET` | `/api/summary` | Return totals for the current user |

### Example requests

Request OTP:

```json
{ "phone": "+919876543210" }
```

Verify OTP:

```json
{ "phone": "+919876543210", "otp": "123456" }
```

Create a loan:

```json
{
  "friendName": "Aarav",
  "amount": 1200,
  "dueDate": "2026-11-15"
}
```

Summary response:

```json
{
  "totalLent": 1200,
  "totalRepaid": 0,
  "overdueAmount": 1200,
  "outstandingAmount": 1200,
  "currency": "INR"
}
```

`totalLent` is the sum of all loan entries, `totalRepaid` is the sum of entries marked repaid, and `overdueAmount` is the sum of unpaid entries whose due date is before today's date. Amounts are stored as PostgreSQL `NUMERIC` and returned as numbers in the API.

## Tests

```bash
cd backend
npm test
```

The unit tests cover phone/loan validation and the summary calculation helper. Database integration tests are not included, so test the API against a local database before sharing a demo.

## Build and demo checklist

Before submitting:
1. Run the backend and mobile app locally.
2. Request OTP and verify it using the code printed in the backend terminal.
3. Add at least two loans: one due in the past and one due in the future.
4. Show the summary, overdue highlighting, and mark one loan as repaid.
5. Record a 2–3 minute walkthrough with Loom or Google Drive.
6. Push this folder to a GitHub repository and add the repository URL to your application.

## Suggested 2–3 minute recording script

- **0:00–0:20** — Introduce MiniLedger and its purpose.
- **0:20–0:45** — Enter phone number, request OTP, show the terminal OTP, and log in.
- **0:45–1:15** — Explain the summary card and loan list.
- **1:15–1:45** — Add a loan with a past due date and show the overdue highlight / summary update.
- **1:45–2:10** — Mark a loan as repaid and show the updated summary.
- **2:10–2:40** — Briefly show the backend API routes, PostgreSQL schema, and README.

## Design decisions and limitations

- Every loan is scoped to the authenticated user's database ID.
- OTP challenges are in-memory for a simple local demo; use Redis and a real SMS provider in production.
- JWT secret and OTP behavior are demo defaults; set a strong secret outside local development.
- The API uses parameterized SQL queries.
- The mobile app stores the JWT in component state for a simple demo; use secure storage (e.g. Expo SecureStore) for a production app.
- No receipt upload is included in this deadline-focused MVP.
