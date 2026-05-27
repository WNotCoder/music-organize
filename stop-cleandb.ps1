# 停止服务并清理数据库
Write-Host "Stopping Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 1
Write-Host "Deleting music-organize.db..." -ForegroundColor Yellow
if (Test-Path "backend\data\music-organize.db") {
    Remove-Item "backend\data\music-organize.db" -Force
    Write-Host "Deleted" -ForegroundColor Green
} else {
    Write-Host "Not found" -ForegroundColor Gray
}
Write-Host "Deleting organized folder..." -ForegroundColor Yellow
$organizedPath = "backend\media\organized"
if (Test-Path $organizedPath) {
    Remove-Item $organizedPath -Recurse -Force
    Write-Host "Deleted" -ForegroundColor Green
} else {
    Write-Host "Not found" -ForegroundColor Gray
}
Write-Host "Done!" -ForegroundColor Green
