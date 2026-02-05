output "ci_client_id" {
  description = "Service Principal Client ID for GitHub Actions"
  value       = azuread_application.ci.application_id
}

output "ci_client_secret" {
  description = "Service Principal Client Secret for GitHub Actions"
  value       = azuread_application_password.ci.value
  sensitive   = true
}

output "tenant_id" {
  description = "Azure Tenant ID"
  value       = data.azurerm_client_config.current.tenant_id
}

output "subscription_id" {
  description = "Azure Subscription ID"
  value       = data.azurerm_client_config.current.subscription_id
}

output "static_web_url" {
  value = azurerm_static_web_app.ui.default_host_name
}