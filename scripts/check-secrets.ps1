param(
  [switch]$StagedOnly
)

$ErrorActionPreference = "Stop"

function Get-TrackedFiles {
  if ($StagedOnly) {
    $files = git diff --cached --name-only --diff-filter=ACMR
  } else {
    $files = git ls-files
  }

  return $files | Where-Object { $_ -and (Test-Path $_) }
}

$blockedPathPatterns = @(
  '(^|/)\.env$',
  '(^|/)\.env\.local$',
  '(^|/)\.env\..+\.local$',
  'firebase-adminsdk',
  'service-account',
  'serviceAccount',
  '\.pem$',
  '\.p12$'
)

$blockedContentPatterns = @(
  '-----BEGIN PRIVATE KEY-----',
  '"private_key"\s*:\s*"-----BEGIN PRIVATE KEY-----',
  'FIREBASE_PRIVATE_KEY\s*=\s*-----BEGIN PRIVATE KEY-----',
  '(^|[\r\n])\s*BLYNK_AUTH_TOKEN\s*=\s*[^\s\r\n]',
  'TIGERGRAPH_API_KEY\s*=\s*[^\s\r\n]',
  'MAPBOX_SECRET_TOKEN\s*=\s*[^\s\r\n]',
  'SESSION_COOKIE_SECRET\s*=\s*[^\s\r\n]'
)

$allowedFilesForContentCheck = @(
  '.env.example',
  'README.md',
  'docs/blynk-setup.md',
  'scripts/check-secrets.ps1',
  '.githooks/pre-commit',
  'docs/device-connection.md'
)

$violations = New-Object System.Collections.Generic.List[string]
$files = Get-TrackedFiles

foreach ($file in $files) {
  $normalized = ($file -replace '\\','/')

  foreach ($pattern in $blockedPathPatterns) {
    if ($normalized -match $pattern) {
      $violations.Add("Blocked file path staged or tracked: $file")
      break
    }
  }

  if ($allowedFilesForContentCheck -contains $file) {
    continue
  }

  try {
    $content = Get-Content -Raw -LiteralPath $file
  } catch {
    continue
  }

  foreach ($pattern in $blockedContentPatterns) {
    if ($content -match $pattern) {
      $violations.Add("Sensitive content pattern detected in: $file")
      break
    }
  }
}

if ($violations.Count -gt 0) {
  Write-Host ""
  Write-Host "Secret check failed. Remove sensitive files or values before committing." -ForegroundColor Red
  Write-Host ""
  $violations | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
  Write-Host ""
  Write-Host "Allowed examples:" -ForegroundColor Cyan
  Write-Host " - .env.example with blank placeholder values" -ForegroundColor Cyan
  Write-Host " - public Firebase web config values in committed code or env example" -ForegroundColor Cyan
  exit 1
}

Write-Host "Secret check passed." -ForegroundColor Green
