# 一站式重置脚本：停止 → 清理 → 启动
.\stop-cleandb.ps1
Start-Sleep -Seconds 1
.\start.ps1
