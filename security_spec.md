# Firestore Security Specification - Stratis Planner

## Data Invariants
1. Users can only read and write their own profile data.
2. Users can only manage contests they own (under their uid path).
3. Users cannot modify their `userPlan` or `uid` fields.
4. Community data (shared_contests, shared_flashcards) is read-only for public, write-only for owners.
5. All IDs must be valid strings.
6. Timestamps must be validated against `request.time`.

## The "Dirty Dozen" Payloads (Denial Tests)
1. Setting `userPlan` to 'admin' manually.
2. Modifying another user's contest by guessing the ID.
3. Creating a contest with a huge string as name (Resource Exhaustion).
4. Updating `createdAt` timestamp.
5. Deleting a shared contest that belongs to someone else.
6. Injecting a malicious script into the `displayName`.
7. Accessing PII (email) of other users.
8. Creating a user profile for a different UID.
9. Rapidly creating 1000 contests (Rate limiting hint).
10. Bypassing mandatory fields in Contest creation.
11. Updating a Contest's `ownerId`.
12. Listing all users.
