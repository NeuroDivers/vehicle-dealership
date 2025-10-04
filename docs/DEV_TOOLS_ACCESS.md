# Dev Tools Access

## Overview

The Dev Tools page (`/admin/cloudflare-images`) is a restricted area only accessible to users with the **dev** role.

---

## Access Control

### Who Can See It?
- ✅ Users with `role: 'dev'`
- ❌ Users with `role: 'admin'`
- ❌ Users with `role: 'staff'`
- ❌ All other roles

### Navigation Button
- **Desktop:** "Dev" button appears after "Reports" in the top navigation
- **Mobile:** "Dev" link appears in the mobile menu after "Reports"
- **Icon:** Image icon (lucide-react)

---

## Current Dev Tools

### Cloudflare Images Management

**Location:** `/admin/cloudflare-images`

**Features:**
- **Delete All Images** - Removes ALL images from Cloudflare Images
- Confirmation dialog with warnings
- Detailed results (deleted count, failed count)
- Instructions for re-uploading images

**Use Cases:**
- Testing image upload functionality
- Clearing duplicate images
- Starting fresh with inventory
- Freeing up Cloudflare Images storage

---

## How to Set User Role to Dev

### Option 1: Via Database (D1)

```sql
-- Update existing user to dev role
UPDATE staff 
SET role = 'dev' 
WHERE email = 'your-email@example.com';

-- Check user's role
SELECT name, email, role FROM staff WHERE email = 'your-email@example.com';
```

### Option 2: Via Cloudflare Dashboard

1. Go to Cloudflare Dashboard
2. Select your account
3. Go to D1 Databases
4. Select `vehicle-dealership-analytics`
5. Go to "Console" tab
6. Run SQL query to update role

### Option 3: Create New Dev User

```sql
INSERT INTO staff (name, email, password_hash, role, created_at)
VALUES (
  'Dev User',
  'dev@example.com',
  'hashed-password-here',
  'dev',
  datetime('now')
);
```

---

## Security Notes

### ⚠️ Important
- Dev tools contain **dangerous operations** (e.g., delete all images)
- Only grant dev role to trusted developers
- Actions cannot be undone
- Always backup before using dev tools

### Role Hierarchy
1. **dev** - Full access including dev tools
2. **admin** - Full admin access (no dev tools)
3. **staff** - Limited staff access
4. **viewer** - Read-only access (if implemented)

---

## Adding New Dev Tools

To add new dev tools to this page:

1. **Update Page:** Edit `src/app/admin/cloudflare-images/page.tsx`
2. **Add Section:** Create new card/section in the page
3. **Add API Endpoint:** Create endpoint in `src/worker.js` if needed
4. **Test:** Ensure only dev role can access

Example structure:
```tsx
<div className="bg-white rounded-lg shadow-md p-6 mb-6">
  <h2 className="text-2xl font-semibold mb-4 pb-2 border-b">
    New Dev Tool Name
  </h2>
  <div>
    {/* Tool content here */}
  </div>
</div>
```

---

## Testing Access Control

### Test as Dev User
1. Login with dev role user
2. Should see "Dev" button in navigation
3. Can access `/admin/cloudflare-images`
4. Can use all dev tools

### Test as Non-Dev User
1. Login with admin/staff role user
2. Should NOT see "Dev" button in navigation
3. Direct URL access will work (need to add page-level check)

### TODO: Add Page-Level Protection
Currently only navigation is restricted. Consider adding:
```tsx
// In cloudflare-images/page.tsx
useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role !== 'dev') {
    router.push('/admin');
  }
}, []);
```

---

## Future Dev Tools Ideas

Potential tools to add:
- 📊 **Database Tools** - Query builder, table viewer
- 🔄 **Cache Management** - Clear caches, view cache stats
- 📝 **Log Viewer** - View worker logs, error logs
- 🧪 **Test Data Generator** - Create test vehicles, leads
- 🔍 **API Tester** - Test API endpoints directly
- 📈 **Performance Monitor** - Check API response times
- 🗂️ **Backup/Restore** - Database backup/restore utilities

---

## Summary

✅ Dev Tools page restricted to dev role  
✅ "Dev" button in navigation (dev only)  
✅ Cloudflare Images deletion tool  
⚠️ Grant dev role responsibly  
🔒 Dangerous operations require confirmation  
