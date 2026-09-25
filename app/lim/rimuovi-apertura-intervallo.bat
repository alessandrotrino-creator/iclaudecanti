@echo off
rem Toglie l'apertura automatica dell'app Orario DADA agli intervalli su questa LIM.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0apertura-intervallo.ps1" -Rimuovi
echo.
pause
