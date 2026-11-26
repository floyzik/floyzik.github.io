@echo off
start python -m http.server 80
timeout /t 3 /nobreak >nul
start http://192.168.1.111/