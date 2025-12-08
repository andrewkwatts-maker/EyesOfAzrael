# PowerShell script to add Firebase Authentication to mythology detail pages
# This script updates deity, hero, and creature pages across all mythologies

$firebaseAuthImports = @"

<!-- Firebase Auth System -->
<link rel="stylesheet" href="../../../css/user-auth.css">
<script src="../../../js/firebase-auth.js"></script>
<script src="../../../js/auth-guard.js"></script>
<script src="../../../js/components/google-signin-button.js"></script>
"@

$firebaseSDK = @"

<!-- Firebase SDK (CDN) -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="../../../firebase-config.js"></script>

<!-- Initialize Auth UI -->
<script>
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize Google Sign-In button in header
        if (window.GoogleSignInButton) {
            const authNav = document.getElementById('user-auth-nav');
            if (authNav) {
                window.GoogleSignInButton.injectIntoElement(authNav, {
                    showUserInfo: true,
                    showAvatar: true,
                    compact: true
                });
            }
        }
    });
</script>
"@

# List of files to update (excluding index.html files)
$filesToUpdate = @(
    # Egyptian deities
    "mythos\egyptian\deities\isis.html",
    "mythos\egyptian\deities\anubis.html",
    "mythos\egyptian\deities\horus.html",
    "mythos\egyptian\deities\thoth.html",

    # Norse deities
    "mythos\norse\deities\odin.html",
    "mythos\norse\deities\thor.html",
    "mythos\norse\deities\loki.html",
    "mythos\norse\deities\freya.html",
    "mythos\norse\deities\fenrir.html",

    # Christian deities
    "mythos\christian\deities\jesus-christ.html",
    "mythos\christian\deities\god-father.html",
    "mythos\christian\deities\holy-spirit.html",
    "mythos\christian\deities\michael.html",
    "mythos\christian\deities\gabriel.html",

    # Hindu deities
    "mythos\hindu\deities\brahma.html",
    "mythos\hindu\deities\vishnu.html",
    "mythos\hindu\deities\shiva.html",
    "mythos\hindu\deities\krishna.html",
    "mythos\hindu\deities\ganesha.html",

    # Greek heroes
    "mythos\greek\heroes\heracles.html",
    "mythos\greek\heroes\perseus.html",
    "mythos\greek\heroes\theseus.html",
    "mythos\greek\heroes\odysseus.html",
    "mythos\greek\heroes\achilles.html",

    # Other heroes
    "mythos\christian\heroes\moses.html",
    "mythos\christian\heroes\peter.html",
    "mythos\christian\heroes\john.html",
    "mythos\jewish\heroes\moses.html",
    "mythos\jewish\heroes\abraham.html",
    "mythos\hindu\heroes\rama.html",
    "mythos\hindu\heroes\krishna.html",
    "mythos\norse\heroes\sigurd.html",
    "mythos\islamic\heroes\ibrahim.html",
    "mythos\islamic\heroes\musa.html",

    # Creatures
    "mythos\greek\creatures\medusa.html",
    "mythos\greek\creatures\hydra.html",
    "mythos\greek\creatures\minotaur.html",
    "mythos\norse\creatures\jotnar.html",
    "mythos\norse\creatures\svadilfari.html",
    "mythos\christian\creatures\seraphim.html",
    "mythos\hindu\creatures\garuda.html",
    "mythos\hindu\creatures\nagas.html"
)

$updatedFiles = @()
$skippedFiles = @()
$errorFiles = @()

foreach ($file in $filesToUpdate) {
    $fullPath = Join-Path "H:\Github\EyesOfAzrael" $file

    if (-not (Test-Path $fullPath)) {
        Write-Host "File not found: $file" -ForegroundColor Yellow
        $skippedFiles += $file
        continue
    }

    try {
        $content = Get-Content $fullPath -Raw -Encoding UTF8

        # Check if already has Firebase auth
        if ($content -match "firebase-auth\.js") {
            Write-Host "Already has Firebase auth: $file" -ForegroundColor Gray
            $skippedFiles += $file
            continue
        }

        # Add Firebase imports before </head> or before <style> tag
        if ($content -match "<script defer src=`"../../../themes/theme-picker\.js`"></script>") {
            $content = $content -replace "(<script defer src=`"../../../themes/theme-picker\.js`"></script>)", "`$1$firebaseAuthImports"
        }

        # Add user-auth-nav div to header
        if ($content -match "<h1>([^<]+)</h1>\s*</div>\s*</header>") {
            $content = $content -replace "(<h1>[^<]+</h1>)\s*(</div>\s*</header>)", "`$1`n        <div id=`"user-auth-nav`"></div>`n    `$2"
        }

        # Add Firebase SDK before </body>
        if ($content -match "</footer>\s*</body>\s*</html>") {
            $content = $content -replace "(</footer>)\s*(</body>\s*</html>)", "`$1$firebaseSDK`$2"
        }

        # Write updated content
        Set-Content -Path $fullPath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $file" -ForegroundColor Green
        $updatedFiles += $file

    } catch {
        Write-Host "Error updating $file : $_" -ForegroundColor Red
        $errorFiles += $file
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Updated: $($updatedFiles.Count) files" -ForegroundColor Green
Write-Host "Skipped: $($skippedFiles.Count) files" -ForegroundColor Yellow
Write-Host "Errors: $($errorFiles.Count) files" -ForegroundColor Red
Write-Host "`nUpdated files:"
$updatedFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Green }
