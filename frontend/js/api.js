// api.js

// 🧩 Production base URL constant (Railway backend) and optional override
const BASE_URL = 'https://insurai.railway.app';
window.API_HOST = window.__API_URL__ || BASE_URL;
window.API_BASE_URL = window.API_BASE_URL || `${window.API_HOST}/api`;

// Helper to avoid const re-declaration when script loads twice
function getApiBaseUrl() {
    return window.API_BASE_URL;
}

// Enhanced API configuration with multiple fallback options
function getApiConfig() {
    const defaultApi = window.API_HOST || window.__API_URL__ || BASE_URL;
    const configs = [`${defaultApi}/api`];
    return configs;
}

// Test backend connectivity
async function testBackendConnection() {
    const configs = getApiConfig();
    for (const config of configs) {
        try {
            const response = await fetch(`${config}/test`, {
                method: 'GET',
                timeout: 3000
            });
            if (response.ok) {
                window.API_BASE_URL = config;
                return { success: true, baseUrl: config };
            }
        } catch (error) {
            console.warn(`Backend test failed for ${config}:`, error.message);
        }
    }
    return { success: false, baseUrl: configs[0] };
}

function getToken() {
    return localStorage.getItem('authToken');
}

function isAuthenticated() {
    return !!getToken();
}

function setToken(token) {
    localStorage.setItem('authToken', token);
}

// ✅ Enhanced API handler with better error handling and connection testing
async function apiRequest(endpoint, method = 'GET', body = null) {
    // Test backend connection on first request if not already tested
    if (!window._backendTested) {
        const testResult = await testBackendConnection();
        window._backendTested = true;
        if (!testResult.success) {
            console.warn('Backend connection test failed, using default URL');
        } else {
            console.log('Backend connection established:', testResult.baseUrl);
        }
    }

    try {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json',
            // ✅ FIX: Add cache-busting headers to prevent cached responses
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const options = {
            method: method,
            headers,
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        // ✅ FIX: Add cache-busting query parameter for GET requests
        let finalEndpoint = getApiBaseUrl() + endpoint.replace(/^\/?/, '/');
        if (method === 'GET') {
            const separator = finalEndpoint.includes('?') ? '&' : '?';
            finalEndpoint += separator + '_t=' + Date.now();
        }

        const response = await fetch(finalEndpoint, options);

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            window.location.href = '/index.html';
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const responseBody = await response.text();
            console.error('apiRequest: expected JSON but got', contentType, responseBody);
            throw new Error(`Expected JSON but got ${contentType}`);
        }

        return await response.json();

    } catch (error) {
        console.error('API Request Failed:', error);
        
        // If it's a network error, try to reconnect
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.log('Attempting to reconnect to backend...');
            const testResult = await testBackendConnection();
            if (testResult.success) {
                console.log('Reconnection successful, retrying request...');
                // Retry once with new URL
                return await fetch(getApiBaseUrl() + endpoint.replace(/^\/?/, '/'), {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        ...(getToken() && { Authorization: `Bearer ${getToken()}` })
                    },
                    body: body ? JSON.stringify(body) : undefined
                }).then(res => res.json());
            }
        }
        
        return null;
    }
}

/////////////////////////////////////////////////////
// 🔽 Specific API functions (clean usage)
/////////////////////////////////////////////////////

// Claims
async function fetchClaims() {
    return await apiRequest('/claims/user');
}

async function fetchHighRiskClaims() {
    return await apiRequest('/claims/high-risk');
}

// Policies
async function fetchPoliciesForReview() {
    return await apiRequest('/policies/review');
}

// Fraud Alerts
async function fetchFraudAlerts() {
    return await apiRequest('/ai/fraud-alerts');
}

// Decisions
async function fetchDecisions() {
    return await apiRequest('/underwriter/decisions');
}

// Notifications
async function fetchNotificationsAPI() {
    return await apiRequest('/underwriter/notifications');
}

// HR Dashboard APIs
async function fetchEmployees() {
    return await apiRequest('/hr/employees');
}

async function fetchRecentClaims() {
    return await apiRequest('/hr/claims/recent');
}

async function fetchBenefits() {
    return await apiRequest('/hr/benefits');
}

async function fetchVerifications() {
    return await apiRequest('/hr/verifications');
}

async function fetchVerificationsWithDocuments() {
    return await apiRequest('/hr/verifications-with-documents');
}

async function fetchTasks() {
    return await apiRequest('/hr/tasks');
}

// Admin APIs
async function fetchUsers() {
    return await apiRequest('/users');
}

// Make functions globally accessible
window.apiRequest = apiRequest;
window.fetchEmployees = fetchEmployees;
window.fetchBenefits = fetchBenefits;
window.fetchVerifications = fetchVerifications;
window.fetchTasks = fetchTasks;
window.fetchUsers = fetchUsers;
window.fetchClaims = fetchClaims;
window.fetchHighRiskClaims = fetchHighRiskClaims;
window.fetchPoliciesForReview = fetchPoliciesForReview;
window.fetchFraudAlerts = fetchFraudAlerts;
window.fetchDecisions = fetchDecisions;
window.fetchNotificationsAPI = fetchNotificationsAPI;
window.fetchRecentClaims = fetchRecentClaims;
