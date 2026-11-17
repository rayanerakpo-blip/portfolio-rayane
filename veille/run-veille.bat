@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo Veille technologique - generation du digest...
echo.
node "veille\veille.mjs" --site
if errorlevel 1 (
  echo.
  echo Echec. Verifie que Node.js 18 ou plus est installe ^(node --version^).
) else (
  echo.
  echo Termine. Ouvre veille\digests\latest.md
)
echo.
pause
