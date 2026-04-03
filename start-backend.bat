@echo off
echo Starting Insurai Backend Server...
echo.

REM Change to the backend directory
cd insurai-backend

REM Check if mvnw.cmd exists
if not exist mvnw.cmd (
    echo Error: mvnw.cmd not found in insurai-backend directory
    echo Please ensure you are in the correct directory
    pause
    exit /b 1
)

echo Starting Spring Boot application...
echo Press Ctrl+C to stop the server
echo.

REM Start the Spring Boot application
call mvnw.cmd spring-boot:run

echo.
echo Server stopped.
pause