// WebSocket Client for InsurAI Real-time Updates
// Unified real-time communication for all dashboards

class InsurAIWebSocket {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000;
        this.handlers = new Map();
        this.currentEndpoint = '/dashboard-updates';
        
        // Dashboard-specific endpoints
        this.endpoints = {
            dashboard: '/dashboard-updates',
            claims: '/realtime/claims',
            policies: '/realtime/policies',
            fraud: '/realtime/fraud',
            notifications: '/realtime/notifications'
        };
        
        this.connect();
    }

    connect(endpoint = null) {
        if (endpoint) {
            this.currentEndpoint = endpoint;
        }
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const url = `${protocol}//${host}${this.currentEndpoint}`;
        
        console.log(`🔄 Connecting to WebSocket: ${url}`);
        
        try {
            this.ws = new WebSocket(url);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.notifyHandlers('connection', { type: 'connected' });
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📡 WebSocket message received:', data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('❌ WebSocket disconnected');
                this.isConnected = false;
                this.notifyHandlers('connection', { type: 'disconnected' });
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.notifyHandlers('error', { type: 'websocket_error', error });
            };
            
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.notifyHandlers('error', { type: 'max_reconnect_attempts' });
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    }

    handleMessage(data) {
        // Notify all handlers about the message
        this.notifyHandlers('message', data);
        
        // Handle specific message types
        switch (data.type) {
            case 'CLAIM_CREATED':
            case 'CLAIM_UPDATED':
            case 'CLAIM_STATUS_CHANGED':
                this.notifyHandlers('claim', data);
                break;
                
            case 'POLICY_CREATED':
            case 'POLICY_UPDATED':
            case 'POLICY_STATUS_CHANGED':
                this.notifyHandlers('policy', data);
                break;
                
            case 'FRAUD_ALERT':
            case 'FRAUD_DETECTED':
                this.notifyHandlers('fraud', data);
                break;
                
            case 'NOTIFICATION':
            case 'NEW_NOTIFICATION':
                this.notifyHandlers('notification', data);
                break;
                
            case 'USER_ACTION':
            case 'ADMIN_ACTION':
                this.notifyHandlers('action', data);
                break;
                
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    subscribe(type, callback) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type).add(callback);
    }

    unsubscribe(type, callback) {
        if (this.handlers.has(type)) {
            this.handlers.get(type).delete(callback);
        }
    }

    notifyHandlers(type, data) {
        if (this.handlers.has(type)) {
            this.handlers.get(type).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in handler:', error);
                }
            });
        }
    }

    send(message) {
        if (this.isConnected && this.ws) {
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Error sending WebSocket message:', error);
            }
        } else {
            console.warn('WebSocket not connected, cannot send message');
        }
    }

    switchEndpoint(endpointType) {
        const endpoint = this.endpoints[endpointType];
        if (endpoint) {
            console.log(`🔄 Switching to ${endpointType} endpoint: ${endpoint}`);
            this.currentEndpoint = endpoint;
            if (this.ws) {
                this.ws.close();
            }
            this.connect();
        } else {
            console.error('Unknown endpoint type:', endpointType);
        }
    }

    // Dashboard-specific connection methods
    connectToDashboard() {
        this.switchEndpoint('dashboard');
    }

    connectToClaims() {
        this.switchEndpoint('claims');
    }

    connectToPolicies() {
        this.switchEndpoint('policies');
    }

    connectToFraud() {
        this.switchEndpoint('fraud');
    }

    connectToNotifications() {
        this.switchEndpoint('notifications');
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }
}

// Global WebSocket instance
let insurAIWebSocket = null;

