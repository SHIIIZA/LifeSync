$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$resourceRoot = Join-Path $projectRoot 'android\app\src\main\res'
$logoPath = Join-Path $projectRoot 'src\assets\lifesync-logo.png'

if (!(Test-Path $resourceRoot)) {
  throw 'Android resources were not found. Run npx cap add android first.'
}
if (!(Test-Path $logoPath)) {
  throw "LifeSync logo was not found at $logoPath."
}

$logo = [System.Drawing.Image]::FromFile($logoPath)
$brandPurple = [System.Drawing.Color]::FromArgb(46, 31, 79)

function Save-BrandedPng(
  [string]$Path,
  [int]$Width,
  [int]$Height,
  [double]$LogoScale,
  [bool]$Transparent
) {
  $bitmap = New-Object System.Drawing.Bitmap(
    $Width,
    $Height,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  if ($Transparent) {
    $graphics.Clear([System.Drawing.Color]::Transparent)
  } else {
    $graphics.Clear($brandPurple)
  }
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $logoSize = [int]([Math]::Min($Width, $Height) * $LogoScale)
  $x = [int](($Width - $logoSize) / 2)
  $y = [int](($Height - $logoSize) / 2)
  $graphics.DrawImage($logo, $x, $y, $logoSize, $logoSize)

  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

foreach ($density in @(
  @{ Name = 'mdpi'; Icon = 48; Adaptive = 108 },
  @{ Name = 'hdpi'; Icon = 72; Adaptive = 162 },
  @{ Name = 'xhdpi'; Icon = 96; Adaptive = 216 },
  @{ Name = 'xxhdpi'; Icon = 144; Adaptive = 324 },
  @{ Name = 'xxxhdpi'; Icon = 192; Adaptive = 432 }
)) {
  $directory = Join-Path $resourceRoot "mipmap-$($density.Name)"
  Save-BrandedPng (Join-Path $directory 'ic_launcher.png') $density.Icon $density.Icon 0.94 $false
  Save-BrandedPng (Join-Path $directory 'ic_launcher_round.png') $density.Icon $density.Icon 0.94 $false
  Save-BrandedPng (Join-Path $directory 'ic_launcher_foreground.png') $density.Adaptive $density.Adaptive 0.66 $true
}

foreach ($splash in Get-ChildItem (Join-Path $resourceRoot 'drawable*\splash.png') -File) {
  $existing = [System.Drawing.Image]::FromFile($splash.FullName)
  $width = $existing.Width
  $height = $existing.Height
  $existing.Dispose()
  Save-BrandedPng $splash.FullName $width $height 0.44 $false
}

$backgroundPath = Join-Path $resourceRoot 'values\ic_launcher_background.xml'
Set-Content -Path $backgroundPath -Encoding UTF8 -Value @'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#2E1F4F</color>
</resources>
'@

$logo.Dispose()
Write-Output 'Generated LifeSync Android launcher icons and splash images.'
