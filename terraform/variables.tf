variable "project_name" {
  description = "Project prefix"
  type        = string
  default     = "skisignal"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "westeurope"
}

variable "environment" {
  description = "Deployment environment (Dev, Staging, Prod)"
  type        = string
  default     = "Dev"
}

variable "owner" {
  description = "Project owner"
  type        = string
  default     = "you@example.com"
}
