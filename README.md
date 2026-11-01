# Dharsana K — Portfolio

Professional hybrid light/dark student portfolio using React + Vite, Express and PostgreSQL.

## Requirements
- Node.js 20+ and npm
- PostgreSQL database for the contact form

## Install and run locally
```bash
npm install
npm install --prefix frontend
cp .env.example .env
# Edit .env: DATABASE_URL=<your database connection string>
npm run build
npm start
```
Visit http://localhost:10000

For live frontend editing run `npm run dev` in another terminal. Vite runs at http://localhost:5173 and proxies `/api` to port 10000.

## Database
The server automatically creates the `messages` table on successful connection. Contact form inserts are parameterized and rate-limited. Set `DATABASE_URL` in your environment.

## Render deploy (single web service)
1. Push entire repository to GitHub (without `.env`).
2. Render dashboard > New > Web Service > connect GitHub repository.
3. Root Directory: leave blank (repository root).
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Add environment variable `DATABASE_URL` (from Render PostgreSQL internal database URL or another PostgreSQL host). Do not put it in frontend variables.
7. Choose suitable service plan; deploy. Visit `/api/health` to check database state.

For Render PostgreSQL, use its internal connection URL for a Render service in the same region. Free Render Postgres expires after 30 days. Consider a long-lived provider or paid plan for a permanent portfolio.

## Security and customization
- The contact form saves messages but does not email them automatically.
- No public admin dashboard is included; use your database console or an authenticated management tool to view messages.
- Replace placeholder project details and add real portfolio links when available.
- Theme toggle cycles Hybrid > Dark > Light; selection is stored locally.
- To view messages, run `SELECT name,email,message,created_at FROM messages ORDER BY created_at DESC;` in an authorized PostgreSQL console.
- `DB_SSL=true` disables certificate verification in this demo; avoid using it with untrusted networks or databases. Prefer provider-supplied CA verification in production.
