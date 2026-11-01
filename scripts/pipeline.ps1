# Runs the content pipeline on this PC (ADR-0010): job runner (in place of n8n), creative worker,
# render worker and preview server, each in the background with its own log.
#
#   powershell -NoProfile -File scripts/pipeline.ps1            # start (restarts what is already running)
#   powershell -NoProfile -File scripts/pipeline.ps1 -Status    # what runs + last log lines
#   powershell -NoProfile -File scripts/pipeline.ps1 -Stop
#
# Settings come from workers/.env (git-ignored). Logs: tmp/pipeline/<name>.log
param([switch]$Stop, [switch]$Status)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$dir = Join-Path $root "tmp\pipeline"
New-Item -ItemType Directory -Force $dir | Out-Null
$pidFile = Join-Path $dir "pids.json"
$names = @("job-runner", "creative-worker", "render-worker", "preview-server")

function Running {
  if (-not (Test-Path $pidFile)) { return @{} }
  $saved = Get-Content $pidFile -Raw | ConvertFrom-Json
  $out = @{}
  foreach ($p in $saved.PSObject.Properties) {
    $proc = Get-Process -Id $p.Value -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -eq "node") { $out[$p.Name] = $proc }
  }
  return $out
}

function StopAll {
  $r = Running
  foreach ($n in $r.Keys) { Stop-Process -Id $r[$n].Id -Force -Confirm:$false; Write-Output "stopped $n" }
  if (Test-Path $pidFile) { Remove-Item $pidFile -Confirm:$false }
}

if ($Status) {
  $r = Running
  foreach ($n in $names) {
    $state = if ($r.ContainsKey($n)) { "running (pid $($r[$n].Id))" } else { "stopped" }
    Write-Output ("{0,-16} {1}" -f $n, $state)
    $log = Join-Path $dir "$n.log"
    if (Test-Path $log) { Get-Content $log -Tail 3 | ForEach-Object { "    $_" } }
  }
  return
}
if ($Stop) { StopAll; return }

StopAll
Get-Content "workers\.env" | ForEach-Object {
  if ($_ -match '^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.+?)\s*$') { Set-Item "env:$($matches[1])" $matches[2].Trim('"') }
}
foreach ($k in @("DATABASE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "N8N_WEBHOOK_SECRET", "PREVIEW_SIGNING_SECRET", "BRAND_ASSETS_DIR", "NODE_PATH")) {
  if (-not (Get-Item "env:$k" -ErrorAction SilentlyContinue)) { throw "workers/.env: $k is not set" }
}
# Notifications go to n8n only when it exists; jobs are picked up by the job runner instead.
Remove-Item env:N8N_BASE_URL -ErrorAction SilentlyContinue

$pids = @{}
foreach ($n in $names) {
  $log = Join-Path $dir "$n.log"
  $p = Start-Process node -ArgumentList "--experimental-strip-types", "workers/$n/src/main.ts" `
    -WorkingDirectory $root -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput $log -RedirectStandardError (Join-Path $dir "$n.err.log")
  $pids[$n] = $p.Id
  Write-Output ("started {0,-16} pid {1}  log tmp/pipeline/{0}.log" -f $n, $p.Id)
}
$pids | ConvertTo-Json | Set-Content $pidFile -Encoding utf8
