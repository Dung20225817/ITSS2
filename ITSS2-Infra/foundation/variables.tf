variable "aws_region" {
  description = "AWS region for backend infrastructure."
  type        = string
  default     = "ap-southeast-1"
}

variable "ecr_repository_name" {
  description = "ECR repository name for the backend image."
  type        = string
  default     = "itss2-backend"
}

variable "ecr_force_delete" {
  description = "Allow Terraform to delete the ECR repo when it still contains images."
  type        = bool
  default     = false
}

variable "atlas_public_key" {
  description = "MongoDB Atlas public API key."
  type        = string
  sensitive   = true

  validation {
    condition     = var.atlas_public_key != "CHANGE_ME" && length(var.atlas_public_key) > 0
    error_message = "Set atlas_public_key in foundation/terraform.tfvars."
  }
}

variable "atlas_private_key" {
  description = "MongoDB Atlas private API key."
  type        = string
  sensitive   = true

  validation {
    condition     = var.atlas_private_key != "CHANGE_ME" && length(var.atlas_private_key) > 0
    error_message = "Set atlas_private_key in foundation/terraform.tfvars."
  }
}

variable "atlas_org_id" {
  description = "MongoDB Atlas organization ID."
  type        = string

  validation {
    condition     = var.atlas_org_id != "CHANGE_ME" && length(var.atlas_org_id) > 0
    error_message = "Set atlas_org_id in foundation/terraform.tfvars."
  }
}

variable "atlas_project_name" {
  description = "MongoDB Atlas project name."
  type        = string
  default     = "itss2"
}

variable "atlas_project_id" {
  description = "Existing MongoDB Atlas project ID. If set, Terraform uses this project instead of creating a new one."
  type        = string
  default     = ""
}

variable "atlas_cluster_name" {
  description = "MongoDB Atlas cluster name."
  type        = string
  default     = "itss2-cluster"
}

variable "atlas_existing_cluster_name" {
  description = "Existing Atlas cluster name to reuse when a new M0 cluster cannot be created."
  type        = string
  default     = ""
}

variable "atlas_existing_srv_address" {
  description = "Existing Atlas cluster SRV address, for example mongodb+srv://cluster.example.mongodb.net."
  type        = string
  default     = ""
}

variable "atlas_database_name" {
  description = "Application database name."
  type        = string
  default     = "ITSS2"
}

variable "atlas_db_username" {
  description = "Application database username."
  type        = string
  default     = "itss2_app"
}

variable "atlas_access_cidr" {
  description = "Temporary Atlas network access CIDR for App Runner demo deployment."
  type        = string
  default     = "0.0.0.0/0"
}

variable "atlas_provider_region_name" {
  description = "Atlas provider region name for the cluster."
  type        = string
  default     = "AP_SOUTHEAST_1"
}

variable "atlas_instance_size_name" {
  description = "Atlas instance size. M0 is free tier when available."
  type        = string
  default     = "M0"
}

variable "atlas_mongo_major_version" {
  description = "MongoDB major version for the Atlas cluster."
  type        = string
  default     = "7.0"
}

variable "mongo_secret_name" {
  description = "AWS Secrets Manager secret name for MONGO_URL."
  type        = string
  default     = "itss2/mongo-url"
}

variable "tags" {
  description = "Tags applied to AWS resources."
  type        = map(string)
  default     = {}
}
