variable "aws_region" {
  description = "AWS region for Terraform state resources."
  type        = string
  default     = "ap-southeast-1"
}

variable "state_bucket_name" {
  description = "Globally unique S3 bucket name for Terraform state."
  type        = string
}

variable "lock_table_name" {
  description = "DynamoDB table name for Terraform state locking."
  type        = string
  default     = "itss2-terraform-locks"
}

variable "bucket_force_destroy" {
  description = "Allow Terraform to delete the state bucket even when it contains objects."
  type        = bool
  default     = false
}

variable "lock_table_deletion_protection" {
  description = "Protect the DynamoDB lock table from accidental deletion."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags applied to AWS resources."
  type        = map(string)
  default     = {}
}
