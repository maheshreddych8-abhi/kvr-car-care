Add-Type -AssemblyName System.Drawing

function Draw-CleanBlueKVRCarIcon {
    param(
        [int]$size,
        [string]$outputPath
    )

    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $scale = [float]($size / 512.0)

    # 1. Background: Deep Royal Slate (#0b1120) with subtle radial-like rounded glow
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(11, 17, 32))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    # Rounded Squircle Border for high-end App Icon aesthetic
    $squirclePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(37, 99, 235), [float](6 * $scale))
    $g.DrawRectangle($squirclePen, [float](10 * $scale), [float](10 * $scale), [float]($size - 20 * $scale), [float]($size - 20 * $scale))

    # Inner subtle rim
    $innerRimPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(56, 189, 248), [float](2 * $scale))
    $g.DrawRectangle($innerRimPen, [float](18 * $scale), [float](18 * $scale), [float]($size - 36 * $scale), [float]($size - 36 * $scale))

    # Ambient ground glow under car
    $glowBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.PointF]::new(100 * $scale, 330 * $scale),
        [System.Drawing.PointF]::new(412 * $scale, 380 * $scale),
        [System.Drawing.Color]::FromArgb(60, 37, 99, 235),
        [System.Drawing.Color]::FromArgb(0, 11, 17, 32)
    )
    $g.FillEllipse($glowBrush, [float](70 * $scale), [float](330 * $scale), [float](372 * $scale), [float](50 * $scale))
    $glowBrush.Dispose()

    # Sleek road line beneath car
    $roadPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(51, 65, 85), [float](4 * $scale))
    $g.DrawLine($roadPen, [float](45 * $scale), [float](350 * $scale), [float](467 * $scale), [float](350 * $scale))
    
    # Yellow speed dash on road
    $dashPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(250, 204, 21), [float](3 * $scale))
    $g.DrawLine($dashPen, [float](190 * $scale), [float](350 * $scale), [float](320 * $scale), [float](350 * $scale))

    # 2. Sleek Blue Car Body (Centered in Icon)
    # Coordinates vertically centered: car extends from y=160 to y=350
    $carBodyPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pts = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new(55 * $scale, 315 * $scale),   # Front bumper bottom
        [System.Drawing.PointF]::new(48 * $scale, 290 * $scale),   # Front bumper nose
        [System.Drawing.PointF]::new(68 * $scale, 260 * $scale),   # Front headlight slope
        [System.Drawing.PointF]::new(140 * $scale, 240 * $scale),  # Hood slope
        [System.Drawing.PointF]::new(205 * $scale, 175 * $scale),  # Windshield rake
        [System.Drawing.PointF]::new(255 * $scale, 155 * $scale),  # Roof start
        [System.Drawing.PointF]::new(345 * $scale, 155 * $scale),  # Roof crown
        [System.Drawing.PointF]::new(405 * $scale, 205 * $scale),  # Fastback rear windshield
        [System.Drawing.PointF]::new(448 * $scale, 255 * $scale),  # Rear deck / spoiler
        [System.Drawing.PointF]::new(465 * $scale, 280 * $scale),  # Rear tip
        [System.Drawing.PointF]::new(455 * $scale, 315 * $scale),  # Rear lower apron
        [System.Drawing.PointF]::new(418 * $scale, 315 * $scale),  # Rear wheel well right
        [System.Drawing.PointF]::new(395 * $scale, 298 * $scale),  # Rear wheel arch top
        [System.Drawing.PointF]::new(342 * $scale, 315 * $scale),  # Rear wheel well left
        [System.Drawing.PointF]::new(215 * $scale, 316 * $scale),  # Side skirt
        [System.Drawing.PointF]::new(185 * $scale, 315 * $scale),  # Front wheel well right
        [System.Drawing.PointF]::new(138 * $scale, 298 * $scale),  # Front wheel arch top
        [System.Drawing.PointF]::new(88 * $scale, 315 * $scale)    # Front wheel well left
    )
    $carBodyPath.AddPolygon($pts)

    # Vibrant Electric/Royal Blue Gradient fill for car
    $carGradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.PointF]::new(256 * $scale, 155 * $scale),
        [System.Drawing.PointF]::new(256 * $scale, 316 * $scale),
        [System.Drawing.Color]::FromArgb(37, 99, 235),   # #2563eb bright royal blue
        [System.Drawing.Color]::FromArgb(29, 78, 216)    # #1d4ed8 deep blue
    )
    $g.FillPath($carGradBrush, $carBodyPath)
    $carGradBrush.Dispose()

    # Bright Cyan metallic highlight border around car
    $carRimPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(56, 189, 248), [float](3.5 * $scale))
    $g.DrawPath($carRimPen, $carBodyPath)

    # 3. Tinted Aerodynamic Windows
    $winPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $winPts = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new(206 * $scale, 185 * $scale),
        [System.Drawing.PointF]::new(252 * $scale, 165 * $scale),
        [System.Drawing.PointF]::new(340 * $scale, 165 * $scale),
        [System.Drawing.PointF]::new(392 * $scale, 212 * $scale),
        [System.Drawing.PointF]::new(336 * $scale, 232 * $scale),
        [System.Drawing.PointF]::new(186 * $scale, 232 * $scale)
    )
    $winPath.AddPolygon($winPts)
    $winBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42)) # Tinted dark glass
    $g.FillPath($winBrush, $winPath)

    # Window gloss glare reflection
    $glarePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 255, 255, 255), [float](2 * $scale))
    $g.DrawLine($glarePen, [float](225 * $scale), [float](178 * $scale), [float](325 * $scale), [float](178 * $scale))

    # B-Pillar divider
    $pillarPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(37, 99, 235), [float](5 * $scale))
    $g.DrawLine($pillarPen, [float](270 * $scale), [float](165 * $scale), [float](268 * $scale), [float](232 * $scale))

    # 4. Xenon White Headlight & LED Taillight
    $headlightBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255))
    $g.FillEllipse($headlightBrush, [float](52 * $scale), [float](265 * $scale), [float](24 * $scale), [float](14 * $scale))
    $headlightGlow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(56, 189, 248), [float](2 * $scale))
    $g.DrawEllipse($headlightGlow, [float](50 * $scale), [float](264 * $scale), [float](28 * $scale), [float](16 * $scale))

    $tailBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(239, 68, 68))
    $g.FillRectangle($tailBrush, [float](452 * $scale), [float](272 * $scale), [float](14 * $scale), [float](10 * $scale))

    # 5. Alloy Wheels (Sport Multi-Spoke)
    $wheelR = 40 * $scale
    $wheelY = 315 * $scale

    $tireBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $rimBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(226, 232, 240))
    $hubBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(56, 189, 248))

    # Front Wheel (x=162)
    $frontX = 162 * $scale
    $g.FillEllipse($tireBrush, [float]($frontX - $wheelR), [float]($wheelY - $wheelR), [float]($wheelR * 2), [float]($wheelR * 2))
    $g.FillEllipse($rimBrush, [float]($frontX - $wheelR * 0.68), [float]($wheelY - $wheelR * 0.68), [float]($wheelR * 1.36), [float]($wheelR * 1.36))
    $g.FillEllipse($hubBrush, [float]($frontX - $wheelR * 0.28), [float]($wheelY - $wheelR * 0.28), [float]($wheelR * 0.56), [float]($wheelR * 0.56))

    # Rear Wheel (x=368)
    $rearX = 368 * $scale
    $g.FillEllipse($tireBrush, [float]($rearX - $wheelR), [float]($wheelY - $wheelR), [float]($wheelR * 2), [float]($wheelR * 2))
    $g.FillEllipse($rimBrush, [float]($rearX - $wheelR * 0.68), [float]($wheelY - $wheelR * 0.68), [float]($wheelR * 1.36), [float]($wheelR * 1.36))
    $g.FillEllipse($hubBrush, [float]($rearX - $wheelR * 0.28), [float]($wheelY - $wheelR * 0.28), [float]($wheelR * 0.56), [float]($wheelR * 0.56))

    # 6. LARGE, BOLD "KVR" NAME IN THE MIDDLE OF THE BLUE CAR
    # We position an elegant high-contrast emblem plate right on the car door
    $badgeW = 160 * $scale
    $badgeH = 54 * $scale
    $badgeX = 200 * $scale
    $badgeY = 240 * $scale

    # Dark Sapphire plate with bright Gold/Amber border
    $badgeBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.PointF]::new($badgeX, $badgeY),
        [System.Drawing.PointF]::new($badgeX, $badgeY + $badgeH),
        [System.Drawing.Color]::FromArgb(15, 23, 42),
        [System.Drawing.Color]::FromArgb(30, 58, 138)
    )
    $g.FillRectangle($badgeBrush, [float]$badgeX, [float]$badgeY, [float]$badgeW, [float]$badgeH)
    $badgeBrush.Dispose()

    $badgeBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(250, 204, 21), [float](3.5 * $scale))
    $g.DrawRectangle($badgeBorderPen, [float]$badgeX, [float]$badgeY, [float]$badgeW, [float]$badgeH)

    # Crisp, Ultra-Bold "KVR" Text Centered on the Plate
    $kvrFont = New-Object System.Drawing.Font("Arial Black", [float](36 * $scale), [System.Drawing.FontStyle]::Bold)
    $kvrBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255))
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $badgeRect = New-Object System.Drawing.RectangleF([float]$badgeX, [float]$badgeY, [float]$badgeW, [float]$badgeH)
    $g.DrawString("KVR", $kvrFont, $kvrBrush, $badgeRect, $sf)

    # 7. Clean Top Badge: "KVR CAR CARE" in Gold
    $topFont = New-Object System.Drawing.Font("Arial", [float](22 * $scale), [System.Drawing.FontStyle]::Bold)
    $topBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(250, 204, 21))
    $topRect = New-Object System.Drawing.RectangleF(0, [float](75 * $scale), $size, [float](36 * $scale))
    $g.DrawString("KVR CAR CARE", $topFont, $topBrush, $topRect, $sf)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated Clean Blue Car Icon: $outputPath ($size x $size)"
}

$baseDir = "C:\Users\mahesh.chalimadugu.SMARTIMSHYD\.gemini\antigravity\scratch\kvr-car-care"
Draw-CleanBlueKVRCarIcon 512 "$baseDir\icon-512.png"
Draw-CleanBlueKVRCarIcon 192 "$baseDir\icon-192.png"
Draw-CleanBlueKVRCarIcon 512 "$baseDir\icon-owner-512.png"
Draw-CleanBlueKVRCarIcon 192 "$baseDir\icon-owner-192.png"
Draw-CleanBlueKVRCarIcon 512 "$baseDir\icon-customer-512.png"
Draw-CleanBlueKVRCarIcon 192 "$baseDir\icon-customer-192.png"
