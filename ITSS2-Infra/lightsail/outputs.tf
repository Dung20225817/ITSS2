output "backend_url" {
  value = aws_lightsail_container_service.backend.url
}

output "container_service_name" {
  value = aws_lightsail_container_service.backend.name
}

output "deployment_version" {
  value = aws_lightsail_container_service_deployment_version.backend.version
}
