# InsurAI - Quick Start Guide

## ✅ System Status: READY FOR TESTING

### Backend Server Running ✓
- Status: **Active on port 8080**
- Database: **H2 In-Memory**
- All API endpoints ready

## Getting Started

### 1. Backend Status + Running!
The Spring Boot backend is currently running in the background on `localhost:8080`.

### 2. How to Test

#### Register & Login Flow
1. Open `frontend/login.html` in your browser
2. Click "Register" to create an account
3. Enter credentials and register
4. Login with the same credentials
5. Token is automatically stored in browser

#### View Dashboard
1. After successful login, you're redirected to the dashboard
2. Dashboard shows user profile and metrics
3. All data fetched from backend via `/api/user/dashboard`

#### Test API Endpoints
Backend provides these endpoints:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login (returns JWT token)
- `GET /api/user/dashboard` - Get dashboard data (requires JWT)
- `POST /api/claims/submit` - Submit new claim
- `GET /api/notifications/user` - Get user notifications
- More endpoints in integration guide

## Architecture

```
Frontend (HTML/JS) ↔ Backend (Spring Boot) ↔ H2 Database
```

- Frontend: `frontend/` folder (HTML, CSS, JS)
- Backend: Running on `http://localhost:8080`
- Database: In-memory H2 (data persists during server runtime)

## Key Files

| Path | Purpose |
|------|---------|
| `frontend/login.html` | Login page |
| `frontend/register.html` | Registration page |
| `frontend/user/user-dashboard.html` | Main dashboard (after login) |
| `frontend/js/api.js` | API client configuration |
| `insurai-backend/src/main/java/` | Backend source code |
| `insurai-backend/target/` | Compiled JAR file |

## Detailed Guidance

See these files for more information:
- `BACKEND_INTEGRATION_GUIDE.md` - Complete API reference
- `BACKEND_STATUS.md` - Current deployment status

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect to backend | Check if `java -jar` is running on port 8080 |
| 401 Unauthorized | Login first to get JWT token |
| CORS error | Backend CORS is configured for `localhost` and `file://` |
| Database error | H2 is in-memory; restart clears data |

## Summary

✅ Backend running on localhost:8080
✅ Frontend ready to connect
✅ Full authentication flow working
✅ Dashboard integrated with backend
✅ Ready for complete system testing
- Spring Boot 2.7 or higher
- MySQL or H2 database
- Modern web browser
- Internet connection for the first build

---

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd insurai-backend
```

### 2. Build the Project
```bash
# Windows
mvnw clean package

# Linux/Mac
./mvnw clean package
```

### 3. Run the Application
```bash
# Windows
mvnw spring-boot:run

# Linux/Mac
./mvnw spring-boot:run
```

The backend will start on `http://localhost:8080`

### 4. Verify Backend is Running
Open your browser and visit:
```
http://localhost:8080/actuator/health
```
You should see a JSON response indicating the app is running.

---

## Frontend Setup

### 1. Open in Browser
Navigate to:
```
file:///path/to/insurai/frontend/index.html
```

Or use a local server:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (http-server)
npx http-server
```

### 2. Login
1. Go to login page
2. Use test credentials (ensure user exists in database)
3. Login will store JWT token in localStorage

### 3. Navigate to Dashboard
After login, you'll be redirected to the user dashboard at:
```
frontend/user/user-dashboard.html
```

---

## Database Setup

### Required Tables

The database should have:
1. **users** table
2. **claims** table
3. **policies** table
4. **notifications** table
5. **roles** table

### Sample Data
```sql
-- Create sample user
INSERT INTO users (email, firstName, lastName, password, role_id) 
VALUES ('test@example.com', 'John', 'Doe', 'hashed_password', 1);

-- Create sample policy
INSERT INTO policies (user_id, type, amount, status, created_date)
VALUES (1, 'Vehicle', 50000, 'ACTIVE', NOW());

-- Create sample claim
INSERT INTO claims (user_id, type, amount, status, created_date, risk_level)
VALUES (1, 'Vehicle', 5200, 'APPROVED', NOW(), 'LOW');

-- Create sample notification
INSERT INTO notifications (user_id, title, message, type, read, created_date)
VALUES (1, 'Claim Approved', 'Your claim has been approved', 'claim', false, NOW());
```

---

## Configuration

### Backend Configuration
Edit `application.properties`:
```properties
# Database (example for MySQL)
spring.datasource.url=jdbc:mysql://localhost:3306/insurai
spring.datasource.username=root
spring.datasource.password=your_password

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

