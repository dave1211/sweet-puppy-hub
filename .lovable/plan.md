

# Plan: Create Owner Tablet Invite Code

## What
Insert a single one-time-use invite code `OWNER2` for the owner's tablet, similar to the existing `OWNER1` code.

## How
One database insert:

```sql
INSERT INTO invite_codes (code, label, max_uses, current_uses, active, expires_at, metadata)
VALUES ('OWNER2', 'Owner personal - tablet Phantom', 1, 0, true, NULL, '{"owner": true}');
```

## Usage
1. Open Tanner Terminal on your tablet in Phantom browser
2. Enter invite code: **OWNER2**
3. Connect wallet — code becomes used (1/1)

