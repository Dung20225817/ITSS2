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
