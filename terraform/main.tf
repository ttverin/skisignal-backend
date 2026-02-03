data "azurerm_client_config" "current" {}

resource "random_string" "suffix" {
  length  = 5
  upper   = false
  special = false
}

# -----------------------
# Locals for DRY tags
# -----------------------
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Owner       = var.owner
  }
}

# -----------------------
# Resource Group
# -----------------------
resource "azurerm_resource_group" "rg" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location
  tags     = local.common_tags
}

# -----------------------
# Storage Account
# -----------------------
resource "azurerm_storage_account" "storage" {
  name                     = "${var.project_name}${random_string.suffix.result}"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                     = local.common_tags
}

# -----------------------
# Application Insights
# -----------------------
resource "azurerm_application_insights" "ai" {
  name                = "${var.project_name}-${var.environment}-ai"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  application_type    = "web"
  tags                = local.common_tags
}

# -----------------------
# App Service Plan (Linux Consumption)
# -----------------------
resource "azurerm_service_plan" "plan" {
  name                = "${var.project_name}-${var.environment}-plan"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"
  sku_name            = "Y1"
  tags                = local.common_tags
}

# -----------------------
# Linux Function App
# -----------------------
resource "azurerm_linux_function_app" "func" {
  name                = "${var.project_name}-${var.environment}-api"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.plan.id

  storage_account_name       = azurerm_storage_account.storage.name
  storage_account_access_key = azurerm_storage_account.storage.primary_access_key

  site_config {
    application_stack {
      node_version = "18"
    }
  }

  app_settings = {
    FUNCTIONS_WORKER_RUNTIME = "node"
    APPLICATIONINSIGHTS_CONNECTION_STRING = azurerm_application_insights.ai.connection_string
  }

  tags = local.common_tags
}

# -----------------------
# Service Principal for CI/CD
# -----------------------
resource "azuread_application" "ci" {
  display_name = "${var.project_name}-${var.environment}-ci"
}

resource "azuread_service_principal" "ci" {
  application_id = azuread_application.ci.application_id
}

resource "azuread_application_password" "ci" {
  application_object_id = azuread_application.ci.object_id
}

# -----------------------
# Role Assignment (Contributor)
# -----------------------
resource "azurerm_role_assignment" "ci_contributor" {
  scope                = azurerm_resource_group.rg.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.ci.object_id
}
