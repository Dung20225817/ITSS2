# ITSS2 Deploy Status And Next Steps

## Current Status

- AWS account works: `308621094806`.
- Terraform bootstrap is applied in `ap-southeast-1`.
  - State bucket: `itss2-terraform-state-windows11-20260602114120`
  - Lock table: `itss2-terraform-locks`
- Foundation is applied against the existing Atlas project `Project 0`.
  - Atlas project ID: `67da5c37396e3979f79da3bf`
  - Atlas cluster: `Chatbot`
  - ECR repo: `308621094806.dkr.ecr.ap-southeast-1.amazonaws.com/itss2-backend`
  - Mongo URL is stored in AWS Secrets Manager.
- App Runner is not deployed because the AWS account is blocked by the App Runner service subscription requirement.
- Backend is deployed through the Lightsail fallback stack.
  - URL: `https://itss2-backend.4ybp9r2vbbwrr.ap-southeast-1.cs.amazonlightsail.com/`
  - Active deployment version: `6`
  - Current image tag: `healthz-amd64-20260602131805`
- Frontend is deployed to Vercel from the local CLI.
  - Production alias: `https://itss2-frontend.vercel.app`
  - Deployment URL: `https://itss2-frontend-2brsjdkwl-phamquocdung2109-7839s-projects.vercel.app`
  - `VITE_API_BASE_URL` points to the Lightsail backend.

## Verified

Backend:

```powershell
Invoke-WebRequest "https://itss2-backend.4ybp9r2vbbwrr.ap-southeast-1.cs.amazonlightsail.com/healthz" -UseBasicParsing
Invoke-WebRequest "https://itss2-backend.4ybp9r2vbbwrr.ap-southeast-1.cs.amazonlightsail.com/readyz" -UseBasicParsing
Invoke-WebRequest "https://itss2-backend.4ybp9r2vbbwrr.ap-southeast-1.cs.amazonlightsail.com/api/v1/jobs?limit=1" -UseBasicParsing
```

Latest result:

- `/healthz`: HTTP 200
- `/readyz`: HTTP 200, `databaseState = 1`
- `/api/v1/jobs?limit=1`: HTTP 200, but data is empty
- `/api/v1/address`: HTTP 200, but data is empty
- `/api/v1/users/682b71380c69774bd1f056bd/get-category-list`: HTTP 200, empty array
- CORS allows `https://itss2-frontend.vercel.app`.

Frontend:

- `https://itss2-frontend.vercel.app`: HTTP 200
- Production bundle contains the Lightsail API URL.
- Production bundle does not contain `localhost:8080`.

## Important Fixes Applied

- Backend `/healthz` now checks only process/container liveness.
- Backend `/readyz` checks MongoDB readiness.
- Lightsail Terraform now grants the Lightsail ECR image puller principal access to the private ECR repository.
- Backend build/push script now builds a single `linux/amd64` Docker manifest without BuildKit provenance, which is friendlier for Lightsail.
- Lightsail CORS is no longer `*`; it now allows:
  - `https://itss2-frontend.vercel.app`
  - `https://itss2-frontend-2brsjdkwl-phamquocdung2109-7839s-projects.vercel.app`
  - `http://localhost:5173`

## Remaining Work

1. Seed or import Atlas data.

   The backend is healthy, but Atlas currently returns empty job/address/category data. Import the original demo data or create seed data so the homepage and job list show real content.

2. Rotate exposed secrets.

   During debugging, sensitive values were present in local Terraform/CLI outputs. Rotate:

   - The Vercel token.
   - The Atlas database user password used by `itss2_app`.

   After rotating the Atlas password, update the AWS Secrets Manager `MONGO_URL` value and redeploy the Lightsail stack.

3. Optional: connect Vercel to GitHub.

   The local CLI deploy works. GitHub integration failed because Vercel could not connect to `nqk-khanhbk/ITSS2-Frontend`. Install/authorize the Vercel GitHub integration if you want automatic deployments from GitHub.

4. Optional: enable App Runner.

   App Runner remains blocked by:

   ```text
   SubscriptionRequiredException: The AWS Access Key Id needs a subscription for the service
   ```

   If you want App Runner instead of Lightsail, enable/subscribe App Runner for this AWS account, then re-run the `app` stack after updating it to the current image tag and backend config.

5. Optional: add Preview env vars in Vercel.

   Production and Development env vars were saved. Preview env setup asked for a branch-specific selection. Add Preview env vars from the Vercel dashboard if preview deployments are needed.

## Useful Commands

Redeploy backend after code changes:

```powershell
cd D:\ITSS\PJ\ITSS2-Infra
.\scripts\build-and-push-backend.ps1 -BackendDir ..\ITSS2-Backend -EcrRepositoryUrl 308621094806.dkr.ecr.ap-southeast-1.amazonaws.com/itss2-backend -AwsRegion ap-southeast-1 -ImageTag <new_tag>
```

Then update `ITSS2-Infra/lightsail/terraform.tfvars`:

```hcl
image = "308621094806.dkr.ecr.ap-southeast-1.amazonaws.com/itss2-backend:<new_tag>"
```

Apply Lightsail:

```powershell
cd D:\ITSS\PJ\ITSS2-Infra\lightsail
terraform plan -out lightsail.tfplan
terraform apply lightsail.tfplan
```

Redeploy frontend:

```powershell
cd D:\ITSS\PJ\ITSS2-Frontend
vercel deploy --prod
```
