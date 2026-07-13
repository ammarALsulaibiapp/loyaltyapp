# Prompt for Claude Opus

You are working on a QR Loyalty System. Read ALL the code in the project before doing anything. Understand the existing architecture, database schema, frontend pages, backend routes, and how everything connects.

## Your Task

Implement a secure authentication system for the customer wallet. Right now the wallet at `/wallet` lets anyone enter any phone number and see that person's loyalty cards — this is a security hole. Fix it.

## What needs to exist after you're done

1. Customers can **register** with phone number + full name + password (min 8 chars)
2. Customers can **login** with phone + password from any device
3. Login is **persistent** — if they check "remember me" they stay logged in across sessions
4. The wallet shows **all their loyalty cards** across all shops in one place
5. From inside the wallet there is a **"+" button that opens a QR scanner** — customer scans a shop QR code and that shop card is instantly added to their wallet
6. The **"Add to Home Screen" / PWA instructions** must ONLY appear in the main wallet page, not inside individual shop card pages
7. Passwords are **securely hashed** in the database
8. Customer authentication is **completely separate** from the existing staff/business authentication (which uses Supabase Auth — do not touch it)

## Constraints

- Read the codebase first. Understand what already exists.
- Do not break any existing staff or business admin functionality.
- Keep the existing real-time visit updates working.
- The backend already has Express + JWT + bcrypt available.
- The frontend uses React + Zustand + Supabase.
- Deploy target is Netlify (frontend) — make sure the build does not break.
- Run the build and verify it passes before saying you're done.
