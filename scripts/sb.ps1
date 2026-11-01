param(
  [Parameter(Mandatory = $true, Position = 0)][ValidateSet("secrets-set", "deploy")][string]$Action,
  [Parameter(Position = 1)][string]$Name
)

$ErrorActionPreference = "Stop"
$expectedRef = "tkyvfgdefhvxjwvmxzoe"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Get-Content "supabase\.env.local" | ForEach-Object {
  if ($_ -match '^\s*([A-Z_]+)=(.*)$') { Set-Item "env:$($matches[1])" $matches[2].Trim('"') }
}
if ($env:SUPABASE_PROJECT_REF -ne $expectedRef) { throw "SUPABASE_PROJECT_REF is not the Content project ($expectedRef)" }

if ($Action -eq "secrets-set") {
  $tmp = Join-Path ([IO.Path]::GetTempPath()) "cc-fn-secrets.env"
  Get-Content "supabase\functions\.env" |
    Where-Object { $_ -match '^[A-Z][A-Z0-9_]*=.+$' -and $_ -notmatch '^SUPABASE_' } |
    Set-Content $tmp -Encoding ascii
  Write-Output ("Setting: " + ((Get-Content $tmp | ForEach-Object { $_.Split('=')[0] }) -join ", "))
  try { npx --yes supabase@latest secrets set --env-file $tmp --project-ref $expectedRef }
  finally { Remove-Item $tmp -ErrorAction SilentlyContinue }
}
else {
  if ($Name -notin @("api", "telegram-webhook")) { throw "Function must be api or telegram-webhook" }
  npx --yes supabase@latest functions deploy $Name --project-ref $expectedRef
}
