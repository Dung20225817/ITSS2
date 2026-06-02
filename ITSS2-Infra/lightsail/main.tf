provider "aws" {
  region = var.aws_region
}

locals {
  image_path          = join("/", slice(split("/", var.image), 1, length(split("/", var.image))))
  ecr_repository_name = split(":", local.image_path)[0]

  tags = merge(var.tags, {
    Project   = "ITSS2"
    ManagedBy = "Terraform"
  })
}

data "aws_secretsmanager_secret_version" "mongo_url" {
  secret_id = var.mongo_secret_arn
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
  repository = local.ecr_repository_name
  policy     = data.aws_iam_policy_document.lightsail_ecr_pull.json
}

resource "aws_lightsail_container_service_deployment_version" "backend" {
  service_name = aws_lightsail_container_service.backend.name
  depends_on   = [aws_ecr_repository_policy.lightsail_pull]

  container {
    container_name = "backend"
    image          = var.image

    environment = {
      NODE_ENV     = "production"
      PORT         = tostring(var.container_port)
      CORS_ORIGINS = var.cors_origins
      MONGO_URL    = data.aws_secretsmanager_secret_version.mongo_url.secret_string
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
