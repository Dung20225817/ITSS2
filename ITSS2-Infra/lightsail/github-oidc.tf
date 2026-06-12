# ─────────────────────────────────────────────────────────────────────────────
# GitHub Actions OIDC integration
#
# Creates an IAM OIDC provider for GitHub and a role that GitHub Actions can
# assume via OIDC (no long-lived AWS credentials stored in GitHub secrets).
#
# Usage:
#   After `terraform apply`, copy the `github_actions_role_arn` output and
#   save it as the GitHub secret  AWS_ROLE_ARN  in your repository.
# ─────────────────────────────────────────────────────────────────────────────

variable "github_repo" {
  description = "GitHub repository allowed to assume the CI role (format: owner/repo)."
  type        = string
  default     = "Dung20225817/ITSS2"
}

# OIDC provider — one per AWS account; safe to re-apply if it already exists.
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  # GitHub's OIDC thumbprint (stable; verified against GitHub's published cert).
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = local.tags
}

# IAM role that GitHub Actions assumes.
resource "aws_iam_role" "github_actions" {
  name = "itss2-github-actions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # Only pushes to master can deploy.
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/master"
          }
        }
      }
    ]
  })

  tags = local.tags
}

# ── Permissions ───────────────────────────────────────────────────────────────

# ECR: push images.
resource "aws_iam_role_policy" "ecr_push" {
  name = "ecr-push"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer"
        ]
        Resource = aws_ecr_repository.backend.arn
      }
    ]
  })
}

# Lightsail: deploy new container service versions.
resource "aws_iam_role_policy" "lightsail_deploy" {
  name = "lightsail-deploy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lightsail:GetContainerServices",
          "lightsail:GetContainerServiceDeployments",
          "lightsail:CreateContainerServiceDeployment",
          "lightsail:UpdateContainerService",
          "lightsail:GetContainerImages",
          "lightsail:RegisterContainerImage",
          "lightsail:GetRelationalDatabases",
          "lightsail:GetRelationalDatabase"
        ]
        Resource = "*"
      }
    ]
  })
}

# S3 + DynamoDB: read/write Terraform state.
resource "aws_iam_role_policy" "tf_state" {
  name = "terraform-state"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.tf_state_bucket}",
          "arn:aws:s3:::${var.tf_state_bucket}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:*:table/${var.tf_lock_table}"
      }
    ]
  })
}

# ── Output ────────────────────────────────────────────────────────────────────
output "github_actions_role_arn" {
  description = "Save this as the GitHub secret AWS_ROLE_ARN in your repository."
  value       = aws_iam_role.github_actions.arn
}
