# Insurai Application Startup Guide

## Overview
This guide will help you start the Insurai application properly, including both the backend server and frontend.

## Prerequisites
- Java 11 or higher installed
- Maven installed
- Node.js and npm installed

## Starting the Application

### Method 1: Using the Startup Script (Recommended for Windows)

1. **Start the Backend Server:**
   ```cmd
   start-backend.bat
   ```
   This script will:
   - Navigate to the `insurai-backend` directory
   - Start the Spring Boot application using Maven
   - Display server logs and status

2. **Start the Frontend:**
   Open a new terminal/command prompt and run:
   ```cmd
   npm run dev
   ```

3. **Access the Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - WebSocket: ws://localhost:8080/ws/dashboard

### Method 2: Manual Startup

1. **Start Backend (in one terminal):**
   ```cmd
   cd insurai-backend
   mvn spring-boot:run
   ```

2. **Start Frontend (in another terminal):**
   ```cmd
   npm run dev
   ```

## WebSocket Testing

### Test WebSocket Connection
1. Open the test page: `websocket-test.html` in your browser
2. Click "Connect WebSocket" to test the connection
3. If successful, you should see "Status: Connected"

### Test the Underwriter Dashboard
1. Navigate to the underwriter dashboard
2. The WebSocket should connect automatically
3. Check browser console for any connection errors

## Troubleshooting

### Common Issues

1. **Port 8080 already in use:**
   - Stop any other applications using port 8080
   - Or change `server.port=8080` in `application.properties`

2. **Maven command not found:**
   - Ensure Maven is installed and in your PATH
   - Try using `./mvnw` (Unix) or `mvnw.cmd` (Windows) instead

3. **WebSocket 404 Error:**
   - Ensure the backend server is running
   - Check that the WebSocket endpoints are properly configured
   - Verify the application.properties WebSocket settings

4. **Frontend build errors:**
   - Run `npm install` to ensure dependencies are installed
   - Check that Node.js version is compatible

### Verification Steps

1. **Check Backend Status:**
   ```cmd
   curl http://localhost:8080/api/websocket/health
   ```
   Should return: "WebSocket endpoint is active and ready"

2. **Check WebSocket Connection:**
   - Open browser developer tools
   - Navigate to Network tab
   - Look for WebSocket connections to `ws://localhost:8080/ws/dashboard`

3. **Check Application Logs:**
   - Backend logs should show WebSocket connection messages
   - Frontend console should show successful WebSocket connection

## Files Modified for WebSocket Support

The following files were updated to fix the WebSocket issues:

### Backend Files:
- `insurai-backend/src/main/java/com/insurai/backend/DashboardWebSocketHandler.java` - WebSocket handler
- `insurai-backend/src/main/java/com/insurai/backend/WebSocketConfig.java` - WebSocket configuration
- `insurai-backend/src/main/java/com/insurai/backend/controller/WebSocketController.java` - Health check endpoints
- `insurai-backend/src/main/resources/application.properties` - WebSocket configuration properties

### Frontend Files:
- `frontend/js/underwriter-dashboard.js` - Fixed JavaScript error in `updateClaimStatus` function

### Test Files:
- `websocket-test.html` - Standalone WebSocket test page
- `start-backend.bat` - Windows startup script

## Next Steps

Once the application is running:
1. Test the underwriter dashboard WebSocket connection
2. Verify real-time updates are working
3. Test claim status updates
4. Test policy approval notifications

If you encounter any issues, check the browser console and backend logs for error messages.