param(
  [string]$CompositePath = "D:\PZ LA MATANZA SITE\Grupo 2_upscayl_5x_digital-art-4x.png",
  [string]$OutDir = "public",
  [int]$TargetWidth = 2560,
  [int]$JpegQuality = 85
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$comp = [System.Drawing.Bitmap]::FromFile($CompositePath)
$W = $comp.Width; $H = $comp.Height
Write-Host "Composite: ${W}x${H}"

# --- deteccion del seam (banda negra entre las dos escenas) ---
$bestStart = -1; $bestLen = 0; $curStart = -1; $curLen = 0
$y0 = [int]($H * 0.30); $y1 = [int]($H * 0.70)
for ($y = $y0; $y -lt $y1; $y += 3) {
  $sum = 0.0; $n = 0
  for ($x = 0; $x -lt $W; $x += 40) {
    $p = $comp.GetPixel($x, $y)
    $sum = $sum + ($p.R + $p.G + $p.B)
    $n++
  }
  $avg = $sum / (3.0 * $n)
  if ($avg -lt 14) {
    if ($curStart -lt 0) { $curStart = $y; $curLen = 1 } else { $curLen++ }
    if ($curLen -gt $bestLen) { $bestLen = $curLen; $bestStart = $curStart }
  } else {
    $curStart = -1; $curLen = 0
  }
}
$split = 0
if ($bestLen -ge 2) {
  $split = $bestStart + [int]($bestLen / 2)
  Write-Host "SEAM: start=$bestStart len=$bestLen split=$split"
} else {
  $split = [int]($H * 0.427)
  Write-Host "SEAM no encontrado, fallback split=$split"
}

# --- recorte + downscale + jpeg ---
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$JpegQuality)

function Save-Section($srcBmp, $yFrom, $h, $outName) {
  $h2 = [Math]::Min($h, $srcBmp.Height - $yFrom)
  $cropRect = New-Object System.Drawing.Rectangle(0, $yFrom, $W, $h2)
  $crop = $srcBmp.Clone($cropRect, $srcBmp.PixelFormat)

  $scale = [Math]::Min(1.0, $TargetWidth / $W)
  $nw = [int]($W * $scale); $nh = [int]($h2 * $scale)
  $scaled = New-Object System.Drawing.Bitmap($nw, $nh)
  $g = [System.Drawing.Graphics]::FromImage($scaled)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($crop, 0, 0, $nw, $nh)
  $g.Dispose()
  $crop.Dispose()

  $out = Join-Path $OutDir $outName
  $scaled.Save($out, $jpegCodec, $encParams)
  $scaled.Dispose()
  $kb = [int]((Get-Item $out).Length / 1KB)
  Write-Host ("SAVED {0}  {1}x{2}  {3} KB" -f $outName, $nw, $nh, $kb)
}

Save-Section $comp 0 $split "art-horde.jpg"
Save-Section $comp ($split + 1) ($H - $split - 1) "art-sunset.jpg"

$comp.Dispose()
Write-Host "DONE"
