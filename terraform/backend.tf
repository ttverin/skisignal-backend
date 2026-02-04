terraform {
  backend "azurerm" {
    resource_group_name  = "tfstate-rg"
    storage_account_name = "skisignaltfstate"
    container_name       = "tfstate"
    key                  = "skisignal-dev.tfstate"
  }
}