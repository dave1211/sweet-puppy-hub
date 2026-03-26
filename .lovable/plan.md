

# Plan: Create Owner Invite Code

## What
Insert a single one-time-use invite code `OWNER1` into the `invite_codes` table with no expiration, labeled as the owner's personal code.

## How
One database insert via the insert tool:

```sql
INSERT INTO invite_codes (code, label, max_uses, current_uses, active, expires_at, metadata)
VALUES ('OWNER1', 'Owner personal - phone Phantom', 1, 0, true, NULL, '{"owner": true}');
```

## Usage
1. Open Tanner Terminal on your phone
2. Enter invite code: **OWNER1**
3. Connect via Phantom wallet
4. Code becomes used (1/1) and can't be re