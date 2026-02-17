# 🚨 SECURITY INCIDENT REMEDIATION GUIDE

**Date:** February 17, 2026  
**Issue:** GitHub detected publicly leaked MongoDB Atlas credentials  
**Status:** IN PROGRESS - Requires immediate action

---

## 📋 SECURITY INCIDENT SUMMARY

### **What Happened:**
- MongoDB Atlas Database URI with credentials was committed to git history
- File: `SOLUCION_COMPLETA.md` (commit `4828676c53c12d8bddd01341e9fb85adb88d23ea`)
- Exposed credentials:
  - **MongoDB Username:** `jorge`
  - **MongoDB Host:** `ac-tc6lmyb-shard-00-*.sgfro21.mongodb.net`
  - **Database:** `web-psicologia`
  - **JWT Secret:** Also exposed in plaintext

### **Risk Level:** 🔴 **CRITICAL**
- Credentials are publicly accessible in git history
- Any person with repository access can view old credentials
- Existing data in MongoDB is at risk

---

## ✅ IMMEDIATE ACTIONS REQUIRED (Do This NOW)

### **Step 1: Rotate MongoDB Credentials** ⏱️ **DO THIS FIRST**

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Navigate to your cluster
3. Go to **Database Access** (in the left menu)
4. **Delete the user `jorge`**
   - Find user "jorge"
   - Click the trash icon → Confirm deletion
5. **Create a NEW database user**
   - Click "Add New Database User"
   - Username: Use something different (e.g., `web_psicologia_user`)
   - Password: Generate new secure password (click "Autogenerate Secure Password")
   - Copy the generated credentials
6. **Update connection string**
   - Go to **Clusters** → Click "Connect"
   - Select "Connect your application"
   - Copy the new MongoDB URI
   - Replace `<username>` and `<password>` with your new credentials

### **Step 2: Rotate JWT Secret**

Generate a new JWT secret token:
- Go to [https://randomkeygen.com/](https://randomkeygen.com/)
- Use the "CodeIgniter Encryption Keys" option
- Copy a string with 64+ characters

### **Step 3: Update Environment Variables in Vercel**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your backend project: `neuro-espacio-project-backend`
3. Click **Settings** → **Environment Variables**
4. **Update these variables:**

```
Name: MONGODB_URI
Value: <YOUR NEW MONGODB URI WITH NEW CREDENTIALS>
Environments: ✓ Production  ✓ Preview  ✓ Development
```

```
Name: TOKEN_SECRET
Value: <YOUR NEW JWT SECRET>
Environments: ✓ Production  ✓ Preview  ✓ Development
```

5. Click **Save**
6. Go to **Deployments** and trigger a new deployment

### **Step 4: Update Local Development Files**

1. Open `.env.local` file in the backend folder
2. Replace the placeholder values:
   ```
   TOKEN_SECRET=<your-new-jwt-secret>
   MONGODB_URI=<your-new-mongodb-uri>
   ```
3. Save the file (it's in `.gitignore`, so it won't be committed)

### **Step 5: Clean Git History** (Optional but Recommended)

To remove the secrets completely from git history, you can use BFG Repo-Cleaner:

```bash
# Install BFG
# On macOS: brew install bfg
# On Windows: Download from https://rtyley.github.io/bfg-repo-cleaner/

# Navigate to your repo
cd web-psicología-backend

# Remove the file from history
bfg --delete-files SOLUCION_COMPLETA.md

# Clean up
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Force push the cleaned history (BE CAREFUL!)
git push --force
```

---

## 📁 File Changes Made

### **Files Modified:**

1. **`.env`** - Credentials replaced with placeholders
   - ✅ Old JWT secret removed
   - ✅ Old MongoDB URI removed
   - ⚠️ Will be ignored by git

2. **`.env.local`** - Created new local development file
   - Contains template values
   - Add your new credentials here
   - Will be ignored by git (in `.gitignore`)

3. **`.gitignore`** - Updated to include env files
   - Added `.env.local`
   - Added `.env.*.local`
   - Added `.env.*.production`

---

## 🔍 Verification Checklist

After completing the steps above, verify:

- [ ] Old MongoDB user `jorge` deleted from MongoDB Atlas
- [ ] New MongoDB user created with different credentials
- [ ] New MongoDB URI tested locally (`npm run dev`)
- [ ] Vercel environment variables updated
- [ ] `.env.local` file created with new credentials
- [ ] `.env` file contains only placeholders
- [ ] New deployment successful on Vercel
- [ ] Frontend can authenticate with backend
- [ ] No errors in Vercel logs

---

## 📚 Security Best Practices

### **Environment Variable Guidelines:**

1. **Local Development (.env.local)**
   - Use this file for local testing
   - Add to `.gitignore` ✅
   - Never commit to git

2. **Vercel Production**
   - Use Vercel Environment Variables dashboard
   - Never expose in code
   - Rotate credentials regularly

3. **CI/CD Pipelines**
   - Use secrets management tools
   - Rotate credentials monthly
   - Never log credentials

### **For Future Projects:**

```
✅ DO:
- Use environment variables for ALL secrets
- Create .env.example with placeholder values
- Document what each variable does
- Rotate credentials regularly
- Use strong, random passwords

❌ DON'T:
- Hardcode credentials in code
- Commit .env files
- Share credentials in emails/chat
- Use simple/guessable passwords
- Reuse credentials across services
```

---

## 🆘 Troubleshooting

### **"Cannot connect to MongoDB" error:**
- Verify new credentials in `.env.local`
- Check MongoDB Atlas user has the correct permissions
- Ensure IP whitelist allows your current IP address

### **"401 Unauthorized" on API calls:**
- Generate new JWT secret
- Update in both Vercel and `.env.local`
- Clear browser cookies and re-login

### **"CORS errors" after updates:**
- Verify `ORIGIN` variable matches frontend URL
- Check Vercel logs for errors
- Trigger a new deployment

---

## 📞 GitHub Alert Closure

Once you've completed all steps:

1. Go to [GitHub Security Alerts](https://github.com/your-repo/security/alerts)
2. Find the alert: "MongoDB Atlas Database URI with credentials"
3. Status: Mark as **"Revoked"** with note:
   ```
   Credentials rotated. Old user 'jorge' deleted from MongoDB Atlas.
   New credentials generated and deployed to Vercel.
   .env files added to .gitignore to prevent future leaks.
   ```

---

## 📝 Summary

| Task | Status | Deadline |
|------|--------|----------|
| Delete old MongoDB user | ⏳ TODO | NOW |
| Create new MongoDB user | ⏳ TODO | NOW |
| Update Vercel variables | ⏳ TODO | Now |
| Test backend locally | ⏳ TODO | Before next deploy |
| Update frontend auth flow | ✅ No changes needed | - |
| Close GitHub alert | ⏳ TODO | After verification |

---

**Last Updated:** February 17, 2026  
**Security Level:** 🔴 Critical  
**Action Required:** Yes, immediate
