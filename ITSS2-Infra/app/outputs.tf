output "apprunner_service_arn" {
  value = aws_apprunner_service.backend.arn
}

output "backend_url" {
  value = local.api_base_url
}

output "vercel_project_id" {
  value = vercel_project.frontend.id
}

output "vercel_project_name" {
  value = vercel_project.frontend.name
}
