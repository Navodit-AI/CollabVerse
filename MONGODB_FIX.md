# Fix MongoDB Connection Error

## Error Message
```
Server selection timeout: No available servers
I/O error: received fatal alert: InternalError
```

This error means your backend on Render **cannot connect to MongoDB Atlas**.

## Quick Fix (Recommended)

### Step 1: Allow All IPs in MongoDB Atlas (Temporary)

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Click on your cluster
3. Go to **Network Access** (left sidebar)
4. Click **Add IP Address**
5. Click **Allow Access from Anywhere**
   - This adds `0.0.0.0/0` to your whitelist
   - ⚠️ **Security Note**: This allows connections from any IP. For production, restrict to specific IPs.

### Step 2: Verify Database Connection String

1. In MongoDB Atlas, go to **Database Access** → **Connect**
2. Click **Connect your application**
3. Copy the connection string
4. It should look like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```
5. Make sure it's set in Render backend environment variables as `DATABASE_URL`

### Step 3: Check Render Environment Variables

In your Render dashboard for the backend service:

1. Go to **Environment** tab
2. Verify `DATABASE_URL` is set correctly
3. Make sure there are no extra spaces or quotes
4. The URL should start with `mongodb+srv://`

### Step 4: Restart Backend Service

1. In Render dashboard, go to your backend service
2. Click **Manual Deploy** → **Deploy latest commit**
3. Or click **Restart** if available

## Alternative: Allow Specific Render IPs

If you want better security (recommended for production):

1. Find Render's IP ranges (they change, so check Render docs)
2. In MongoDB Atlas → Network Access
3. Add each IP range manually
4. Common Render IPs (check current ones):
   - `44.224.0.0/16`
   - `52.36.0.0/16`
   - (Check Render documentation for current IPs)

## Verify Connection

After making changes, test the connection:

```bash
curl -X POST https://collabverse-backend.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'
```

Should return JSON (not HTML error page).

## Common Issues

### Issue 1: Connection String Format
**Problem**: Wrong connection string format
**Solution**: Make sure it's `mongodb+srv://` not `mongodb://`

### Issue 2: Username/Password in URL
**Problem**: Special characters in password not URL-encoded
**Solution**: URL-encode special characters (e.g., `@` becomes `%40`)

### Issue 3: Database Name
**Problem**: Database name in connection string doesn't exist
**Solution**: Create the database in MongoDB Atlas or use an existing one

### Issue 4: Cluster Paused
**Problem**: MongoDB Atlas free tier cluster is paused
**Solution**: Go to Atlas dashboard and resume the cluster

## Testing Locally

To test if the connection string works:

1. Install MongoDB shell or use a MongoDB client
2. Try connecting with the connection string
3. Or test with a simple Node.js script:

```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

try {
  await prisma.$connect();
  console.log('✅ Connected to MongoDB');
} catch (err) {
  console.error('❌ Connection failed:', err.message);
}
```

## Security Best Practices

1. **For Development**: Use `0.0.0.0/0` (allow all IPs)
2. **For Production**: 
   - Restrict to specific IP ranges
   - Use MongoDB Atlas VPC peering if available
   - Enable MongoDB Atlas IP Access List alerts

## Still Not Working?

1. Check MongoDB Atlas cluster status (not paused?)
2. Verify database user has correct permissions
3. Check Render logs for detailed error messages
4. Try creating a new database user in MongoDB Atlas
5. Verify the connection string doesn't have extra characters

