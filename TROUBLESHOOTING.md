# Troubleshooting Network Errors

## Issue: "Network error: Failed to fetch"

This error means the frontend cannot connect to the backend server.

### Quick Fixes:

1. **Restart Next.js Dev Server**
   ```bash
   cd frontend
   # Stop the server (Ctrl+C)
   npm run dev
   ```
   Environment variables are loaded at startup, so restart is needed after changing `.env.local`

2. **Verify Environment Variable**
   - Open browser console (F12)
   - Check the console logs - you should see "API URL: https://collabverse-backend.onrender.com"
   - If you see "API URL: http://localhost:8080", the env variable isn't loaded

3. **Check Backend Status**
   ```bash
   curl https://collabverse-backend.onrender.com/
   ```
   Should return: "✅ Server is alive!"

4. **Test Backend Endpoint**
   ```bash
   curl -X POST https://collabverse-backend.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test","password":"test"}'
   ```

### Common Issues:

#### Issue 1: Environment Variable Not Loading
**Solution:** 
- Make sure `.env.local` is in `/frontend` directory
- Variable must start with `NEXT_PUBLIC_`
- Restart dev server after changes

#### Issue 2: CORS Error
**Solution:**
- Backend CORS is set to allow all origins (`*`)
- If still getting CORS errors, check browser console for specific error

#### Issue 3: Backend Not Responding
**Solution:**
- Check if backend is deployed on Render
- Render free tier spins down after inactivity - first request may take 30-60 seconds
- Check Render dashboard for service status

#### Issue 4: SSL/Certificate Issues
**Solution:**
- Make sure you're using `https://` not `http://` for Render URLs
- Check browser console for SSL errors

### Debug Steps:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to login/signup
4. Check the console logs for:
   - "API URL: ..." - shows which URL is being used
   - "Full URL: ..." - shows the complete endpoint
   - Any CORS or network errors

5. Go to Network tab
6. Try login again
7. Look for the `/api/auth/login` request
8. Check:
   - Request URL (should be Render URL)
   - Status code
   - Response headers
   - Error message if failed

### For Local Development:

If you want to test with local backend:

1. Start backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Update `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

3. Restart frontend dev server

### For Production (Render):

Make sure in Render dashboard:

**Backend Service:**
- Environment variables:
  - `DATABASE_URL` ✓
  - `JWT_SECRET` ✓
  - `NODE_ENV=production` (optional)
  - `PORT` (auto-set by Render)

**Frontend Service:**
- Environment variables:
  - `NEXT_PUBLIC_API_URL=https://collabverse-backend.onrender.com` ✓

