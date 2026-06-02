provider "aws" {
  region = var.aws_region
}

provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}

locals {
  tags = merge(var.tags, {
    Project   = "ITSS2"
    ManagedBy = "Terraform"
  })

  api_base_url = "https://${aws_apprunner_service.backend.service_url}"
}

data "aws_iam_policy_document" "apprunner_ecr_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["build.apprunner.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "apprunner_ecr_access" {
  name               = "${var.service_name}-ecr-access"
  assume_role_policy = data.aws_iam_policy_document.apprunner_ecr_assume.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr_access" {
  role       = aws_iam_role.apprunner_ecr_access.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

data "aws_iam_policy_document" "apprunner_task_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["tasks.apprunner.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "apprunner_instance" {
  name               = "${var.service_name}-instance"
  assume_role_policy = data.aws_iam_policy_document.apprunner_task_assume.json
  tags               = local.tags
}

data "aws_iam_policy_document" "apprunner_secrets" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.mongo_secret_arn]
  }
}

resource "aws_iam_role_policy" "apprunner_secrets" {
  name   = "${var.service_name}-secrets"
  role   = aws_iam_role.apprunner_instance.id
  policy = data.aws_iam_policy_document.apprunner_secrets.json
}

resource "aws_apprunner_service" "backend" {
  service_name = var.service_name
  tags         = local.tags

  source_configuration {
    auto_deployments_enabled = false

    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr_access.arn
    }

    image_repository {
      image_identifier      = "${var.ecr_repository_url}:${var.backend_image_tag}"
      image_repository_type = "ECR"

      image_configuration {
        port = tostring(var.container_port)

        runtime_environment_variables = {
          NODE_ENV     = "production"
          PORT         = tostring(var.container_port)
          CORS_ORIGINS = var.cors_origins
        }

        runtime_environment_secrets = {
          MONGO_URL = var.mongo_secret_arn
        }
      }
    }
  }

  instance_configuration {
    cpu               = var.apprunner_cpu
    memory            = var.apprunner_memory
    instance_role_arn = aws_iam_role.apprunner_instance.arn
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/healthz"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }

  depends_on = [
    aws_iam_role_policy_attachment.apprunner_ecr_access,
    aws_iam_role_policy.apprunner_secrets,
  ]
}

resource "vercel_project" "frontend" {
  name             = var.vercel_project_name
  framework        = var.frontend_framework
  root_directory   = var.frontend_root_directory
  install_command  = var.frontend_install_command
  build_command    = var.frontend_build_command
  output_directory = var.frontend_output_directory

  git_repository = {
    type = "github"
    repo = var.frontend_github_repo
  }
}

resource "vercel_project_environment_variable" "api_base_url" {
  project_id = vercel_project.frontend.id
  key        = "VITE_API_BASE_URL"
  value      = local.api_base_url
  target     = var.vercel_env_targets
}

resource "vercel_project_environment_variable" "default_user_id" {
  project_id = vercel_project.frontend.id
  key        = "VITE_DEFAULT_USER_ID"
  value      = var.default_user_id
  target     = var.vercel_env_targets
}
