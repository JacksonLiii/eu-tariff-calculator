<#
.SYNOPSIS
  Builds the Chrome Web Store upload ZIP.

.DESCRIPTION
  Packages ONLY the files the extension needs at runtime, using an explicit
  whitelist. Everything else in the repo — SPEC.md (contains business strategy),
  store-listing.md, test/scratch scripts (expose internal endpoints and the
  Creem product id), screenshots, node_modules — is excluded by construction
  rather than by trying to enumerate what to leave out.

.PARAMETER Strict
  Turn pre-flight warnings into hard failures. Use this for the build you
  actually upload to the Chrome Web Store.

.EXAMPLE
  pwsh -File build.ps1
  pwsh -File build.ps1 -Strict
#>
[CmdletBinding()]
param(
  [switch]$Strict
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = $PSScriptRoot
$distDir = Join-Path $root 'dist'

# --- The whitelist. Anything not listed here does not ship. -------------------
$include = @(
  'manifest.json'
  'popup.html'
  'popup.js'
  'calculator.js'
  'icons/icon16.png'
  'icons/icon48.png'
  'icons/icon128.png'
  '_locales/en/messages.json'
  '_locales/zh_CN/messages.json'
)

$warnings = @()

Write-Host ''
Write-Host '=== Verifying whitelist ===' -ForegroundColor Cyan

$missing = @()
foreach ($rel in $include) {
  $full = Join-Path $root $rel
  if (Test-Path -LiteralPath $full -PathType Leaf) {
    $kb = [Math]::Round((Get-Item -LiteralPath $full).Length / 1KB, 1)
    Write-Host ("  OK      {0,-34} {1,7} KB" -f $rel, $kb)
  } else {
    Write-Host ("  MISSING {0}" -f $rel) -ForegroundColor Red
    $missing += $rel
  }
}
if ($missing.Count -gt 0) {
  throw "$($missing.Count) whitelisted file(s) missing; refusing to build."
}

# --- Validate the manifest ----------------------------------------------------
Write-Host ''
Write-Host '=== Validating manifest.json ===' -ForegroundColor Cyan

$manifestPath = Join-Path $root 'manifest.json'
try {
  $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
  throw "manifest.json is not valid JSON: $($_.Exception.Message)"
}

foreach ($field in @('manifest_version', 'name', 'version')) {
  if (-not $manifest.PSObject.Properties.Name.Contains($field)) {
    throw "manifest.json is missing required field '$field'."
  }
}
if ($manifest.manifest_version -ne 3) {
  $warnings += "manifest_version is $($manifest.manifest_version); the Chrome Web Store expects 3."
}

$version = $manifest.version
Write-Host "  manifest_version : $($manifest.manifest_version)"
Write-Host "  version          : $version"
Write-Host "  default_locale   : $($manifest.default_locale)"
Write-Host "  permissions      : $($manifest.permissions -join ', ')"

# Every _locales dir must carry the default_locale, or Chrome rejects the package.
if ($manifest.default_locale) {
  $defaultLocaleFile = Join-Path $root "_locales/$($manifest.default_locale)/messages.json"
  if (-not (Test-Path -LiteralPath $defaultLocaleFile)) {
    throw "default_locale is '$($manifest.default_locale)' but $defaultLocaleFile is not in the package."
  }
}

# --- Validate the locale files and check they agree ---------------------------
Write-Host ''
Write-Host '=== Validating _locales ===' -ForegroundColor Cyan

$localeKeys = @{}
foreach ($rel in ($include | Where-Object { $_ -like '_locales/*' })) {
  try {
    $json = Get-Content -LiteralPath (Join-Path $root $rel) -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch {
    throw "$rel is not valid JSON: $($_.Exception.Message)"
  }
  $keys = @($json.PSObject.Properties.Name)
  $localeKeys[$rel] = $keys
  Write-Host ("  OK      {0,-34} {1} keys" -f $rel, $keys.Count)
}

$localeNames = @($localeKeys.Keys)
if ($localeNames.Count -gt 1) {
  $reference = $localeNames[0]
  foreach ($other in $localeNames[1..($localeNames.Count - 1)]) {
    $onlyRef = @($localeKeys[$reference] | Where-Object { $localeKeys[$other] -notcontains $_ })
    $onlyOther = @($localeKeys[$other] | Where-Object { $localeKeys[$reference] -notcontains $_ })
    if ($onlyRef.Count -or $onlyOther.Count) {
      $warnings += "Locale key mismatch: only in ${reference}: [$($onlyRef -join ', ')]; only in ${other}: [$($onlyOther -join ', ')]"
    }
  }
}

# --- Pre-flight content checks on the files being shipped ---------------------
Write-Host ''
Write-Host '=== Pre-flight checks ===' -ForegroundColor Cyan

$textFiles = $include | Where-Object { $_ -notlike '*.png' }

# 1. Creem test-mode checkout URL must not ship to real users.
$testModeHits = @()
foreach ($rel in $textFiles) {
  $content = Get-Content -LiteralPath (Join-Path $root $rel) -Raw -Encoding UTF8
  if ($content -match 'creem\.io/test/') {
    $lineNo = (Select-String -LiteralPath (Join-Path $root $rel) -Pattern 'creem\.io/test/' | Select-Object -First 1).LineNumber
    $testModeHits += "${rel}:${lineNo}"
  }
}
if ($testModeHits.Count -gt 0) {
  $warnings += "Creem TEST-mode checkout URL present in: $($testModeHits -join ', '). Real users cannot pay. Switch to the live checkout URL before submitting."
} else {
  Write-Host '  OK      no Creem test-mode checkout URL'
}

# 2. Nothing that looks like a License Key should be hardcoded.
$keyPattern = '\b[A-Z0-9]{5}(-[A-Z0-9]{5}){3,4}\b'
$keyHits = @()
foreach ($rel in $textFiles) {
  $m = Select-String -LiteralPath (Join-Path $root $rel) -Pattern $keyPattern
  if ($m) { $keyHits += "${rel}:$($m[0].LineNumber)" }
}
if ($keyHits.Count -gt 0) {
  $warnings += "Possible hardcoded License Key in: $($keyHits -join ', ')"
} else {
  Write-Host '  OK      no hardcoded License Key pattern'
}

# 3. UI strings must come from _locales, not be hardcoded in one language.
$cjkHits = @()
foreach ($rel in ($textFiles | Where-Object { $_ -notlike '_locales/*' })) {
  $content = Get-Content -LiteralPath (Join-Path $root $rel) -Raw -Encoding UTF8
  if ($content -match '[一-鿿]') {
    $lineNo = (Select-String -LiteralPath (Join-Path $root $rel) -Pattern '[一-鿿]' | Select-Object -First 1).LineNumber
    $cjkHits += "${rel}:${lineNo}"
  }
}
if ($cjkHits.Count -gt 0) {
  $warnings += "Hardcoded CJK text outside _locales in: $($cjkHits -join ', '). Localized UI strings belong in _locales/."
} else {
  Write-Host '  OK      no hardcoded CJK outside _locales'
}

# --- Build the ZIP ------------------------------------------------------------
Write-Host ''
Write-Host '=== Building ZIP ===' -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $distDir)) {
  New-Item -ItemType Directory -Path $distDir | Out-Null
}

