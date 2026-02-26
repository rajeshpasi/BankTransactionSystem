# Bank Transaction System (Node.js + Express + MongoDB)

Backend API for user auth, account creation, and account-to-account fund transfer.

## Tech Stack

- Node.js
- Express
- MongoDB (Mongoose)
- JWT Authentication
- Nodemailer (Gmail OAuth2)

## Project Structure

```txt
server.js
src/
  app.js
  DB/db.js
  controller/
  middlewares/
  models/
  routes/
  services/
```

## Prerequisites

- Node.js 18+
- MongoDB running locally on default port
  - Current DB connection in code: `mongodb://localhost:27017/bank_transaction_system`
- Gmail OAuth2 credentials (for email sending)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root:

```env
PORT=3000
JWT_SECRET=your_jwt_secret

EMAIL_USER=your_gmail_address
CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
REFRESH_TOKEN=your_google_oauth_refresh_token
```

## Run

```bash
npm run dev
```

Server starts at:

- `http://localhost:3000`

## Base API Paths

- Auth: `/api/auth`
- Account: `/api/account`
- Transactions: `/api/transactions`

---

## Postman Flow (Step-by-Step)

### 1) Register User

**POST** `/api/auth/register`

Request body:

```json
{
  "email": "alice@example.com",
  "name": "Alice",
  "password": "secret123"
}
```

Response includes:

- `token`
- `user.id`

Save the token for protected routes.

---

### 2) Login User

**POST** `/api/auth/login`

Request body:

```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

Response includes:

- `token`
- `user`

Use this token in Postman header for private APIs:

```txt
Authorization: Bearer <JWT_TOKEN>
```

---

### 3) Create Account

**POST** `/api/account/`

Headers:

- `Authorization: Bearer <JWT_TOKEN>`

Request body:

```json
{}
```

Response returns created account document, including account `_id`.

Create at least 2 accounts (for transfer testing):

- Sender account (fromAccount)
- Receiver account (toAccount)

---

### 4) Fund Transfer

**POST** `/api/transactions/`

Headers:

- `Authorization: Bearer <JWT_TOKEN>`

Request body:

```json
{
  "fromAccount": "<SENDER_ACCOUNT_ID>",
  "toAccount": "<RECEIVER_ACCOUNT_ID>",
  "amount": 100,
  "idmpotencyKey": "txn-1001"
}
```

> Important: field name must be exactly `idmpotencyKey` (same spelling as code).

### Transfer Rules in Current Code

- Both accounts must exist.
- Sender account must belong to logged-in user.
- Sender and receiver cannot be same account.
- Amount must be greater than 0.
- Accounts must be `active`.
- Balance is calculated from ledger credits - debits.
- Idempotency behavior:
  - Same `idmpotencyKey` + completed transaction returns already-processed response.

---

## Optional/Additional Endpoints

### Logout

**POST** `/api/auth/logout`

- Blacklists current token.
- After logout, same token will fail protected routes.

### System Initial Funds Route

**POST** `/api/transactions/system/initial-funds`

- Requires a system user token (`systemUser: true`).
- Currently **not implemented** (returns `501`).

---

## Common Postman Errors

- `Authentication token is missing`
  - Authorization header not sent.
- `Invalid or expired token` / `Unauthorized access, token is invalid`
  - Token expired, malformed, or blacklisted.
- `Forbidden access, not a system user`
  - You are calling system route with normal user token.
- `Insufficient funds in sender account`
  - Sender ledger balance is not enough.

---

## Quick Test Sequence

1. Register user A
2. Login user A and copy JWT
3. Create account A1 with user A token
4. Register/login user B (or create another account if your data setup allows)
5. Create account B1
6. Ensure A1 has credits in ledger (required before transfer)
7. Call `/api/transactions/` with A token and transfer A1 -> B1

---

## Notes

- MongoDB URI is currently hardcoded in `src/DB/db.js`.
- Email sending is enabled and may log OAuth/email errors if credentials are not valid.
- Token blacklist TTL is 3 days.
