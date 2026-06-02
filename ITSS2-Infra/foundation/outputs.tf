output "ecr_repository_name" {
  value = aws_ecr_repository.backend.name
}

output "ecr_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "mongo_secret_arn" {
  value = aws_secretsmanager_secret.mongo_url.arn
}

output "atlas_project_id" {
  value = local.atlas_project_id
}

output "atlas_cluster_name" {
  value = var.atlas_existing_cluster_name != "" ? var.atlas_existing_cluster_name : try(mongodbatlas_cluster.this[0].name, "")
}
