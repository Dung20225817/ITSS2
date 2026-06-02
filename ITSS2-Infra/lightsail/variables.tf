variable "aws_region" {
  description = "AWS region for Lightsail."
  type        = string
  default     = "ap-southeast-1"
}

variable "service_name" {
  description = "Lightsail container service name."
  type        = string
  default     = "itss2-backend"
}

variable "image" {
  description = "Backend container image URL and tag."
  type        = string
}

variable "mongo_secret_arn" {
  description = "Secrets Manager ARN containing MONGO_URL."
  type        = string
}

variable "container_port" {
  description = "Backend container port."
  type        = number
  default     = 8080
}

variable "cors_origins" {
  description = "Comma-separated allowed CORS origins for the backend."
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
