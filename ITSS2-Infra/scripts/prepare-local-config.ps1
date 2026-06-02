param(
  [string]$AwsRegion = "ap-southeast-1",
  [string]$StateBucketName,
  [string]$LockTableName = "itss2-terraform-locks"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")

if (-not $StateBucketName) {
  $userPart = ($env:USERNAME -replace "[^A-Za-z0-9-]", "-").ToLowerInvariant()
  $timestamp = Get-Date -Format "yyyyMMddHHmmss"
  $StateBucketName = "itss2-terraform-state-$userPart-$timestamp".ToLowerInvariant()
}

function Write-IfMissing {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [Parameter(Mandatory = $true)]
    [string]$Content
  )

  if (Test-Path -LiteralPath $Path) {
    Write-Host "Exists: $Path"
    return
  }

  $parent = Split-Path -Parent $Path
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
  Set-Content -LiteralPath $Path -Value $Content -Encoding UTF8
  Write-Host "Created: $Path"
}

$bootstrapTfvars = @"
aws_region        = "$AwsRegion"
state_bucket_name = "$StateBucketName"
lock_table_name   = "$LockTableName"
"@

$backendHclFoundation = @"
bucket         = "$StateBucketName"
key            = "foundation/terraform.tfstate"
region         = "$AwsRegion"
dynamodb_table = "$LockTableName"
encrypt        = true
"@

$backendHclApp = @"
bucket         = "$StateBucketName"
key            = "app/terraform.tfstate"
region         = "$AwsRegion"
dynamodb_table = "$LockTableName"
encrypt        = true
"@

Write-IfMissing -Path (Join-Path $repoRoot "bootstrap\terraform.tfvars") -Content $bootstrapTfvars
Write-IfMissing -Path (Join-Path $repoRoot "foundation\backend.hcl") -Content $backendHclFoundation
Write-IfMissing -Path (Join-Path $repoRoot "app\backend.hcl") -Content $backendHclApp

$foundationTfvars = Join-Path $repoRoot "foundation\terraform.tfvars"
if (-not (Test-Path -LiteralPath $foundationTfvars)) {
  Copy-Item -LiteralPath (Join-Path $repoRoot "foundation\terraform.tfvars.example") -Destination $foundationTfvars
  Write-Host "Created: $foundationTfvars"
}

$appTfvars = Join-Path $repoRoot "app\terraform.tfvars"
if (-not (Test-Path -LiteralPath $appTfvars)) {
  Copy-Item -LiteralPath (Join-Path $repoRoot "app\terraform.tfvars.example") -Destination $appTfvars
  Write-Host "Created: $appTfvars"
}

Write-Host ""
Write-Host "State bucket selected: $StateBucketName"
Write-Host "Next: fill Atlas credentials in foundation\terraform.tfvars, then run bootstrap/foundation/app Terraform steps."
