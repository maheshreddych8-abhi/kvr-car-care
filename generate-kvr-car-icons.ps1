Add-Type -AssemblyName System.Drawing

function Draw-KVRCarIcon {
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

    # Scaling factor based on 512 base
    $scale = [float]($size / 512.0)

    # 1. Background - Deep Luxury Automotive Dark Gradient
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(18, 10, 32))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    # Rounded Squircle Border (Gold Rim)
    $rimPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 184, 0), [float](8 * $scale))
    $g.DrawRectangle($rimPen, [float](14 * $scale), [float](14 * $scale), [float]($size - 28 * $scale), [float]($size - 28 * $scale))

    # Inner Glow Ring
    $innerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 245, 184, 0), [float](2 * $scale))
    $g.DrawRectangle($innerPen, [float](22 * $scale), [float](22 * $scale), [float]($size - 44 * $scale), [float]($size - 44 * $scale))

    # 2. Road & Speed Line with Red racing accent
    $redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(229, 37, 42))
    $g.FillRectangle($redBrush, [float](35 * $scale), [float](360 * $scale), [float](442 * $scale), [float](6 * $scale))

    $goldLineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 184, 0))
    $g.FillRectangle($goldLineBrush, [float](60 * $scale), [float](370 * $scale), [float](392 * $scale), [float](2.5 * $scale))

    # 3. Modern Car Body (Sleek Sedan / Coupe Profile)
    $carBodyPath = New-Object System.Drawing.Drawing2D.GraphicsPath

    # Define Car Profile Points
    $pts = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new(60 * $scale, 305 * $scale),
        [System.Drawing.PointF]::new(50 * $scale, 290 * $scale),
        [System.Drawing.PointF]::new(65 * $scale, 265 * $scale),
        [System.Drawing.PointF]::new(125 * $scale, 255 * $scale),
        [System.Drawing.PointF]::new(185 * $scale, 205 * $scale),
        [System.Drawing.PointF]::new(230 * $scale, 175 * $scale),
        [System.Drawing.PointF]::new(340 * $scale, 175 * $scale),
        [System.Drawing.PointF]::new(395 * $scale, 215 * $scale),
        [System.Drawing.PointF]::new(435 * $scale, 255 * $scale),
        [System.Drawing.PointF]::new(465 * $scale, 275 * $scale),
        [System.Drawing.PointF]::new(460 * $scale, 315 * $scale),
        [System.Drawing.PointF]::new(425 * $scale, 315 * $scale),
        [System.Drawing.PointF]::new(405 * $scale, 310 * $scale),
        [System.Drawing.PointF]::new(355 * $scale, 310 * $scale),
        [System.Drawing.PointF]::new(225 * $scale, 312 * $scale),
        [System.Drawing.PointF]::new(195 * $scale, 310 * $scale),
        [System.Drawing.PointF]::new(135 * $scale, 310 * $scale),
        [System.Drawing.PointF]::new(80 * $scale, 312 * $scale)
    )
    $carBodyPath.AddPolygon($pts)

    # Fill Car Body with Radiant Gold
    $carBodyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 204, 0))
    $g.FillPath($carBodyBrush, $carBodyPath)

    # Sleek Red Racing Stripe on lower car side
    $stripeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 30, 40))
    $stripePts = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new(70 * $scale, 280 * $scale),
        [System.Drawing.PointF]::new(455 * $scale, 280 * $scale),
        [System.Drawing.PointF]::new(452 * $scale, 290 * $scale),
        [System.Drawing.PointF]::new(72 * $scale, 290 * $scale)
    )
    $g.FillPolygon($stripeBrush, $stripePts)

    # 4. Car Windows (Dark tinted sapphire glass)
    $windowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $winPts = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new(188 * $scale, 212 * $scale),
        [System.Drawing.PointF]::new(228 * $scale, 186 * $scale),
        [System.Drawing.PointF]::new(335 * $scale, 186 * $scale),
        [System.Drawing.PointF]::new(385 * $scale, 222 * $scale),
        [System.Drawing.PointF]::new(325 * $scale, 250 * $scale),
        [System.Drawing.PointF]::new(165 * $scale, 250 * $scale)
    )
    $windowPath.AddPolygon($winPts)
    $winBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $g.FillPath($winBrush, $windowPath)

    # B-Pillar divider
    $pillarPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 204, 0), [float](6 * $scale))
    $g.DrawLine($pillarPen, [float](265 * $scale), [float](186 * $scale), [float](262 * $scale), [float](250 * $scale))

    # 5. Headlight & Taillight
    # Front Headlight (Bright Xenon White)
    $lightBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255))
    $g.FillEllipse($lightBrush, [float](54 * $scale), [float](268 * $scale), [float](18 * $scale), [float](10 * $scale))

    # Rear Taillight (Ruby Red LED)
    $tailBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 60, 60))
    $g.FillRectangle($tailBrush, [float](452 * $scale), [float](268 * $scale), [float](12 * $scale), [float](10 * $scale))

    # 6. WHEELS & RIMS
    # Front Wheel
    $frontWheelX = 165 * $scale
    $wheelY = 312 * $scale
    $wheelR = 40 * $scale

    # Tire (Dark rubber)
    $tireBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20, 24, 33))
    $g.FillEllipse($tireBrush, [float]($frontWheelX - $wheelR), [float]($wheelY - $wheelR), [float]($wheelR * 2), [float]($wheelR * 2))
    
    # Silver Alloy Rim
    $rimBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(226, 232, 240))
    $g.FillEllipse($rimBrush, [float]($frontWheelX - $wheelR * 0.65), [float]($wheelY - $wheelR * 0.65), [float]($wheelR * 1.3), [float]($wheelR * 1.3))
    
    # Hub Cap
    $hubBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 184, 0))
    $g.FillEllipse($hubBrush, [float]($frontWheelX - $wheelR * 0.25), [float]($wheelY - $wheelR * 0.25), [float]($wheelR * 0.5), [float]($wheelR * 0.5))

    # Rear Wheel
    $rearWheelX = 380 * $scale
    $g.FillEllipse($tireBrush, [float]($rearWheelX - $wheelR), [float]($wheelY - $wheelR), [float]($wheelR * 2), [float]($wheelR * 2))
    $g.FillEllipse($rimBrush, [float]($rearWheelX - $wheelR * 0.65), [float]($wheelY - $wheelR * 0.65), [float]($wheelR * 1.3), [float]($wheelR * 1.3))
    $g.FillEllipse($hubBrush, [float]($rearWheelX - $wheelR * 0.25), [float]($wheelY - $wheelR * 0.25), [float]($wheelR * 0.5), [float]($wheelR * 0.5))

    # 7. THE "KVR" NAME ON THE CAR BODY (Door Panel / Side Emblem)
    $plateWidth = 140 * $scale
    $plateHeight = 46 * $scale
    $plateX = 205 * $scale
    $plateY = 248 * $scale

    # Dark contrast nameplate on the car door
    $plateBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $g.FillRectangle($plateBrush, [float]$plateX, [float]$plateY, [float]$plateWidth, [float]$plateHeight)

    $plateBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 184, 0), [float](2.5 * $scale))
    $g.DrawRectangle($plateBorderPen, [float]$plateX, [float]$plateY, [float]$plateWidth, [float]$plateHeight)

    # "KVR" BOLD TEXT ON CAR
    $kvrFont = New-Object System.Drawing.Font("Arial", [float](32 * $scale), [System.Drawing.FontStyle]::Bold)
    $kvrTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 215, 0))
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $plateRect = New-Object System.Drawing.RectangleF([float]$plateX, [float]$plateY, [float]$plateWidth, [float]$plateHeight)
    $g.DrawString("KVR", $kvrFont, $kvrTextBrush, $plateRect, $sf)

    # 8. TOP HEADER: "KVR CAR CARE"
    $topFont = New-Object System.Drawing.Font("Arial", [float](28 * $scale), [System.Drawing.FontStyle]::Bold)
    $topBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $topRect = New-Object System.Drawing.RectangleF(0, [float](70 * $scale), $size, [float](40 * $scale))
    $g.DrawString("KVR CAR CARE", $topFont, $topBrush, $topRect, $sf)

    # 9. BOTTOM SUBTITLE: "MULTI-BRAND WORKSHOP"
    $subFont = New-Object System.Drawing.Font("Arial", [float](15 * $scale), [System.Drawing.FontStyle]::Bold)
    $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 184, 0))
    $subRect = New-Object System.Drawing.RectangleF(0, [float](420 * $scale), $size, [float](30 * $scale))
    $g.DrawString("MULTI-BRAND WORKSHOP • GUNTUR", $subFont, $subBrush, $subRect, $sf)

    # Save Bitmap
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated icon: $outputPath ($size x $size)"
}

$baseDir = "C:\Users\mahesh.chalimadugu.SMARTIMSHYD\.gemini\antigravity\scratch\kvr-car-care"
Draw-KVRCarIcon 512 "$baseDir\icon-512.png"
Draw-KVRCarIcon 192 "$baseDir\icon-192.png"
Draw-KVRCarIcon 512 "$baseDir\icon-owner-512.png"
Draw-KVRCarIcon 192 "$baseDir\icon-owner-192.png"
Draw-KVRCarIcon 512 "$baseDir\icon-customer-512.png"
Draw-KVRCarIcon 192 "$baseDir\icon-customer-192.png"
