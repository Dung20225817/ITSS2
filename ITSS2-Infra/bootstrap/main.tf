provider "aws" {
  region = var.aws_region
}

locals {
  tags = merge(var.tags, {
    Project   = "ITSS2"
    ManagedBy = "Terraform"
  })
}

resource "aws_s3_bucket" "tfstate" {
  bucket        = var.state_bucket_name
  force_destroy = var.bucket_force_destroy
  tags          = local.tags
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "terraform_locks" {
  name                        = var.lock_table_name
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "LockID"
  deletion_protection_enabled = var.lock_table_deletion_protection
  tags                        = local.tags

  attribute {
    name = "LockID"
    type = "S"
  }
}
