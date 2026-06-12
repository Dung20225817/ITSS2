# ITSS2 Deploy Status And Next Steps

## Current Status (2026-06-10)

- AWS account: `308621094806`
- Terraform bootstrap: applied in `ap-southeast-1`
  - State bucket: `itss2-tfstate-20260610`
  - Lock table: `itss2-terraform-locks`

### Backend (Lightsail Container)

- URL: `https://itss2-backend.4ybp9r2vbbwrr.ap-southeast-1.cs.amazonlightsail.com/`
- Deployment version: `3`
- Image tag: `openssl-fix-1`
- ECR repo: `308621094806.dkr.ecr.ap-southeast-1.amazonaws.com/itss2-backend`
- Runtime: Node.js + Express + **PostgreSQL (Prisma)**

### Database (Lightsail Managed PostgreSQL)

- Resource name: `itss2-postgres`
- Blueprint: `postgres_14` / Bundle: `micro_2_0` ($15/month)
- Endpoint: `ls-9719301cd2d36b90b36bc963b0c687401394431a.c7iauiiokmuq.ap-southeast-1.rds.amazonaws.com:5432`
- Database name: `itss2` / Username: `itss2admin`
- Publicly accessible: `true`
- DATABASE_URL is stored in Terraform state (S3 bucket)

### Frontend (Vercel)

- Production alias: `https://itss2-frontend.vercel.app`
- Deployment: `https://itss2-frontend-konfzfhtn-phamquocdung2109-7839s-projects.vercel.app`
- `VITE_API_BASE_URL`: Lightsail backend URL
- `VITE_DEFAULT_USER_ID`: `demo-student-1`

## Verified

Backend:
- `/healthz`: HTTP 200
- `/readyz`: HTTP 200 (PostgreSQL connected)
- `/api/v1/jobs?limit=3`: HTTP 200, returns seeded data

Frontend:
- `https://itss2-frontend.vercel.app`: HTTP 200

## Infrastructure Changes From Previous Version

The codebase migrated from **MongoDB** to **PostgreSQL + Prisma**. The full infra was rebuilt:
- Removed: MongoDB Atlas, Secrets Manager (MONGO_URL)
- Added: Lightsail Managed Database (PostgreSQL)
- Simplified: Foundation stack no longer needed (ECR + DB are in `lightsail` stack)
- Fixed: Dockerfile now includes Prisma support (prisma generate, openssl, migrate deploy on start)

## Useful Commands

### Redeploy backend after code changes

```powershell
cd D:\ITSS\ITSS2\ITSS2-Infra
.\scripts\build-and-push-backend.ps1 -BackendDir ..\ITSS2-Backend -EcrRepositoryUrl 308621094806.dkr.ecr.ap-southeast-1.amazonaws.com/itss2-backend -AwsRegion ap-southeast-1 -ImageTag <new_tag>
```

Then update `lightsail\terraform.tfvars`:

```hcl
image_tag = "<new_tag>"
```

Apply:

```powershell
cd D:\ITSS\ITSS2\ITSS2-Infra\lightsail
terraform apply -auto-approve
```

### Redeploy frontend

```powershell
cd D:\ITSS\ITSS2\ITSS2-Frontend
vercel deploy --prod
```

### Get DATABASE_URL

```powershell
cd D:\ITSS\ITSS2\ITSS2-Infra\lightsail
terraform output -raw database_url
```

### Seed database

```powershell
$env:DATABASE_URL = (terraform output -raw database_url)
cd D:\ITSS\ITSS2\ITSS2-Backend
npm run db:seed
```

### Smoke test

```powershell
$base = "https://itss2-backend.4ybp9r2vbbwrr.ap-southeast-1.cs.amazonlightsail.com"
Invoke-WebRequest "$base/healthz" -UseBasicParsing
Invoke-WebRequest "$base/readyz" -UseBasicParsing
Invoke-WebRequest "$base/api/v1/jobs?limit=1" -UseBasicParsing
```

## CORS Origins (currently allowed)

- `https://itss2-frontend.vercel.app`
- `https://itss2-frontend-konfzfhtn-phamquocdung2109-7839s-projects.vercel.app`
- `http://localhost:5173`

To add more origins, update `cors_origins` in `lightsail/terraform.tfvars` and re-apply.