# Server
server.port=8080
```

### H2 Database (for testing)
```properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.h2.console.enabled=true
```

---

## Testing the Dashboard

### Step 1: Login
1. Open `frontend/index.html`
2. Register a new user or login with test credentials
3. Token will be stored automatically

### Step 2: Navigate to Dashboard
1. User will be redirected to `user-dashboard.html`
2. Dashboard data loads automatically

### Step 3: Test Features
- [ ] Check if stats are displayed
- [ ] Verify recent claims table shows data
- [ ] Check notification bell and panel
- [ ] Click refresh button
- [ ] Try marking notifications as read
- [ ] Check empty state (if no claims)

### Step 4: Check Browser Console
Open DevTools (F12) and check the Console tab for any errors.

---

## Common Issues & Solutions

### Issue: "Failed to load dashboard" Error
**Cause:** Backend not running or not accessible
**Solution:**
1. Verify backend is running on localhost:8080
2. Check `http://localhost:8080/actuator/health`
3. Look for error in backend logs

### Issue: CORS Error
**Cause:** CORS not configured properly
**Solution:**
1. Ensure CorsConfig.java is present and correct
2. Allow localhost:8000 (if using local server)
3. Check browser console for CORS details

### Issue: "User not found" Error
**Cause:** User doesn't exist in database
**Solution:**
1. Make sure you're logged in with valid credentials
2. Check if user exists in users table
3. Verify JWT token is valid

### Issue: Skeleton Loaders Not Disappearing
**Cause:** API request failed or timeout
**Solution:**
1. Check browser Network tab
2. Verify API endpoint is accessible
3. Look for error messages in console

### Issue: Database Connection Failed
**Cause:** Database not running or wrong credentials
**Solution:**
1. Verify MySQL/H2 is running
2. Check database credentials in application.properties
3. Ensure database exists
4. Check database user permissions

---

## API Testing (Optional)

You can test APIs directly using curl or Postman:

### Get Dashboard Data
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/user/dashboard
```

### Get User Notifications
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/notifications/user
```

### Submit a Claim
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"Vehicle","amount":5000,"description":"Car damage"}' \
  http://localhost:8080/api/claims/submit
```

---

## Port Configuration

If you need to use different ports:

### Backend on Different Port
Edit `application.properties`:
```properties
server.port=9090
```
Then update frontend API URL:
```javascript
const API_BASE_URL = 'http://localhost:9090/api';
```

### Frontend on Different Port
If using local server on different port, update in `user-dashboard.html`:
```javascript
const API_BASE_URL = 'http://localhost:YOUR_PORT/api';
```

---

## Debugging Tips

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Try to load dashboard
4. Look for API requests and their responses
5. Check status codes (200 = OK, 401 = Auth error, 500 = Server error)

### View Console Logs
1. Open DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Note any failed API calls

### Monitor Backend Logs
```
2026-02-25 10:00:00 - UserController : Loading dashboard for user@example.com
2026-02-25 10:00:01 - ClaimService : Found 12 claims for user 1
2026-02-25 10:00:02 - NotificationService : Found 3 unread notifications
```

---

## Production Checklist

Before deploying to production:

- [ ] Change database URL to production database
- [ ] Set secure JWT secret key
- [ ] Enable HTTPS
- [ ] Configure CORS properly (don't use *)
- [ ] Set environment variables correctly
- [ ] Enable logging to file
- [ ] Configure email service for notifications
- [ ] Test all API endpoints
- [ ] Perform load testing
- [ ] Setup database backups
- [ ] Configure error tracking (Sentry, etc.)

---

## Related Files

- **User Dashboard:** `frontend/user/user-dashboard.html`
- **API Reference:** `API_REFERENCE.md`
- **Developer Guide:** `DASHBOARD_DEVELOPER_GUIDE.md`
- **Improvements Summary:** `DASHBOARD_IMPROVEMENTS.md`
- **Project Summary:** `USER_DASHBOARD_SUMMARY.md`

---

## Support Resources

1. **API Endpoints:** See `API_REFERENCE.md`
2. **Development:** See `DASHBOARD_DEVELOPER_GUIDE.md`
3. **Features:** See `DASHBOARD_IMPROVEMENTS.md`
4. **Project Overview:** See `USER_DASHBOARD_SUMMARY.md`

---

## Next Steps

After verifying everything works:

1. **Create test data** - Add sample users, claims, policies
2. **Test all features** - Navigate through all dashboard features
3. **Check mobile** - Test on mobile devices
4. **Load testing** - Verify performance with multiple users
5. **Security audit** - Review security measures
6. **Documentation** - Update for your team
7. **Deployment** - Deploy to staging/production

---

## Quick Commands Reference

```bash
# Build backend
mvnw clean package

# Run backend
mvnw spring-boot:run

# Start local web server (Python 3)
python -m http.server 8000

# Start local web server (Node.js)
npx http-server

# View backend logs
tail -f application.log

# Check backend health
curl http://localhost:8080/actuator/health
```

---

**Ready to Go!** 🎉

Your user dashboard should now be fully functional and connected to the backend.

**Last Updated:** March 8, 2026
