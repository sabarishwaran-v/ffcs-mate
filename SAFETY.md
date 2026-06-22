# Safety & Guardrails (SAFETY.md)

Because FFCS MATE handles user accounts and cloud data, strict security rules and guardrails are in place to ensure privacy and prevent abuse.

## 1. Authentication Guardrails
- **Domain Lock:** Google Authentication is strictly locked to `@vitapstudent.ac.in`. Personal `@gmail.com` accounts will be rejected by the frontend OAuth provider.
- **Why?** To ensure the platform remains exclusive to the student body and to prevent bots or bad actors from exhausting Firebase quotas.

## 2. Database Security Rules
All read and write access is handled securely by Firebase Firestore Security Rules.
- **Rooms:** A user can only read or write to a `room` document if their authenticated User ID (`uid`) is present in the room's `memberIds` array.
- **No Global Queries:** Users cannot query the entire `rooms` collection. They must know the specific Room ID (the 6-character invite code) to attempt entry.

## 3. Privacy Rules
- **No PII Storage:** FFCS MATE does not store full names, phone numbers, or registration numbers.
- **Display Names:** Only the user's Google Display Name and Avatar Photo URL are temporarily kept in the room metadata to show other collaborators who they are planning with.
- **Ephemeral Data:** Timetable data is considered highly ephemeral. The CRON job aggressively deletes inactive rooms (older than 48 hours) to ensure student schedules are not permanently kept on our servers.

## 4. Hard "Never Do" Lines
- **Never store passwords.** All authentication is delegated to Google via OAuth.
- **Never scrape VTOP live.** Course data must be manually compiled into `courses.json` to prevent IP bans and overloading university servers.
- **Never allow public read access** to Firestore. Every single rule must require `request.auth != null`.
