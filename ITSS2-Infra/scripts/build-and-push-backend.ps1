param(
  [Parameter(Mandatory = $true)]
  [string]$BackendDir,

  [Parameter(Mandatory = $true)]
  [string]$EcrRepositoryUrl,

  [string]$AwsRegion = "ap-southeast-1",

  [string]$ImageTag
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker is required before running this script."
}

$awsCommand = Get-Command aws -ErrorAction SilentlyContinue
$awsExecutable = $null
$awsPrefix = @()

if ($awsCommand) {
  $awsExecutable = $awsCommand.Source
} else {
  $localPython = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\.venv\Scripts\python.exe") -ErrorAction SilentlyContinue
  if ($localPython) {
    $awsExecutable = $localPython.Path
    $awsPrefix = @("-m", "awscli")
  }
}

if (-not $awsExecutable) {
  throw "AWS CLI is required. Run 'uv venv .venv' and 'uv pip install awscli' from ITSS2-Infra, or install AWS CLI globally."
}

function Invoke-Aws {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )

  & $awsExecutable @awsPrefix @Arguments
}

$resolvedBackendDir = Resolve-Path -LiteralPath $BackendDir

if (-not $ImageTag) {
  $ImageTag = git -C $resolvedBackendDir rev-parse --short HEAD
}

$localImage = "itss2-backend:$ImageTag"
$remoteImage = "${EcrRepositoryUrl}:$ImageTag"
$registry = $EcrRepositoryUrl.Split("/")[0]

if (docker buildx version 2>$null) {
  docker buildx build `
    --platform linux/amd64 `
    --provenance=false `
    --load `
    -t $localImage `
    -f (Join-Path $resolvedBackendDir "Dockerfile") `
    $resolvedBackendDir
} else {
  $previousBuildKit = $env:DOCKER_BUILDKIT
  try {
    $env:DOCKER_BUILDKIT = "0"
    docker build -t $localImage -f (Join-Path $resolvedBackendDir "Dockerfile") $resolvedBackendDir
  } finally {
    $env:DOCKER_BUILDKIT = $previousBuildKit
  }
}
Invoke-Aws ecr get-login-password --region $AwsRegion | docker login --username AWS --password-stdin $registry
docker tag $localImage $remoteImage
docker push $remoteImage

Write-Host "Pushed $remoteImage"
Write-Host "Use backend_image_tag = `"$ImageTag`" in ITSS2-Infra/app/terraform.tfvars"
