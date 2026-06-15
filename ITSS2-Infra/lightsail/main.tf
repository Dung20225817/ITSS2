provider "aws" {
  region = var.aws_region
}

locals {
  tags = merge(var.tags, {
    Project   = "ITSS2"
    ManagedBy = "Terraform"
  })
}

resource "aws_ecr_repository" "backend" {
  name                 = var.ecr_repository_name
  image_tag_mutability = "MUTABLE"
  force_delete         = var.ecr_force_delete
  tags                 = local.tags

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "random_password" "db_password" {
  length  = 24
  special = false
}

resource "aws_lightsail_database" "postgres" {
  relational_database_name = var.db_name
  availability_zone        = "${var.aws_region}a"
  master_database_name     = var.db_database
  master_username          = var.db_username
  master_password          = random_password.db_password.result
  blueprint_id             = "postgres_14"
  bundle_id                = "micro_2_0"
  publicly_accessible      = true
  skip_final_snapshot      = true
  tags                     = local.tags

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [master_username, master_password]
  }
}

resource "aws_lightsail_container_service" "backend" {
  name  = var.service_name
  power = var.power
  scale = var.scale
  tags  = local.tags

  private_registry_access {
    ecr_image_puller_role {
      is_active = true
    }
  }
}

data "aws_iam_policy_document" "lightsail_ecr_pull" {
  statement {
    sid    = "AllowLightsailPull"
    effect = "Allow"

    principals {
      type = "AWS"
      identifiers = [
        aws_lightsail_container_service.backend.private_registry_access[0].ecr_image_puller_role[0].principal_arn,
      ]
    }

    actions = [
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
  }
}

resource "aws_ecr_repository_policy" "lightsail_pull" {
  repository = aws_ecr_repository.backend.name
  policy     = data.aws_iam_policy_document.lightsail_ecr_pull.json
}

locals {
  database_url = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_lightsail_database.postgres.master_endpoint_address}:${aws_lightsail_database.postgres.master_endpoint_port}/${var.db_database}"
}

resource "aws_lightsail_container_service_deployment_version" "backend" {
  count        = var.image_tag != "" ? 1 : 0
  service_name = aws_lightsail_container_service.backend.name
  depends_on   = [aws_ecr_repository_policy.lightsail_pull]

  container {
    container_name = "backend"
    image          = "${aws_ecr_repository.backend.repository_url}:${var.image_tag}"

    environment = {
      NODE_ENV           = "production"
      PORT               = tostring(var.container_port)
      CORS_ORIGINS       = var.cors_origins
      DATABASE_URL       = local.database_url
      JWT_ACCESS_SECRET  = var.jwt_access_secret
      JWT_REFRESH_SECRET = var.jwt_refresh_secret
      COOKIE_SECURE      = var.cookie_secure
    }

    ports = {
      tostring(var.container_port) = "HTTP"
    }
  }

  public_endpoint {
    container_name = "backend"
    container_port = var.container_port

    health_check {
      path                = "/healthz"
      success_codes       = "200"
      healthy_threshold   = 2
      unhealthy_threshold = 5
      timeout_seconds     = 5
      interval_seconds    = 10
    }
  }
}
