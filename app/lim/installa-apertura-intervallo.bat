@echo off
rem Programma l'apertura dell'app Orario DADA su questa LIM agli intervalli (09:55 e 11:50).
rem Basta un doppio clic: chiede il nome dell'aula e prepara tutto (vedi apertura-intervallo.ps1).
echo Orario DADA - apertura automatica all'intervallo
echo.
set /p AULA=Nome dell'aula di questa LIM, come nell'orario (es. 110ITA4):
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0apertura-intervallo.ps1" -Aula "%AULA%"
echo.
pause
