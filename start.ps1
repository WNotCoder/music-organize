# 启动服务
$projectDir = Get-Location
Write-Host "Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $projectDir\backend; npm run dev" -WindowStyle Normal
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $projectDir\frontend; npm run start" -WindowStyle Normal
Write-Host "`nServices started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Subsonic API: http://localhost:4040" -ForegroundColor Cyan
Write-Host "`nOpening frontend in browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5173"
