variable "aws_region" {
  description = "AWS region."
  type        = string
  default     = "ap-southeast-1"
}

variable "service_name" {
  description = "Lightsail container service name."
  type        = string
  default     = "itss2-backend"
}

variable "image_tag" {
  description = "Backend Docker image tag. Set to empty string to skip deployment (phase 1 only)."
  type        = string
  default     = ""
}

variable "ecr_repository_name" {
  description = "ECR repository name."
  type        = string
  default     = "itss2-backend"
}

variable "ecr_force_delete" {
  description = "Allow Terraform to delete the ECR repo when it still contains images."
  type        = bool
  default     = false
}

variable "db_name" {
  description = "Lightsail relational database resource name."
  type        = string
  default     = "itss2-postgres"
}

variable "db_database" {
  description = "PostgreSQL database name."
  type        = string
  default     = "itss2"
}

variable "db_username" {
  description = "PostgreSQL master username."
  type        = string
  default     = "itss2_admin"
}

variable "container_port" {
  description = "Backend container port."
  type        = number
  default     = 8080
}

variable "cors_origins" {
  description = "Comma-separated allowed CORS origins."
  type        = string
  default     = "*"
}

variable "jwt_access_secret" {
  description = "JWT access token signing secret."
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_refresh_secret" {
  description = "JWT refresh token signing secret."
  type        = string
  sensitive   = true
  default     = ""
}

variable "cookie_secure" {
  description = "Set COOKIE_SECURE=true for production HTTPS deployment."
  type        = string
  default     = "true"
}

variable "power" {
  description = "Lightsail container service power."
  type        = string
  default     = "nano"
}

variable "scale" {
  description = "Number of container nodes."
  type        = number
  default     = 1
}

variable "tags" {
  description = "Tags applied to AWS resources."
  type        = map(string)
  default     = {}
}

variable "tf_state_bucket" {
  description = "S3 bucket name holding Terraform state (used in IAM policy for CI role)."
  type        = string
  default     = "itss2-tfstate-20260610"
}

variable "tf_lock_table" {
  description = "DynamoDB table name used for Terraform state locking."
  type        = string
  default     = "itss2-terraform-locks"
}
