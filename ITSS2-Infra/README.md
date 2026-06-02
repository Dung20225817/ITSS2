# ITSS2 Infrastructure

Terraform stacks for deploying ITSS2:

- `bootstrap`: S3 bucket and DynamoDB table for Terraform state.
- `foundation`: ECR repository, MongoDB Atlas project/cluster/user/network access, and AWS Secrets Manager secret for `MONGO_URL`.
- `app`: AWS App Runner backend service and Vercel frontend project/env variables.
- `lightsail`: Lightsail container backend fallback. This is the stack currently used because App Runner is blocked by the AWS account subscription requirement.

The default AWS region is `ap-southeast-1`. Real `*.tfvars` files and backend configs are ignored; keep secrets out of git.

## Prerequisites

- Terraform CLI.
- Docker.
- AWS CLI authenticated to an AWS account.
- Vercel CLI or `VERCEL_API_TOKEN`.
- MongoDB Atlas API public/private key and Atlas org ID.

## Order

1. Bootstrap remote state:

   ```powershell
   cd ITSS2-Infra/bootstrap
   Copy-Item terraform.tfvars.example terraform.tfvars
   terraform init
   terraform apply
   ```

2. Configure `foundation/backend.hcl` from `foundation/backend.hcl.example`, then apply foundation:

   ```powershell
   cd ..\foundation
   Copy-Item terraform.tfvars.example terraform.tfvars
   Copy-Item backend.hcl.example backend.hcl
   terraform init -backend-config=backend.hcl
   terraform apply
   ```

3. Build and push backend image:

   ```powershell
   cd ..
   .\scripts\build-and-push-backend.ps1 `
     -BackendDir ..\ITSS2-Backend `
     -EcrRepositoryUrl <foundation_ecr_repository_url> `
     -AwsRegion ap-southeast-1
   ```

4. Configure `lightsail/backend.hcl` and `lightsail/terraform.tfvars`, then apply the backend service:

   ```powershell
   cd lightsail
   Copy-Item terraform.tfvars.example terraform.tfvars
   Copy-Item backend.hcl.example backend.hcl
   terraform init -backend-config=backend.hcl
   terraform apply
   ```

5. Deploy frontend from `ITSS2-Frontend` with the backend URL:

   ```powershell
   vercel link
   vercel deploy --prod `
     --build-env VITE_API_BASE_URL=<backend_url> `
     --build-env VITE_DEFAULT_USER_ID=682b71380c69774bd1f056bd
   ```

After Vercel returns the production URL, replace the temporary `cors_origins = "*"` with the exact Vercel origin and re-apply the `lightsail` stack.

The `app` stack can be used later if App Runner is enabled for the AWS account.
