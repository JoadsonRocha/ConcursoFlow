# Security Specification for ConcursoFlow

## Data Invariants
1. A user can only read and write their own profile (`/users/{userId}`).
2. A user can only read and write contests within their own user document (`/users/{userId}/contests/{contestId}`).
3. IDs must be valid (max 128 chars, alphanumeric + hyphens).
4. Timestamps must be handled by the server.
5. `email` in the user profile must match the authenticated user's email.

## The "Dirty Dozen" Payloads (Denial Tests)
1. Write to another user's profile.
2. Write a contest to another user's contests subcollection.
3. Create a user profile with an email that doesn't match `request.auth.token.email`.
4. Create a document with an ID longer than 128 characters.
5. Create a document with an ID containing malicious characters.
6. Skip `updatedAt` during an update.
7. Modify `createdAt` after creation.
8. Update a user profile without being signed in.
9. Delete a contest that belongs to another user.
10. Update a contest field with an invalid type (e.g., `dailyGoalHours` as a string).
11. Update a contest with an excessively large payload (not directly testable in rules logic but prevented by size checks).
12. Attempt to read all users without specific IDs.

## Test Runner (Logic Verification)
(Simplified representation - the actual rules will be built based on these invariants)