// Initialize WebSocket when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    insurAIWebSocket = new InsurAIWebSocket();
    
    // Set up global handlers
    insurAIWebSocket.subscribe('claim', (data) => {
        console.log('🔄 Claim update received:', data);
        // Broadcast to all dashboards
        broadcastUpdate('claim', data);
    });
    
    insurAIWebSocket.subscribe('policy', (data) => {
        console.log('🔄 Policy update received:', data);
        broadcastUpdate('policy', data);
    });
    
    insurAIWebSocket.subscribe('fraud', (data) => {
        console.log('🚨 Fraud update received:', data);
        broadcastUpdate('fraud', data);
    });
    
    insurAIWebSocket.subscribe('notification', (data) => {
        console.log('🔔 Notification received:', data);
        broadcastUpdate('notification', data);
        showNotificationToast(data);
    });
    
    insurAIWebSocket.subscribe('connection', (data) => {
        if (data.type === 'connected') {
            console.log('✅ Real-time connection established');
            showToast('Real-time updates connected', 'success');
        } else {
            console.log('❌ Real-time connection lost');
            showToast('Real-time connection lost', 'error');
        }
    });
});

// Utility functions for dashboards
function broadcastUpdate(type, data) {
    // Use BroadcastChannel for cross-tab communication
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('insurai-updates');
        channel.postMessage({ type, data, timestamp: new Date().toISOString() });
        channel.close();
    }
    
    // Use localStorage for fallback
    try {
        const event = { type, data, timestamp: new Date().toISOString() };
        localStorage.setItem('insurai_update_event', JSON.stringify(event));
    } catch (e) {
        console.warn('Could not store update event in localStorage:', e);
    }
}

function showNotificationToast(data) {
    // Create a unique identifier for this notification
    const notificationKey = `${data.title || 'Update'}:${data.message || 'New update available'}`;
    
    // Check if this notification has already been shown recently (within 5 minutes)
    const now = Date.now();
    const recentThreshold = 5 * 60 * 1000; // 5 minutes
    
    if (!window.recentNotifications) {
        window.recentNotifications = [];
    }

    // Check for duplicates in recent notifications
    const isDuplicate = window.recentNotifications.some(notification => {
        const notificationTime = notification.timestamp;
        return notification.key === notificationKey && (now - notificationTime) < recentThreshold;
    });

    if (isDuplicate) {
        console.log(`[WebSocket] Duplicate notification suppressed: ${data.title || data.message}`);
        return; // Skip showing duplicate notification
    }

    // Additional throttling: prevent any notifications within 10 seconds of last notification
    const lastNotification = window.recentNotifications[0];
    if (lastNotification) {
        const timeSinceLast = now - lastNotification.timestamp;
        if (timeSinceLast < 10000) { // 10 seconds
            console.log(`[WebSocket] Notification throttled: too frequent (${Math.round(timeSinceLast/1000)}s since last)`);
            return;
        }
    }

    // Add to recent notifications list
    window.recentNotifications.push({
        key: notificationKey,
        timestamp: now
    });

    // Clean up old notifications (keep only last 10 minutes)
    window.recentNotifications = window.recentNotifications.filter(notification => {
        return (now - notification.timestamp) < 10 * 60 * 1000;
    });

    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    toast.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">${data.title || 'Update'}</div>
        <div style="font-size: 14px; opacity: 0.9;">${data.message || 'New update available'}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function showToast(message, type = 'info') {
    // Enhanced toast function
    const existing = document.getElementById('insurai-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'insurai-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.zIndex = '9999';
    toast.style.maxWidth = '320px';
    toast.style.padding = '12px 14px';
    toast.style.borderRadius = '10px';
    toast.style.color = '#fff';
    toast.style.fontFamily = 'Inter, sans-serif';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
    toast.style.opacity = '1';
    toast.style.transition = 'all 0.25s ease';

    if (type === 'success') {
        toast.style.background = 'linear-gradient(135deg, #10b981, #047857)';
    } else if (type === 'error') {
        toast.style.background = 'linear-gradient(135deg, #ef4444, #991b1b)';
    } else {
        toast.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
    }

    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        setTimeout(() => toast.remove(), 200);
    }, 2800);
}

