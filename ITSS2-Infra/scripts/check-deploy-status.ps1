param(
  [string]$AwsRegion = "ap-southeast-1",
  [string]$BackendUrl,
  [string]$FrontendUrl
)

$ErrorActionPreference = "Continue"
$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")

function Section {
  param([string]$Title)
  Write-Host ""
  Write-Host "== $Title =="
}

function Resolve-AwsCommand {
  $awsCommand = Get-Command aws -ErrorAction SilentlyContinue
  if ($awsCommand) {
    return @{ Executable = $awsCommand.Source; Prefix = @() }
  }

  $localPython = Resolve-Path -LiteralPath (Join-Path $repoRoot ".venv\Scripts\python.exe") -ErrorAction SilentlyContinue
  if ($localPython) {
    return @{ Executable = $localPython.Path; Prefix = @("-m", "awscli") }
  }

  return $null
}

function Invoke-AwsLocal {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )

  if (-not $script:Aws) {
    return $null
  }

  & $script:Aws.Executable @($script:Aws.Prefix) @Arguments
}

$script:Aws = Resolve-AwsCommand

Section "Local files"
foreach ($path in @(
    "bootstrap\terraform.tfvars",
    "foundation\backend.hcl",
    "foundation\terraform.tfvars",
    "app\backend.hcl",
    "app\terraform.tfvars",
    "lightsail\backend.hcl",
    "lightsail\terraform.tfvars"
  )) {
  $full = Join-Path $repoRoot $path
  if (Test-Path -LiteralPath $full) {
    Write-Host "[OK] $path"
  } else {
    Write-Host "[MISSING] $path"
  }
}

Section "AWS CLI"
if ($script:Aws) {
  Invoke-AwsLocal --version
  Invoke-AwsLocal sts get-caller-identity --region $AwsRegion
} else {
  Write-Host "[MISSING] AWS CLI. Install globally or run: uv venv .venv; uv pip install awscli"
}

Section "Terraform state"
foreach ($stack in @("bootstrap", "foundation", "app", "lightsail")) {
  Push-Location (Join-Path $repoRoot $stack)
  try {
    terraform workspace show 2>$null
    terraform state list 2>$null
  } finally {
    Pop-Location
  }
}

Section "Vercel"
vercel whoami
vercel ls

Section "HTTP smoke"
if ($BackendUrl) {
  try {
    $health = Invoke-WebRequest -Uri "$BackendUrl/healthz" -UseBasicParsing -TimeoutSec 20
    Write-Host "Backend /healthz: HTTP $($health.StatusCode)"
  } catch {
    Write-Host "Backend /healthz failed: $($_.Exception.Message)"
  }
} else {
  Write-Host "Skip backend smoke: pass -BackendUrl https://..."
}

if ($FrontendUrl) {
  try {
    $front = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 20
    Write-Host "Frontend: HTTP $($front.StatusCode)"
  } catch {
    Write-Host "Frontend failed: $($_.Exception.Message)"
  }
} else {
  Write-Host "Skip frontend smoke: pass -FrontendUrl https://..."
}
