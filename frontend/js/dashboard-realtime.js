// Dashboard Real-time Synchronization System
// Integrates WebSocket, SSE, and BroadcastChannel for comprehensive real-time updates

let dashboardRealtime = {
    // Configuration
    config: {
        sseUrl: `${window.API_BASE_URL || 'http://localhost:8080/api'}/dashboard-updates`,
        wsUrl: `ws://localhost:8080/ws/dashboard`,
        reconnectInterval: 5000,
        updateInterval: 30000, // 30 seconds for polling fallback
        maxRetries: 5
    },

    // State
    state: {
        isConnected: false,
        isSSEConnected: false,
        isWSConnected: false,
        retryCount: 0,
        lastUpdate: null,
        listeners: new Map(),
        channels: new Map()
    },

    // Initialize real-time system
    init(dashboardType = 'user') {
        console.log(`🚀 Initializing real-time dashboard for ${dashboardType}`);
        
        this.state.dashboardType = dashboardType;
        this.setupEventListeners();
        this.connectSSE();
        this.connectWebSocket();
        this.setupBroadcastChannels();
        this.startPolling();
        
        // Listen for auth changes
        this.setupAuthListeners();
        
        return this;
    },

    // Setup global event listeners
    setupEventListeners() {
        // Window focus/visibility events
        window.addEventListener('focus', () => this.handleWindowFocus());
        window.addEventListener('visibilitychange', () => {
            if (!document.hidden) this.handleWindowFocus();
        });

        // Network status changes
        window.addEventListener('online', () => this.handleNetworkChange(true));
        window.addEventListener('offline', () => this.handleNetworkChange(false));

        // Storage events for cross-tab communication
        window.addEventListener('storage', (event) => {
            this.handleStorageEvent(event);
        });

        // Custom events
        window.addEventListener('dashboardUpdate', (event) => {
            this.handleCustomEvent(event);
        });
    },

    // Setup BroadcastChannel for cross-tab communication
    setupBroadcastChannels() {
        try {
            // Main dashboard channel
            if (typeof BroadcastChannel !== 'undefined') {
                const dashboardChannel = new BroadcastChannel('dashboard-updates');
                dashboardChannel.onmessage = (event) => {
                    this.handleBroadcastMessage(event.data, 'dashboard');
                };
                this.state.channels.set('dashboard', dashboardChannel);

                // Claim updates channel
                const claimChannel = new BroadcastChannel('claim-updates');
                claimChannel.onmessage = (event) => {
                    this.handleBroadcastMessage(event.data, 'claim');
                };
                this.state.channels.set('claim', claimChannel);

                // Notification channel
                const notificationChannel = new BroadcastChannel('notifications');
                notificationChannel.onmessage = (event) => {
                    this.handleBroadcastMessage(event.data, 'notification');
                };
                this.state.channels.set('notification', notificationChannel);

                console.log('📡 BroadcastChannels initialized');
            }
        } catch (error) {
            console.warn('BroadcastChannel not supported:', error);
        }
    },

    // Connect to Server-Sent Events
    connectSSE() {
        if (this.state.sseSource) {
            this.state.sseSource.close();
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('No auth token for SSE connection');
            return;
        }

        try {
            const url = `${this.config.sseUrl}?type=${this.state.dashboardType}&token=${encodeURIComponent(token)}`;
            this.state.sseSource = new EventSource(url);

            this.state.sseSource.onopen = () => {
                console.log('✅ SSE connected');
                this.state.isSSEConnected = true;
                this.state.retryCount = 0;
                this.state.lastUpdate = new Date();
                this.emit('connection', { type: 'sse', status: 'connected' });
            };

            this.state.sseSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📡 SSE message received:', data);
                    this.handleRealtimeUpdate(data);
                } catch (err) {
                    console.error('Error parsing SSE data:', err);
                }
            };

            this.state.sseSource.onerror = (error) => {
                console.error('❌ SSE error:', error);
                this.state.isSSEConnected = false;
                this.emit('connection', { type: 'sse', status: 'error' });
                
                // Attempt reconnection
                if (this.state.retryCount < this.config.maxRetries) {
                    this.state.retryCount++;
                    setTimeout(() => this.connectSSE(), this.config.reconnectInterval);
                }
            };

        } catch (error) {
            console.error('Failed to create SSE connection:', error);
        }
    },

    // Connect to WebSocket
    connectWebSocket() {
        if (this.state.ws) {
            this.state.ws.close();
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('No auth token for WebSocket connection');
            return;
        }

        try {
            const wsUrl = this.config.wsUrl + `?token=${encodeURIComponent(token)}`;
            this.state.ws = new WebSocket(wsUrl);

            this.state.ws.onopen = () => {
                console.log('🔗 WebSocket connected');
                this.state.isWSConnected = true;
                this.state.retryCount = 0;
                this.state.lastUpdate = new Date();
                this.emit('connection', { type: 'websocket', status: 'connected' });
            };

            this.state.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('🔗 WebSocket message received:', data);
                    this.handleRealtimeUpdate(data);
                } catch (err) {
                    console.error('Error parsing WebSocket data:', err);
                }
            };

            this.state.ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.state.isWSConnected = false;
                this.emit('connection', { type: 'websocket', status: 'disconnected' });
                
                // Attempt reconnection
                if (this.state.retryCount < this.config.maxRetries) {
                    this.state.retryCount++;
                    setTimeout(() => this.connectWebSocket(), this.config.reconnectInterval);
                }
            };

            this.state.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.state.isWSConnected = false;
                this.emit('connection', { type: 'websocket', status: 'error' });
            };

        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    },

    // Start polling as fallback
    startPolling() {
        if (this.state.pollingInterval) {
            clearInterval(this.state.pollingInterval);
        }

        this.state.pollingInterval = setInterval(async () => {
            if (!this.state.isSSEConnected && !this.state.isWSConnected) {
                console.log('🔄 Polling for updates...');
                await this.pollForUpdates();
            }
        }, this.config.updateInterval);
    },

    // Poll for updates when real-time connections fail
    async pollForUpdates() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${this.config.sseUrl}/poll`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.updates && data.updates.length > 0) {
                    data.updates.forEach(update => this.handleRealtimeUpdate(update));
                }
            }
        } catch (error) {
            console.error('Polling failed:', error);
        }
    },

    // Handle real-time updates
    handleRealtimeUpdate(data) {
        if (!data || !data.type) return;

        this.state.lastUpdate = new Date();
        this.emit('update', data);

        // Broadcast to other tabs
        this.broadcastToOtherTabs(data);

        // Handle specific update types
        switch (data.type) {
            case 'CLAIM_CREATED':
            case 'CLAIM_UPDATED':
                this.handleClaimUpdate(data);
                break;

            case 'CLAIM_STATUS_CHANGED':
                this.handleClaimStatusChange(data);
                break;

            case 'POLICY_UPDATED':
                this.handlePolicyUpdate(data);
                break;

            case 'NOTIFICATION':
                this.handleNotification(data);
                break;

            case 'FRAUD_ALERT':
                this.handleFraudAlert(data);
                break;

            case 'DECISION_MADE':
                this.handleDecision(data);
                break;

            case 'ACTIVITY_UPDATE':
                this.handleActivityUpdate(data);
                break;

            default:
                console.log('⚠️ Unknown update type:', data.type);
        }
    },

    // Handle claim updates
    handleClaimUpdate(data) {
        console.log('📋 Claim update:', data);
        this.emit('claimUpdate', data);
        
        // Update UI if on claims page
        if (typeof updateClaimsRealtime === 'function') {
            updateClaimsRealtime(data);
        }
        
        // Refresh dashboard stats
        if (typeof refreshDashboard === 'function') {
            refreshDashboard();
        }
    },

    // Handle claim status changes
    handleClaimStatusChange(data) {
        console.log('📊 Claim status changed:', data);
        this.emit('claimStatusChange', data);
        
        // Update claim row in table
        this.updateClaimTableRow(data);
        
        // Show notification
        this.showNotification({
            title: `Claim ${data.claimId} Status Updated`,
            message: `Status changed to: ${data.status}`,
            type: 'claim'
        });

        // Broadcast to other tabs
        this.broadcastClaimStatusChange(data);
    },

    // Handle policy updates
    handlePolicyUpdate(data) {
        console.log('📄 Policy update:', data);
        this.emit('policyUpdate', data);
        
        // Update policy summary
        if (typeof updatePolicySummary === 'function') {
            updatePolicySummary(data);
        }
    },

    // Handle notifications
    handleNotification(data) {
        console.log('🔔 Notification:', data);
        this.emit('notification', data);
        
        // Add to notification list
        if (typeof addNotificationToList === 'function') {
            addNotificationToList(data);
        }
        
        // Show toast notification
        this.showToastNotification(data);
    },

    // Handle fraud alerts
    handleFraudAlert(data) {
        console.log('🚨 Fraud alert:', data);
        this.emit('fraudAlert', data);
        
        // Update fraud alerts UI
        if (typeof updateFraudAlertsUI === 'function') {
            updateFraudAlertsUI(data);
        }
        
        // Show urgent notification
        this.showUrgentNotification(data);
    },

    // Handle decisions
    handleDecision(data) {
        console.log('✅ Decision made:', data);
        this.emit('decision', data);
        
        // Update decision trends
        if (typeof updateDecisionTrends === 'function') {
            updateDecisionTrends(data);
        }
        
        // Update activity
        if (typeof updateActivityRealtime === 'function') {
            updateActivityRealtime(data);
        }
    },

    // Handle activity updates
    handleActivityUpdate(data) {
        console.log('📈 Activity update:', data);
        this.emit('activityUpdate', data);
        
        // Update recent activity
        if (typeof renderRecentActivity === 'function') {
            renderRecentActivity(data.claims || []);
        }
    },

    // Update claim table row
    updateClaimTableRow(data) {
        const tbody = document.getElementById('claimsTableBody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const claimIdCell = row.querySelector('td:first-child');
            if (claimIdCell && claimIdCell.textContent.includes(data.claimId)) {
                // Update status cell
                const statusCell = row.querySelector('td:nth-child(5)');
                if (statusCell) {
                    const statusClass = 'status-' + (data.status || 'pending').toLowerCase();
                    statusCell.innerHTML = `<span class="status-badge ${statusClass}">${data.status || 'Pending'}</span>`;
                }
                
                // Add animation
                row.style.animation = 'none';
                row.style.background = 'rgba(59, 130, 246, 0.12)';
                setTimeout(() => {
                    row.style.background = '';
                    row.style.animation = 'slideIn 0.4s ease-out forwards';
                }, 1000);
            }
        });
    },

    // Broadcast to other tabs
    broadcastToOtherTabs(data) {
        try {
            // BroadcastChannel
            if (typeof BroadcastChannel !== 'undefined') {
                const channel = new BroadcastChannel('dashboard-updates');
                channel.postMessage(data);
                channel.close();
            }

            // localStorage fallback
            localStorage.setItem('dashboardUpdate', JSON.stringify({
                ...data,
                timestamp: Date.now()
            }));
            
            // Clear after broadcasting
            setTimeout(() => {
                localStorage.removeItem('dashboardUpdate');
            }, 1000);

        } catch (error) {
            console.error('Broadcast failed:', error);
        }
    },

    // Broadcast claim status change
    broadcastClaimStatusChange(data) {
        try {
            // BroadcastChannel
            if (typeof BroadcastChannel !== 'undefined') {
                const channel = new BroadcastChannel('claim-updates');
                channel.postMessage(data);
                channel.close();
            }

            // localStorage fallback
            localStorage.setItem('claimStatusChanged', JSON.stringify(data));
            
            // Custom event
            window.dispatchEvent(new CustomEvent('claimStatusChanged', { detail: data }));

        } catch (error) {
            console.error('Claim status broadcast failed:', error);
        }
    },

    // Show toast notification
    showToastNotification(data) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #3b82f6;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;
        
        toast.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">${data.title || 'Notification'}</div>
            <div style="font-size: 12px; color: #718096;">${data.message || ''}</div>
        `;

        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    // Show urgent notification
    showUrgentNotification(data) {
        const urgentToast = document.createElement('div');
        urgentToast.className = 'urgent-notification';
        urgentToast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee2e2;
            border: 1px solid #fecaca;
            border-left: 4px solid #ef4444;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            z-index: 9999;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            color: #991b1b;
        `;
        
        urgentToast.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 4px;">🚨 ${data.title || 'Fraud Alert'}</div>
            <div style="font-size: 12px;">${data.message || 'Suspicious activity detected'}</div>
        `;

        document.body.appendChild(urgentToast);

        // Auto remove after 8 seconds
        setTimeout(() => {
            urgentToast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => urgentToast.remove(), 300);
        }, 8000);
    },

    // Event system
    on(eventType, callback) {
        if (!this.state.listeners.has(eventType)) {
            this.state.listeners.set(eventType, []);
        }
        this.state.listeners.get(eventType).push(callback);
    },

    off(eventType, callback) {
        if (this.state.listeners.has(eventType)) {
            const callbacks = this.state.listeners.get(eventType);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    },

    emit(eventType, data) {
        if (this.state.listeners.has(eventType)) {
            const callbacks = this.state.listeners.get(eventType);
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error('Error in event listener:', err);
                }
            });
        }
    },

    // Event handlers
    handleWindowFocus() {
        console.log('👁️ Window focused, refreshing dashboard');
        if (typeof refreshDashboard === 'function') {
            refreshDashboard();
        }
    },

    handleNetworkChange(isOnline) {
        console.log(`🌐 Network status: ${isOnline ? 'online' : 'offline'}`);
        if (isOnline) {
            // Attempt to reconnect
            if (!this.state.isSSEConnected) this.connectSSE();
            if (!this.state.isWSConnected) this.connectWebSocket();
        }
    },

    handleStorageEvent(event) {
        if (event.key === 'dashboardUpdate' && event.newValue) {
            try {
                const data = JSON.parse(event.newValue);
                this.handleRealtimeUpdate(data);
            } catch (err) {
                console.error('Error parsing storage event:', err);
            }
        }
    },

    handleCustomEvent(event) {
        this.handleRealtimeUpdate(event.detail);
    },

    handleBroadcastMessage(data, channel) {
        console.log(`📡 Broadcast message from ${channel}:`, data);
        this.handleRealtimeUpdate(data);
    },

    // Auth listeners
    setupAuthListeners() {
        // Listen for auth token changes
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            if (key === 'authToken') {
                dashboardRealtime.handleAuthTokenChange(value);
            }
            return originalSetItem.apply(this, arguments);
        };
    },

    handleAuthTokenChange(token) {
        console.log('🔑 Auth token changed, reconnecting...');
        this.state.retryCount = 0;
        this.connectSSE();
        this.connectWebSocket();
    },

    // Cleanup
    destroy() {
        // Close connections
        if (this.state.sseSource) {
            this.state.sseSource.close();
            this.state.sseSource = null;
        }
        
        if (this.state.ws) {
            this.state.ws.close();
            this.state.ws = null;
        }

        // Clear intervals
        if (this.state.pollingInterval) {
            clearInterval(this.state.pollingInterval);
            this.state.pollingInterval = null;
        }

        // Close channels
        this.state.channels.forEach(channel => {
            try {
                channel.close();
            } catch (err) {
                console.error('Error closing channel:', err);
            }
        });
        this.state.channels.clear();

        // Clear listeners
        this.state.listeners.clear();

        console.log('🧹 Real-time dashboard destroyed');
    }
};

// CSS for toast notifications
const toastStyles = `
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

.toast-notification, .urgent-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    max-width: 300px;
    animation: slideInRight 0.3s ease-out;
}

.urgent-notification {
    background: #fee2e2;
    border-color: #fecaca;
    border-left-color: #ef4444;
    color: #991b1b;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = toastStyles;
    document.head.appendChild(style);
}

// Auto-initialize if on dashboard page
if (typeof window !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Check if we're on a dashboard page
        const isDashboard = window.location.pathname.includes('dashboard') || 
                           window.location.pathname.includes('user-dashboard') ||
                           window.location.pathname.includes('admin-dashboard') ||
                           window.location.pathname.includes('underwriter-dashboard');
        
        if (isDashboard) {
            // Initialize after other scripts load
            setTimeout(() => {
                if (typeof dashboardRealtime !== 'undefined') {
                    dashboardRealtime.init(window.dashboardType || 'user');
                }
            }, 100);
        }
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dashboardRealtime;
}

export default dashboardRealtime;