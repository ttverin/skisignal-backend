provider "azurerm" {
  features {}
  # subscription_id / tenant_id are sourced from ARM_SUBSCRIPTION_ID / ARM_TENANT_ID
  # environment variables (already set in CI and recommended for local use) instead
  # of being hardcoded here.
}

provider "azuread" {}
