Add-Type -AssemblyName System.IO.Compression.FileSystem
$ProgressPreference = 'SilentlyContinue'

$src = 'C:\Users\mahesh.chalimadugu.SMARTIMSHYD\.gemini\antigravity\scratch\kvr-car-care'
$stage = 'C:\Users\mahesh.chalimadugu.SMARTIMSHYD\.gemini\antigravity\scratch\kvr-car-care-dist'
$dest = 'C:\Users\mahesh.chalimadugu.SMARTIMSHYD\.gemini\antigravity\scratch\kvr-car-care-github-ready.zip'
$artifactDest = 'C:\Users\mahesh.chalimadugu.SMARTIMSHYD\.gemini\antigravity\brain\2081b25c-d5cc-4b5b-a3d8-5cbc30b8b0fd\kvr-car-care-github-ready.zip'

if (Test-Path $stage) { Remove-Item -Path $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null
New-Item -ItemType Directory -Path "$stage\css" | Out-Null
New-Item -ItemType Directory -Path "$stage\js" | Out-Null

# Copy root web files
$rootFiles = @(
    'index.html', 'customer.html', 'owner.html', '404.html', 'demo.html',
    'manifest.json', 'manifest-customer.json', 'manifest-owner.json', 'sw.js',
    'kvr-banner.png', 'slide-ac-bay.svg', 'slide-diagnostics.svg', 'slide-detailing.svg',
    'icon-192.png', 'icon-512.png', 'icon-customer-192.png', 'icon-customer-512.png',
    'icon-owner-192.png', 'icon-owner-512.png', 'festival-offer.svg',
    'supabase-staff-schema.sql', 'README.md'
)

foreach ($f in $rootFiles) {
    $srcPath = Join-Path $src $f
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination (Join-Path $stage $f) -Force
    }
}

# Copy CSS
Copy-Item -Path "$src\css\*" -Destination "$stage\css" -Recurse -Force

# Copy JS
Copy-Item -Path "$src\js\*" -Destination "$stage\js" -Recurse -Force

if (Test-Path $dest) { Remove-Item -Path $dest -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($stage, $dest)

Copy-Item -Path $dest -Destination $artifactDest -Force

$zipSize = (Get-Item $dest).Length
Write-Host "Created clean distribution zip: $zipSize bytes"
Write-Host "Destination: $dest"
Write-Host "Artifact: $artifactDest"
