variable "aws_region" {
  description = "AWS region for App Runner."
  type        = string
  default     = "ap-southeast-1"
}

variable "service_name" {
  description = "App Runner service name."
  type        = string
  default     = "itss2-backend"
}

variable "ecr_repository_url" {
  description = "ECR repository URL from the foundation stack."
  type        = string

  validation {
    condition     = !startswith(var.ecr_repository_url, "CHANGE_ME") && length(var.ecr_repository_url) > 0
    error_message = "Set ecr_repository_url in app/terraform.tfvars."
  }
}

variable "backend_image_tag" {
  description = "Backend container image tag to deploy."
  type        = string

  validation {
    condition     = !startswith(var.backend_image_tag, "CHANGE_ME") && length(var.backend_image_tag) > 0
    error_message = "Set backend_image_tag in app/terraform.tfvars."
  }
}

variable "mongo_secret_arn" {
  description = "Secrets Manager ARN containing MONGO_URL."
  type        = string

  validation {
    condition     = !startswith(var.mongo_secret_arn, "CHANGE_ME") && length(var.mongo_secret_arn) > 0
    error_message = "Set mongo_secret_arn in app/terraform.tfvars after foundation apply."
  }
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

variable "apprunner_cpu" {
  description = "App Runner CPU size."
  type        = string
  default     = "0.25 vCPU"
}

variable "apprunner_memory" {
  description = "App Runner memory size."
  type        = string
  default     = "0.5 GB"
}

variable "vercel_api_token" {
  description = "Vercel API token. If null, the provider can use VERCEL_API_TOKEN."
  type        = string
  sensitive   = true
  default     = null
}

variable "vercel_team_id" {
  description = "Optional Vercel team ID."
  type        = string
  default     = null
}

variable "vercel_project_name" {
  description = "Vercel project name."
  type        = string
  default     = "itss2-frontend"
}

variable "frontend_github_repo" {
  description = "GitHub repository in owner/name form for the frontend."
  type        = string
  default     = "nqk-khanhbk/ITSS2-Frontend"
}

variable "frontend_root_directory" {
  description = "Frontend root directory inside the GitHub repo. Null means repository root."
  type        = string
  default     = null
}

variable "frontend_framework" {
  description = "Vercel framework preset."
  type        = string
  default     = "vite"
}

variable "frontend_install_command" {
  description = "Frontend install command."
  type        = string
  default     = "npm ci"
}

variable "frontend_build_command" {
  description = "Frontend build command."
  type        = string
  default     = "npm run build"
}

variable "frontend_output_directory" {
  description = "Frontend output directory."
  type        = string
  default     = "dist"
}

variable "default_user_id" {
  description = "Default user ID used by the demo frontend."
  type        = string
  default     = "682b71380c69774bd1f056bd"
}

variable "vercel_env_targets" {
  description = "Vercel environments that receive frontend env vars."
  type        = list(string)
  default     = ["production", "preview", "development"]
}

variable "tags" {
  description = "Tags applied to AWS resources."
  type        = map(string)
  default     = {}
}
