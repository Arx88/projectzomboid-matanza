param(
  [string]$CompositePath = "C:\Users\juanp\AppData\Local\Temp\freebuff-desktop-pastes\paste-1790351814087-20888.png",
  [string]$LogoAPath = "C:\Users\juanp\Downloads\Imagen de ChatGPT 25 sept 2026, 17_55_01.png",
  [string]$LogoBPath = "Grupo 2.png",
  [string]$OutDir = "public"
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Log($m) { Write-Host $m }

function Get-Info($path) {
  if (-not (Test-Path -LiteralPath $path)) { Log "MISSING $path"; return $null }
  $b = [System.Drawing.Bitmap]::FromFile($path)
  $c = $b.GetPixel(2, 2)
  Log ("INFO {0} => {1}x{2} fmt={3} corner=({4},{5},{6},{7})" -f (Split-Path -Leaf $path), $b.Width, $b.Height, $b.PixelFormat, $c.R, $c.G, $c.B, $c.A)
  return $b
}

function Save-Crop($bmp, $x, $y, $w, $h, $outPath) {
  $cx = [Math]::Max(0, [int]$x)
  $cy = [Math]::Max(0, [int]$y)
  $cw = [Math]::Min([int]$w, $bmp.Width - $cx)
  $ch = [Math]::Min([int]$h, $bmp.Height - $cy)
  $rect = New-Object System.Drawing.Rectangle($cx, $cy, $cw, $ch)
  $crop = $bmp.Clone($rect, $bmp.PixelFormat)
  $crop.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $crop.Dispose()
  Log ("SAVED {0}  {1}x{2} @({3},{4})" -f $outPath, $cw, $ch, $cx, $cy)
}

# ---------- logos ----------
$logoA = Get-Info $LogoAPath
$logoB = Get-Info $LogoBPath

$logoBHasAlpha = $false
if ($null -ne $logoB) {
  $f = $logoB.PixelFormat.ToString()
  if ($f.Contains("Argb") -or $f.Contains("PAlpha")) { $logoBHasAlpha = $true }
  $c = $logoB.GetPixel(2, 2)
  if ($c.A -lt 10) { $logoBHasAlpha = $true }
}

if ($logoBHasAlpha) {
  $logoB.Save((Join-Path $OutDir "logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  Log "LOGO: using Grupo 2.png (alpha detectado) -> public/logo.png"
} elseif ($null -ne $logoA) {
  $logoA.Save((Join-Path $OutDir "logo.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  Log "LOGO: usando logo de Downloads (fondo negro, se blend-a con screen) -> public/logo.png"
}
if ($null -ne $logoA) {
  $logoA.Save((Join-Path $OutDir "logo-black.png"), [System.Drawing.Imaging.ImageFormat]::Png)
}

# favicon 64x64 a partir de logo.png
$logoSrc = [System.Drawing.Bitmap]::FromFile((Join-Path $OutDir "logo.png"))
$fav = New-Object System.Drawing.Bitmap(64, 64)
$g = [System.Drawing.Graphics]::FromImage($fav)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::Black)
$scale = [Math]::Min(64 / $logoSrc.Width, 64 / $logoSrc.Height)
$nw = [int]($logoSrc.Width * $scale); $nh = [int]($logoSrc.Height * $scale)
$nx = [int]((64 - $nw) / 2); $ny = [int]((64 - $nh) / 2)
$g.DrawImage($logoSrc, $nx, $ny, $nw, $nh)
$g.Dispose()
$fav.Save((Join-Path $OutDir "favicon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$fav.Dispose(); $logoSrc.Dispose()
Log "SAVED favicon.png (64x64)"

# ---------- separar composite en 2 fondos ----------
$comp = Get-Info $CompositePath
if ($null -eq $comp) { throw "No se encontro la imagen compuesta: $CompositePath" }
$W = $comp.Width; $H = $comp.Height

# detectar la banda negra entre las dos escenas
$bestStart = -1; $bestLen = 0; $curStart = -1; $curLen = 0
$y0 = [int]($H * 0.30); $y1 = [int]($H * 0.70)
for ($y = $y0; $y -lt $y1; $y++) {
  $sum = 0.0; $n = 0
  for ($x = 0; $x -lt $W; $x += 12) {
    $p = $comp.GetPixel($x, $y)
    $sum = $sum + ($p.R + $p.G + $p.B)
    $n++
  }
  $avg = $sum / (3.0 * $n)
  if ($avg -lt 14) {
    if ($curStart -lt 0) { $curStart = $y; $curLen = 1 } else { $curLen = $curLen + 1 }
    if ($curLen -gt $bestLen) { $bestLen = $curLen; $bestStart = $curStart }
  } else {
    $curStart = -1; $curLen = 0
  }
}
$split = 0
if ($bestLen -ge 6) {
  $split = $bestStart + [int]($bestLen / 2)
  Log ("SEAM encontrado: start={0} len={1} split={2}" -f $bestStart, $bestLen, $split)
} else {
  $split = [int]($H * 0.427)
  Log ("SEAM no encontrado, uso fallback split={0}" -f $split)
}

Save-Crop $comp 0 0 $W $split (Join-Path $OutDir "art-horde.png")
Save-Crop $comp 0 ($split + 1) $W ($H - $split - 1) (Join-Path $OutDir "art-sunset.png")

# ---------- crops para las 4 tarjetas (coordenadas en espacio 958x830) ----------
$topH = $split
$sx = $W / 958.0
$sy = $topH / 830.0
$cards = @(
  @{ n = "card-mods";  x = 135; y = 195; w = 470; h = 275 },
  @{ n = "card-armas"; x = 5;   y = 95;  w = 410; h = 260 },
  @{ n = "card-npc";   x = 275; y = 150; w = 410; h = 260 },
  @{ n = "card-pvp";   x = 585; y = 55;  w = 370; h = 260 }
)
foreach ($c in $cards) {
  $x = [int]($c.x * $sx); $y = [int]($c.y * $sy)
  $w = [int]($c.w * $sx); $h = [int]($c.h * $sy)
  Save-Crop $comp $x $y $w $h (Join-Path $OutDir ($c.n + ".png"))
}

$comp.Dispose()
if ($null -ne $logoA) { $logoA.Dispose() }
if ($null -ne $logoB) { $logoB.Dispose() }
Log "DONE"
