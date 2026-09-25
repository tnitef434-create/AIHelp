# Installs dependencies and puts an "AI Hub" shortcut on your Desktop.
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $dir
npm install
$electron = Join-Path $dir "node_modules\electron\dist\electron.exe"
$lnk = Join-Path ([Environment]::GetFolderPath("Desktop")) "AI Hub.lnk"
$s = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
$s.TargetPath = $electron
$s.Arguments = "`"$dir`""
$s.WorkingDirectory = $dir
$s.Save()
Write-Host "Shortcut created: $lnk"
