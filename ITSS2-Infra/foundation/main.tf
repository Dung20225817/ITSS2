provider "aws" {
  region = var.aws_region
}

provider "mongodbatlas" {
  public_key  = var.atlas_public_key
  private_key = var.atlas_private_key
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

  encryption_configuration {
    encryption_type = "AES256"
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

resource "mongodbatlas_project" "this" {
  count  = var.atlas_project_id == "" ? 1 : 0
  name   = var.atlas_project_name
  org_id = var.atlas_org_id
}

locals {
  atlas_project_id = var.atlas_project_id != "" ? var.atlas_project_id : mongodbatlas_project.this[0].id
}

resource "mongodbatlas_cluster" "this" {
  count                       = var.atlas_existing_srv_address == "" ? 1 : 0
  project_id                  = local.atlas_project_id
  name                        = var.atlas_cluster_name
  mongo_db_major_version      = var.atlas_mongo_major_version
  provider_name               = "TENANT"
  backing_provider_name       = "AWS"
  provider_region_name        = var.atlas_provider_region_name
  provider_instance_size_name = var.atlas_instance_size_name
}

resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "mongodbatlas_database_user" "app" {
  project_id         = local.atlas_project_id
  username           = var.atlas_db_username
  password           = random_password.db_password.result
  auth_database_name = "admin"

  roles {
    role_name     = "readWrite"
    database_name = var.atlas_database_name
  }
}

resource "mongodbatlas_project_ip_access_list" "app_runner_demo" {
  project_id = local.atlas_project_id
  cidr_block = var.atlas_access_cidr
  comment    = "Temporary App Runner demo access"
}

locals {
  atlas_srv_address = var.atlas_existing_srv_address != "" ? var.atlas_existing_srv_address : mongodbatlas_cluster.this[0].srv_address
  mongo_host        = replace(local.atlas_srv_address, "mongodb+srv://", "")
  mongo_url         = "mongodb+srv://${mongodbatlas_database_user.app.username}:${random_password.db_password.result}@${local.mongo_host}/${var.atlas_database_name}?retryWrites=true&w=majority"
}

resource "aws_secretsmanager_secret" "mongo_url" {
  name                    = var.mongo_secret_name
  recovery_window_in_days = 7
  tags                    = local.tags
}

resource "aws_secretsmanager_secret_version" "mongo_url" {
  secret_id     = aws_secretsmanager_secret.mongo_url.id
  secret_string = local.mongo_url
}
