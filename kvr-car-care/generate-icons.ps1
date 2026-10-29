Add-Type -AssemblyName System.Drawing

function Create-AppIcon {
    param([int]$size, [string]$role, [string]$filename, [string]$sub)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    # Background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(44, 9, 36))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    # Gold Border / Rounded Ring
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 184, 0), [float]($size * 0.04))
    $g.DrawEllipse($pen, [float]($size * 0.05), [float]($size * 0.05), [float]($size * 0.9), [float]($size * 0.9))

    # Red accent line
    $redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(229, 37, 42))
    $g.FillRectangle($redBrush, [float]($size * 0.2), [float]($size * 0.52), [float]($size * 0.6), [float]($size * 0.04))

    # KVR Text
    $fontKVR = New-Object System.Drawing.Font("Arial", [float]($size * 0.24), [System.Drawing.FontStyle]::Bold)
    $goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 204, 0))
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $rectKVR = New-Object System.Drawing.RectangleF(0, [float]($size * 0.22), $size, [float]($size * 0.28))
    $g.DrawString("KVR", $fontKVR, $goldBrush, $rectKVR, $format)

    # Subtitle Text (CUSTOMER / OWNER)
    $fontSub = New-Object System.Drawing.Font("Arial", [float]($size * 0.1), [System.Drawing.FontStyle]::Bold)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $rectSub = New-Object System.Drawing.RectangleF(0, [float]($size * 0.6), $size, [float]($size * 0.22))
    $g.DrawString($sub, $fontSub, $whiteBrush, $rectSub, $format)

    $dest = "C:\Users\mahesh.chalimadugu.SMARTIMSHYD\.gemini\antigravity\scratch\kvr-car-care\" + $filename
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created $dest"
}

Create-AppIcon 192 "Customer" "icon-customer-192.png" "CUSTOMER"
Create-AppIcon 512 "Customer" "icon-customer-512.png" "CUSTOMER"
Create-AppIcon 192 "Owner" "icon-owner-192.png" "OWNER APP"
Create-AppIcon 512 "Owner" "icon-owner-512.png" "OWNER APP"
