# Installs dependencies and puts an "Onyx" shortcut (with the Onyx icon) on your Desktop.
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $dir
npm install
$electron = Join-Path $dir "node_modules\electron\dist\electron.exe"
$desktop = [Environment]::GetFolderPath("Desktop")
# Remove the shortcut from before the app was renamed.
Remove-Item (Join-Path $desktop "AI Hub.lnk") -ErrorAction SilentlyContinue
$lnk = Join-Path $desktop "Onyx.lnk"
$s = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
$s.TargetPath = $electron
$s.Arguments = "`"$dir`""
$s.WorkingDirectory = $dir
$s.IconLocation = (Join-Path $dir "icon.ico")
$s.Description = "Onyx"
$s.Save()
Write-Host "Shortcut created: $lnk"
