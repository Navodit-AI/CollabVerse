# Environment Variables Setup Guide

This guide explains all the environment variables needed for your CollabVerse application, both for local development and Render deployment.

## Backend Environment Variables (Render)

When deploying your backend to Render, add these environment variables in your Render dashboard:

### Required Variables:

1. **DATABASE_URL**
   - Your MongoDB Atlas connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
   - Get this from MongoDB Atlas → Connect → Connect your application

2. **JWT_SECRET**
   - A strong random string for signing JWT tokens
   - Generate one using: `openssl rand -base64 32`
   - **Important**: Use a different, strong secret for production!

3. **NODE_ENV**
   - Set to: `production`
   - This tells Node.js to run in production mode

4. **PORT** (Optional)
   - Render automatically sets this, but you can override if needed
   - Default: `8080`

5. **FRONTEND_URL** (Recommended for Production)
   - Your frontend URL on Render
   - Format: `https://your-frontend-service.onrender.com`
   - This restricts CORS to only allow requests from your frontend
   - If not set, CORS will allow all origins (less secure)

### How to Add on Render:
1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable above

---

## Frontend Environment Variables (Render)

When deploying your frontend to Render, add these environment variables:

### Required Variables:

1. **NEXT_PUBLIC_API_URL**
   - Your backend API URL on Render
   - Format: `https://your-backend-service.onrender.com`
   - **Important**: Must start with `NEXT_PUBLIC_` to be accessible in the browser
   - Example: `https://collabverse-backend.onrender.com`

### How to Add on Render:
1. Go to your Render dashboard
2. Select your frontend service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add `NEXT_PUBLIC_API_URL` with your backend URL

---

## Local Development Setup

### Backend (.env file in `/backend` folder):

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"
JWT_SECRET="your-local-secret-key"
PORT=8080
NODE_ENV=development
```

### Frontend (.env.local file in `/frontend` folder):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use different JWT_SECRET for production** - Never use the same secret as development
3. **Rotate secrets regularly** - Especially if they're ever exposed
4. **Use Render's environment variables** - Don't hardcode secrets in your code
5. **Enable MongoDB IP whitelist** - In MongoDB Atlas, only allow Render's IPs (or 0.0.0.0/0 for Render)

---

## Current Configuration

Based on your current setup:
- ✅ Backend API URL is already configured in frontend `.env.local`
- ✅ Backend has DATABASE_URL, JWT_SECRET, and PORT configured
- ✅ Frontend code now uses `NEXT_PUBLIC_API_URL` environment variable
- ✅ Backend CORS is configured to use `FRONTEND_URL` in production
- ⚠️ **Action Required**: Add these to your Render backend service:
  - `NODE_ENV=production`
  - `FRONTEND_URL=https://your-frontend-url.onrender.com` (your actual frontend URL)
- ⚠️ Make sure JWT_SECRET on Render is different from your local one

---

## Troubleshooting

### Frontend can't connect to backend:
- Check that `NEXT_PUBLIC_API_URL` is set correctly
- Ensure the backend URL doesn't have a trailing slash
- Verify CORS is configured correctly in backend

### Backend can't connect to database:
- Verify DATABASE_URL is correct
- Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for Render)
- Ensure database user has correct permissions

### JWT tokens not working:
- Verify JWT_SECRET is set and matches between services
- Check that JWT_SECRET is strong enough (at least 32 characters)

