output "backend_url" {
  value = aws_lightsail_container_service.backend.url
}

output "container_service_name" {
  value = aws_lightsail_container_service.backend.name
}

output "deployment_version" {
  value = length(aws_lightsail_container_service_deployment_version.backend) > 0 ? aws_lightsail_container_service_deployment_version.backend[0].version : null
}

output "ecr_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "database_endpoint_address" {
  value = aws_lightsail_database.postgres.master_endpoint_address
}

output "database_endpoint_port" {
  value = aws_lightsail_database.postgres.master_endpoint_port
}

output "database_url" {
  value     = local.database_url
  sensitive = true
}
