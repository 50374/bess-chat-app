# BESS Chat App - Free Deployment Strategy

## 🆓 Using Netlify Deploy Previews (0 Credits)

### Current Setup:
- **Production branch**: `main` (costs 15 credits per deploy)
- **Development branch**: `development` (costs 0 credits per deploy)
- **Your custom domain**: ainfragg.com (points to main branch)

### Free Development Workflow:

#### 1. Make Changes on Development Branch
```bash
# Switch to development branch
git checkout development

# Make your changes...
# Test locally with: npm run dev

# Commit and push
git add .
git commit -m "Your changes"
git push origin development
```

#### 2. Create Pull Request for Free Preview
- Go to: https://github.com/50374/bess-chat-app/compare/main...development
- Create PR from `development` to `main`
- Netlify automatically creates Deploy Preview
- Preview URL: `https://deploy-preview-[PR#]--extraordinary-monstera-e00408.netlify.app`
- **Cost: 0 credits** ✅

#### 3. Test on Free Preview
- Test all functionality on the preview URL
- Push more changes to `development` to update preview
- Share with team/stakeholders for review
- Iterate as needed (still 0 credits)

#### 4. Deploy to Production When Ready
```bash
# Merge the PR on GitHub when ready
# This triggers production deploy (15 credits)
```

### 🎯 Benefits:
- **Unlimited free testing** on development branch
- **Only pay 15 credits** when deploying final version to production
- **Same domain** (ainfragg.com) for production
- **Preview URLs** for testing and sharing

### 📝 Development URLs:
- **Production**: https://ainfragg.com (15 credits per deploy)
- **Development Preview**: https://development--extraordinary-monstera-e00408.netlify.app (0 credits)

### ⚡ Quick Commands:
```bash
# Start developing (free)
npm run dev

# Deploy to development preview (free) - Manual steps:
git checkout development
git add .
git commit -m "WIP: testing changes"
git push origin development

# Deploy to production (15 credits) - Manual steps:
git checkout main
git merge development
git push origin main
git checkout development
```