$zipName = "eu-tariff-calculator-v$version.zip"
$zipPath = Join-Path $distDir $zipName
if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

# Written entry-by-entry with explicit forward-slash names. Compress-Archive is
# avoided because it has historically emitted backslash separators on Windows,
# which some ZIP consumers (including extension tooling) mis-read as filenames.
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($rel in $include) {
    $entryName = $rel -replace '\\', '/'
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip,
      (Join-Path $root $rel),
      $entryName,
      [System.IO.Compression.CompressionLevel]::Optimal
    )
  }
} finally {
  $zip.Dispose()
}

# --- Verify the ZIP contains exactly the whitelist ----------------------------
Write-Host ''
Write-Host '=== Verifying ZIP contents ===' -ForegroundColor Cyan

$zipRead = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
  $entries = @($zipRead.Entries | ForEach-Object { $_.FullName })
} finally {
  $zipRead.Dispose()
}

$unexpected = @($entries | Where-Object { $include -notcontains $_ })
$absent = @($include | Where-Object { $entries -notcontains $_ })
if ($unexpected.Count -or $absent.Count) {
  throw "ZIP contents do not match the whitelist. Unexpected: [$($unexpected -join ', ')]; absent: [$($absent -join ', ')]"
}
foreach ($e in $entries) { Write-Host "  $e" }

$backslashEntries = @($entries | Where-Object { $_ -match '\\' })
if ($backslashEntries.Count -gt 0) {
  throw "ZIP entries contain backslash separators: $($backslashEntries -join ', ')"
}

$zipKb = [Math]::Round((Get-Item -LiteralPath $zipPath).Length / 1KB, 1)
Write-Host ''
Write-Host "  $($entries.Count) files, $zipKb KB total" -ForegroundColor Green
Write-Host "  -> $zipPath" -ForegroundColor Green

# --- Report warnings last so they are the last thing on screen ----------------
if ($warnings.Count -gt 0) {
  Write-Host ''
  Write-Host ('=' * 72) -ForegroundColor Yellow
  Write-Host "$($warnings.Count) WARNING(S)" -ForegroundColor Yellow
  foreach ($w in $warnings) { Write-Host "  ! $w" -ForegroundColor Yellow }
  Write-Host ('=' * 72) -ForegroundColor Yellow
  if ($Strict) {
    Write-Host ''
    throw "-Strict was specified and there are $($warnings.Count) warning(s); refusing to declare this package submission-ready."
  }
  Write-Host ''
  Write-Host 'The ZIP was still written. Re-run with -Strict for the submission build.' -ForegroundColor Yellow
} else {
  Write-Host ''
  Write-Host 'No warnings. Package looks submission-ready.' -ForegroundColor Green
}

Write-Host ''
