git push
   ↓
GitHub Actions
   ↓
CI
   ├─ npm ci
   └─ npm run build
   ↓
AWS OIDC
   ↓
AWS SSM
   ↓
EC2
   ├─ git fetch/reset
   ├─ npm ci
   └─ pm2 restart ecommerce-api
   ↓
✅ Live backend
