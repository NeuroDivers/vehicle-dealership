# Apply Dev Role Migration

## Issue
The `staff` table has a CHECK constraint that only allows these roles:
- `'admin'`
- `'manager'`
- `'sales'`
- `'staff'`

When you try to set role to `'dev'`, you get:
```
Error: CHECK constraint failed: role IN ('admin', 'manager', 'sales', 'staff'): SQLITE_CONSTRAINT
```

## Solution
Apply the migration to add `'dev'` to the allowed roles.

---

## How to Apply Migration

### Option 1: Via Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account: **nick.damato001@gmail.com**
3. Go to **D1 Databases**
4. Select: **vehicle-dealership-analytics**
5. Go to **Console** tab
6. Copy and paste the SQL from `migrations/add-dev-role.sql`
7. Click **Execute**

### Option 2: Via Wrangler CLI

```bash
# From project root
npx wrangler d1 execute vehicle-dealership-analytics --file=migrations/add-dev-role.sql
```

---

## After Migration

Once the migration is applied, you can set your role to dev:

```sql
UPDATE staff 
SET role = 'dev' 
WHERE email = 'nick@neurodivers.ca';

-- Verify
SELECT name, email, role FROM staff WHERE email = 'nick@neurodivers.ca';
```

You should see:
```
name          | email                  | role
Nick Damato   | nick@neurodivers.ca    | dev
```

---

## What Changes

**Before:**
```sql
role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('admin', 'manager', 'sales', 'staff'))
```

**After:**
```sql
role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('admin', 'manager', 'sales', 'staff', 'dev'))
```

---

## Rollback (If Needed)

To rollback, run the same migration but without 'dev' in the CHECK constraint:

```sql
CREATE TABLE staff_new (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('admin', 'manager', 'sales', 'staff')),
  phone TEXT,
  is_active INTEGER DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO staff_new SELECT * FROM staff;
DROP TABLE staff;
ALTER TABLE staff_new RENAME TO staff;
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active);
```

---

## Summary

✅ Migration file created: `migrations/add-dev-role.sql`  
✅ Base schema updated: `staff-auth-schema.sql`  
✅ Apply via Cloudflare Dashboard or Wrangler CLI  
✅ Then set your role to 'dev'  
✅ Dev Tools page will become visible  
