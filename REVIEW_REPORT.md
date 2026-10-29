# Digital Certificate Verification System — Review Report

## Student details

- **Name:** Sharvesh
- **Register number:** URK24CS1256
- **Project:** Digital Certificate Verification System

> This is a personalized working copy based on a project file shared as a starting point. Review the implementation, understand the changes, and follow your institution's rules for acknowledging reused code before submission.

## Changes applied in this reviewed copy

1. **Startup configuration checks**: backend now refuses to start without `MONGO_URI` or a `JWT_SECRET` of at least 32 characters.
2. **Configurable CORS**: origins are read from `CLIENT_ORIGINS` in `backend/.env` instead of being tied to a hardcoded LAN IP.
3. **Request hardening**: removed the `X-Powered-By` header and limited JSON request bodies to 20 KB.
4. **Public verification data minimization**: the public verify endpoint returns only certificate ID, recipient name, course, issuer, issue date, and status—not MongoDB IDs, `userId`, or timestamps.
5. **Certificate issue-date validation**: creation and updates reject invalid or future issue dates.
6. **User deletion protection**: an account with assigned certificates cannot be deleted until those certificates are reassigned or deleted.
7. **Safer error responses**: route failures are logged server-side and generic error messages are returned instead of exposing raw database error text.
8. **Convenience scripts**: added root-level development/build/lint scripts and backend start/dev/admin scripts.
9. **Environment template**: added `backend/.env.example`. Copy it to `backend/.env` and replace all example secrets/credentials. Do not commit `.env`.

## Remaining production recommendations

- Add rate limiting to login, signup, password changes, and public certificate verification.
- Add automated API tests and frontend tests.
- Use HTTPS in production; keep `NODE_ENV=production` so authentication cookies use `Secure`.
- Review CSRF protections for cookie-authenticated state-changing requests, especially if frontend/backend are hosted on different sites.
- Use a unique, random JWT secret and rotate any secret that may have been committed or shared.
- Restrict database network access and use a least-privilege MongoDB account.
- Consider audit logs for certificate creation, revocation, reassignment, and deletion.
- Back up the database and define a recovery process.

## Validation performed

- `node --check` passed for the backend JavaScript files.
- Frontend build could not be completed in this environment because dependencies could not be installed before the install command timed out; `vite` was therefore unavailable. Run `npm install` in `frontend/` on a network-enabled machine, then `npm run build` and `npm run lint`.
- No live MongoDB integration tests were run.
