# Auth App (Signup / Login / Forgot Password)

Stack: Node.js, Express, Supabase (PostgreSQL), JWT, bcrypt, Nodemailer

## Setup
1. supabase.com par project banayein
2. SQL Editor mein `db/schema.sql` ka code paste karke RUN karein
3. Project Settings -> API se `Project URL` aur `service_role` key copy karein
4. `.env.example` ko `.env` banayein aur values bharein
5. `npm install` phir `npm start`
6. Browser: http://localhost:5000/signup.html

## API
| Method | URL | Body |
|---|---|---|
| POST | /api/auth/signup | name, email, password |
| POST | /api/auth/login | email, password |
| POST | /api/auth/forgot-password | email |
| POST | /api/auth/reset-password/:token | password |
| GET  | /api/auth/me | Header: Authorization: Bearer TOKEN |