// Dashboard initialization functions
function initRealtimeDashboard(dashboardType = 'dashboard') {
    if (!insurAIWebSocket) {
        insurAIWebSocket = new InsurAIWebSocket();
    }
    
    // Connect to appropriate endpoint
    switch (dashboardType) {
        case 'claims':
            insurAIWebSocket.connectToClaims();
            break;
        case 'policies':
            insurAIWebSocket.connectToPolicies();
            break;
        case 'fraud':
            insurAIWebSocket.connectToFraud();
            break;
        case 'notifications':
            insurAIWebSocket.connectToNotifications();
            break;
        default:
            insurAIWebSocket.connectToDashboard();
    }
    
    // Set up dashboard-specific handlers
    setupDashboardHandlers(dashboardType);
    
    console.log(`✅ Real-time dashboard initialized for: ${dashboardType}`);
}

function setupDashboardHandlers(dashboardType) {
    // Common handlers for all dashboards
    insurAIWebSocket.subscribe('claim', (data) => {
        handleClaimUpdate(data, dashboardType);
    });
    
    insurAIWebSocket.subscribe('policy', (data) => {
        handlePolicyUpdate(data, dashboardType);
    });
    
    insurAIWebSocket.subscribe('fraud', (data) => {
        handleFraudUpdate(data, dashboardType);
    });
    
    insurAIWebSocket.subscribe('notification', (data) => {
        handleNotificationUpdate(data, dashboardType);
    });
}

function handleClaimUpdate(data, dashboardType) {
    console.log(`🔄 ${dashboardType} dashboard: Claim update received`, data);
    
    // Broadcast to all dashboard-specific update functions
    if (typeof window.refreshDashboardData === 'function') {
        window.refreshDashboardData();
    }
    
    if (typeof window.loadDashboardKPIs === 'function') {
        window.loadDashboardKPIs();
    }
    
    if (typeof window.loadDashboardTable === 'function') {
        window.loadDashboardTable();
    }
    
    if (typeof window.loadClaimsData === 'function') {
        window.loadClaimsData();
    }
    
    // Dashboard-specific handlers
    if (dashboardType === 'underwriter' && typeof window.loadClaimRiskData === 'function') {
        window.loadClaimRiskData();
    }
    
    if (dashboardType === 'admin' && typeof window.loadFraudData === 'function') {
        window.loadFraudData();
    }
}

function handlePolicyUpdate(data, dashboardType) {
    console.log(`🔄 ${dashboardType} dashboard: Policy update received`, data);
    
    if (typeof window.refreshDashboardData === 'function') {
        window.refreshDashboardData();
    }
    
    if (typeof window.loadPoliciesData === 'function') {
        window.loadPoliciesData();
    }
}

function handleFraudUpdate(data, dashboardType) {
    console.log(`🚨 ${dashboardType} dashboard: Fraud update received`, data);
    
    if (typeof window.refreshDashboardData === 'function') {
        window.refreshDashboardData();
    }
    
    if (typeof window.loadFraudData === 'function') {
        window.loadFraudData();
    }
    
    if (typeof window.loadFraudAlerts === 'function') {
        window.loadFraudAlerts();
    }
}

function handleNotificationUpdate(data, dashboardType) {
    console.log(`🔔 ${dashboardType} dashboard: Notification received`, data);
    
    if (typeof window.loadNotifications === 'function') {
        window.loadNotifications();
    }
    
    if (typeof window.fetchNotifications === 'function') {
        window.fetchNotifications();
    }
}

// Auto-reconnect on page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && insurAIWebSocket) {
        console.log('🔄 Page visible, checking WebSocket connection');
        if (!insurAIWebSocket.isConnected) {
            insurAIWebSocket.connect();
        }
    }
});

// Export for use in other modules
window.InsurAIWebSocket = InsurAIWebSocket;
window.insurAIWebSocket = insurAIWebSocket;
window.initRealtimeDashboard = initRealtimeDashboard;