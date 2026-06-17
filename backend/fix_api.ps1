$filePath = "routes/api.php"

Write-Host "`n=== FIXING ENCODING ===" -ForegroundColor Cyan
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)
$cleanContent = $content -replace '[^\x00-\x7F\r\n]', ''
$lines = $cleanContent -split "`n"
$filteredLines = $lines | Where-Object { $_.Trim() -ne '' }
Copy-Item $filePath "$filePath.bak"
Write-Host "Backup saved as $filePath.bak" -ForegroundColor Yellow
$filteredLines | Set-Content $filePath -Encoding UTF8
Write-Host "Encoding fixed and saved!" -ForegroundColor Green

Write-Host "`n=== ROUTES IN api.php ===" -ForegroundColor Cyan
$routeContent = Get-Content $filePath
$routes = $routeContent | Select-String -Pattern "Route::(get|post|put|patch|delete|resource|apiResource)\("
if ($routes) {
    $routes | ForEach-Object { Write-Host $_.Line.Trim() -ForegroundColor White }
} else {
    Write-Host "No routes found." -ForegroundColor Red
}

Write-Host "`n=== CONTROLLERS USED ===" -ForegroundColor Cyan
$controllers = $routeContent | Select-String -Pattern "\[([A-Za-z]+Controller)::class" |
    ForEach-Object {
        if ($_ -match "\[([A-Za-z]+Controller)::class") { $matches[1] }
    } | Sort-Object -Unique
if ($controllers) {
    $controllers | ForEach-Object { Write-Host "  - $_" -ForegroundColor Green }
} else {
    Write-Host "No controllers found." -ForegroundColor Red
}

Write-Host "`n=== SEARCH ROUTES ===" -ForegroundColor Cyan
$keyword = Read-Host "Enter keyword to search (e.g. admin, login, student)"
$results = $routeContent | Select-String -Pattern $keyword
if ($results) {
    Write-Host "`nResults for '$keyword':" -ForegroundColor Yellow
    $results | ForEach-Object { Write-Host "  Line $($_.LineNumber): $($_.Line.Trim())" -ForegroundColor White }
} else {
    Write-Host "No results found for '$keyword'" -ForegroundColor Red
}

Write-Host "`n=== FIND & REPLACE ===" -ForegroundColor Cyan
$findText = Read-Host "Enter text to find (leave blank to skip)"
if ($findText -ne '') {
    $replaceText = Read-Host "Enter replacement text"
    $updatedContent = (Get-Content $filePath -Raw) -replace [regex]::Escape($findText), $replaceText
    Set-Content $filePath $updatedContent -Encoding UTF8
    Write-Host "Replacement done!" -ForegroundColor Green
} else {
    Write-Host "Skipped find & replace." -ForegroundColor Yellow
}

Write-Host "`n=== ALL DONE ===" -ForegroundColor Cyan
