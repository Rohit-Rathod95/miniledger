# MiniLedger

MiniLedger is a small app to track money lent to friends. Phone-number login with a mock OTP, loan entries with due dates, mark-as-repaid, and a summary of total lent / total repaid / overdue.

## Stack

- **backend/** — Node.js + TypeScript + Express, PostgreSQL (hosted on Supabase), Supabase Storage for receipt photos, JWT auth, zod validation.
- **app/** — React Native (Expo) + TypeScript, React Navigation, AsyncStorage for the token.

## Prerequisites

- Node.js 22+
- npm
- A Supabase project (Postgres + a public Storage bucket named "receipts")
- Expo Go app on a phone (or an emulator)

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env        # then fill in the values
npm run migrate             # creates the tables
npm run dev                 # starts on http://localhost:4000
```

### Backend Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase Postgres connection string (Session pooler URI) |
| `PGSSL` | `"true"` when connecting to Supabase |
| `JWT_SECRET` | Any long random string, used to sign JWTs |
| `JWT_EXPIRES_IN` | Token expiration time, e.g. `"30d"` |
| `OTP_TTL_MINUTES` | OTP validity window (default `5`) |
| `EXPOSE_OTP_IN_RESPONSE` | `"true"` to also return the OTP in the response (dev only) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key for Storage uploads |
| `SUPABASE_STORAGE_BUCKET` | `"receipts"` |
| `PORT` | Server port (default `4000`) |

> **Important Note:** The mock OTP is printed to the **SERVER LOG** (console) — that's by design. When you request an OTP, watch the backend terminal for a line like `[OTP] 9876543210 -> 123456`.

## App Setup

```bash
cd app
npm install
```

Create a `.env` file in the `app/` folder with:

```env
EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:4000
```

Start Expo:

```bash
npx expo start
```

Then scan the QR code with Expo Go. The phone and computer must be on the same Wi-Fi; the API URL must be the computer's LAN IP (not `localhost`).

## API Reference

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/request-otp` | None | Body `{ phone }` — generates an OTP, prints it to the server log |
| `POST` | `/auth/verify-otp` | None | Body `{ phone, otp }` — returns `{ token, user }` |
| `POST` | `/loans` | Bearer | Body `{ friendName, amount, dueDate, receiptUrl? }` — creates a loan |
| `GET` | `/loans` | Bearer | Lists the current user's loans (each with an `isOverdue` flag) |
| `PATCH` | `/loans/:id/repaid` | Bearer | Marks a loan repaid (body `{ repaid }` optional, defaults `true`) |
| `GET` | `/summary` | Bearer | Returns `{ totalLent, totalRepaid, overdueAmount }` |
| `POST` | `/uploads/receipt` | Bearer | Multipart form field `"file"` — uploads a receipt photo, returns `{ url }` |

## Tests

```bash
cd backend
npm test
```

Integration tests run against the `DATABASE_URL` Postgres; they create and then delete two throwaway users.

## Project Structure

```text
miniledger/
├── backend/
│   ├── db/
│   │   ├── migrate.ts
│   │   └── schema.sql
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── error.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── loans.ts
│   │   │   ├── summary.ts
│   │   │   └── uploads.ts
│   │   ├── services/
│   │   │   ├── loans.ts
│   │   │   ├── otp.ts
│   │   │   ├── storage.ts
│   │   │   └── token.ts
│   │   └── validation/
│   │       └── schemas.ts
│   └── tests/
│       ├── auth.test.ts
│       ├── helpers.ts
│       ├── loans.test.ts
│       └── units.test.ts
└── app/
    └── src/
        ├── api/
        │   ├── auth.ts
        │   ├── client.ts
        │   ├── loans.ts
        │   └── uploads.ts
        ├── context/
        │   └── AuthContext.tsx
        └── screens/
            ├── AddEntryScreen.tsx
            ├── HomeScreen.tsx
            └── LoginScreen.tsx
```

## Design Notes

- Money is stored as `numeric(12,2)`.
- Overdue status is computed in the database using IST (`Asia/Kolkata`).
- Every query is scoped to the JWT's user id so users only see their own loans.
- Row Level Security is not used because the app never talks to Supabase directly — only the backend does.
