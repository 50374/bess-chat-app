# Deployment Guide for BESS Chat Application

## Overview
This guide walks you through deploying the BESS Chat Application to ainfragg.com with Supabase as the database backend.

## Prerequisites
- Node.js 18+ installed
- Access to ainfragg.com hosting
- Supabase account
- OpenAI API key

## Step 1: Database Setup (Supabase)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Choose a region close to your users

2. **Set up Database Schema**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and run the SQL from `docs/database-schema.sql`
   - This creates the `bess_projects` table and necessary indexes

3. **Get Credentials**
   - Go to Settings > API
   - Copy your Project URL and anon public key
   - Save these for environment variables

## Step 2: OpenAI API Setup

1. **Get API Key**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Create an API key
   - Ensure you have credit/billing set up

2. **Test API Access**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

## Step 3: Frontend Deployment

1. **Build the Frontend**
   ```bash
   # Install dependencies
   npm install
   
   # Create production build
   npm run build
   ```

2. **Configure Environment Variables**
   Create a `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_BASE_URL=https://api.ainfragg.com
   ```

3. **Upload to ainfragg.com**
   - Upload the contents of the `dist/` folder to your web hosting
   - Ensure the API subdomain (api.ainfragg.com) points to your backend

## Step 4: Backend API Deployment

### Option A: Simple Node.js Hosting (Recommended)

1. **Choose a hosting provider:**
   - Railway.app (easiest)
   - Render.com
   - Railway.sh
   - DigitalOcean App Platform

2. **Deploy to Railway (Example):**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables:**
   ```env
   OPENAI_API_KEY=your-openai-key
   NODE_ENV=production
   PORT=3000
   ```

### Option B: Serverless Functions

1. **Vercel Functions**
   - Move `api/server.js` to `api/index.js` 
   - Deploy with `vercel --prod`

2. **Netlify Functions**
   - Create `netlify/functions/` directory
   - Adapt Express routes to function format

## Step 5: DNS Configuration

1. **Main Domain (ainfragg.com)**
   - Point to your frontend hosting
   - Serve static files from `dist/`

2. **API Subdomain (api.ainfragg.com)**
   - Point to your backend server
   - Ensure CORS is configured correctly

## Step 6: Testing

1. **Test Health Endpoint**
   ```bash
   curl https://api.ainfragg.com/api/health
   ```

2. **Test Chat Endpoint**
   ```bash
   curl -X POST https://api.ainfragg.com/api/chat \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Hello"}]}'
   ```

3. **Test Frontend**
   - Visit https://ainfragg.com
   - Start a conversation
   - Check that form updates work

## Step 7: Monitoring

1. **Supabase Dashboard**
   - Monitor database usage
   - Check for errors in logs

2. **Backend Logs**
   - Monitor API response times
   - Watch for OpenAI API errors

3. **Frontend Analytics**
   - Track user interactions
   - Monitor session completion rates

## Security Considerations

1. **Environment Variables**
   - Never commit API keys to git
   - Use secrets management in production

2. **CORS Configuration**
   - Only allow your domain in CORS origins
   - Don't use wildcards in production

3. **Rate Limiting**
   - Implement rate limiting for API endpoints
   - Monitor OpenAI API usage

4. **Database Security**
   - Review Supabase RLS policies
   - Don't expose sensitive data in client

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check API server CORS configuration
   - Ensure frontend URL is in allowed origins

2. **API Connection Failed**
   - Verify API_BASE_URL in frontend
   - Check if API server is running

3. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity

4. **OpenAI API Errors**
   - Check API key validity
   - Monitor rate limits and billing

### Debug Mode

For debugging, add these environment variables:
```env
DEBUG=true
VERBOSE_LOGGING=true
```

## Production Checklist

- [ ] Database schema created in Supabase
- [ ] Environment variables set correctly
- [ ] Frontend built and deployed to ainfragg.com
- [ ] Backend API deployed and accessible
- [ ] DNS records configured
- [ ] HTTPS certificates active
- [ ] CORS configured for production domain
- [ ] Rate limiting implemented
- [ ] Monitoring set up
- [ ] Backup strategy in place

## Support

For deployment issues:
1. Check the application logs
2. Verify all environment variables
3. Test each component independently
4. Review this guide step by step

For application issues:
1. Check the browser console for errors
2. Test the API endpoints directly
3. Monitor Supabase logs
4. Check OpenAI API status