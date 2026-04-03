// dashboard-sync.js

let eventSource = null;
let dashboardSync = null;

// ✅ Initialize real-time sync
function initDashboardSync() {
    if (eventSource) {
        eventSource.close();
    }

    const API = window.API_HOST || window.__API_URL__ || 'https://insurai.railway.app';
    const sseUrl = `${API}/dashboard-updates`;
    eventSource = new EventSource(sseUrl);

    console.log('🔄 Connecting to real-time updates...');

    // ✅ When connection opens
    eventSource.onopen = () => {
        console.log('✅ Connected to SSE (dashboard-updates)');
    };

    // ✅ When message received
    eventSource.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('📡 Real-time update received:', data);

            handleRealtimeUpdate(data);

        } catch (err) {
            console.error('Error parsing SSE data:', err);
        }
    };

    // ❌ Error handling
    eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error);

        // Auto-reconnect after 5 sec
        setTimeout(() => {
            console.log('🔁 Reconnecting SSE...');
            initDashboardSync();
        }, 5000);
    };
}

// ✅ Initialize dashboard sync engine
function initRealtimeDashboard(dashboardType = 'user') {
    console.log(`🚀 Initializing real-time dashboard for ${dashboardType}`);
    
    dashboardSync = {
        events: new Map(),
        listeners: new Map(),
        
        // ✅ Initialize SSE connection
        initSSEConnection: (userId, callback) => {
            if (eventSource) {
                eventSource.close();
            }
            
            const sseUrl = `${API_BASE_URL}/dashboard-updates?userId=${userId}`;
            eventSource = new EventSource(sseUrl);
            
            eventSource.onopen = () => {
                console.log('✅ Dashboard SSE connected');
            };
            
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📡 Dashboard update:', data);
                    
                    // Call global callback if provided
                    if (callback) callback(data);
                    
                    // Emit to registered listeners
                    this.emit(data.type, data);
                    
                } catch (err) {
                    console.error('Error parsing dashboard SSE:', err);
                }
            };
            
            eventSource.onerror = (error) => {
                console.error('❌ Dashboard SSE error:', error);
                setTimeout(() => this.initSSEConnection(userId, callback), 5000);
            };
        },
        
        // ✅ Event system
        on: (eventType, callback) => {
            if (!dashboardSync.listeners.has(eventType)) {
                dashboardSync.listeners.set(eventType, []);
            }
            dashboardSync.listeners.get(eventType).push(callback);
        },
        
        emit: (eventType, data) => {
            const callbacks = dashboardSync.listeners.get(eventType) || [];
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error('Error in dashboard listener:', err);
                }
            });
        },
        
        // ✅ Cleanup
        destroy: () => {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
            }
            dashboardSync.listeners.clear();
        }
    };
    
    return dashboardSync;
}

/////////////////////////////////////////////////////
// 🔽 Handle real-time events
/////////////////////////////////////////////////////

async function handleRealtimeUpdate(data) {
    if (!data.type) return;

    switch (data.type) {

        case 'CLAIM_CREATED':
        case 'CLAIM_UPDATED':
            console.log('🔄 Refreshing claims...');
            await updateClaimsRealtime(data);
            break;

        case 'POLICY_UPDATED':
            console.log('🔄 Refreshing policies...');
            await updatePoliciesRealtime(data);
            break;

        case 'FRAUD_ALERT':
            console.log('🚨 Refreshing fraud alerts...');
            await updateFraudAlertsRealtime(data);
            break;

        case 'DECISION_MADE':
            console.log('📊 Refreshing decisions...');
            await updateDecisionsRealtime(data);
            break;

        case 'NOTIFICATION':
            console.log('🔔 New notification...');
            await updateNotificationsRealtime(data);
            break;

        case 'ACTIVITY_UPDATE':
            console.log('📈 Refreshing activity...');
            await updateActivityRealtime(data);
            break;

        default:
            console.log('⚠️ Unknown event type:', data.type);
    }
}

/////////////////////////////////////////////////////
// 🔽 Real-time UI updates
/////////////////////////////////////////////////////

// ✅ Update claims in real-time
async function updateClaimsRealtime(data) {
    try {
        // Refresh claims table
        const claims = await fetchClaims();
        if (claims && claims.length > 0) {
            updateClaimsTable(claims);
            updateClaimStats(claims);
            renderClaimTimeline(claims);
        }
        
        // Update recent activity
        await updateActivityRealtime({ type: 'CLAIM_UPDATED', data });
        
    } catch (error) {
        console.error('Error updating claims:', error);
    }
}

// ✅ Update policies in real-time
async function updatePoliciesRealtime(data) {
    try {
        // Refresh policy summary
        const policies = await fetchPolicies();
        if (policies) {
            updatePolicySummary(policies);
        }
        
    } catch (error) {
        console.error('Error updating policies:', error);
    }
}

// ✅ Update fraud alerts in real-time
async function updateFraudAlertsRealtime(data) {
    try {
        // Refresh fraud alerts
        const alerts = await fetchFraudAlerts();
        if (alerts) {
            updateFraudAlertsUI(alerts);
        }
        
    } catch (error) {
        console.error('Error updating fraud alerts:', error);
    }
}

// ✅ Update decisions in real-time
async function updateDecisionsRealtime(data) {
    try {
        // Refresh decision trends
        const decisions = await fetchDecisions();
        if (decisions) {
            updateDecisionTrends(decisions);
        }
        
        // Update recent activity
        await updateActivityRealtime({ type: 'DECISION_MADE', data });
        
    } catch (error) {
        console.error('Error updating decisions:', error);
    }
}

// ✅ Update notifications in real-time
async function updateNotificationsRealtime(data) {
    try {
        // Refresh notifications
        const notifications = await fetchNotificationsAPI();
        if (notifications) {
            updateNotificationsUI(notifications);
        }
        
    } catch (error) {
        console.error('Error updating notifications:', error);
    }
}

// ✅ Update activity in real-time
async function updateActivityRealtime(data) {
    try {
        // Refresh recent activity
        const claims = await fetchClaims();
        if (claims) {
            renderRecentActivity(claims);
        }
        
    } catch (error) {
        console.error('Error updating activity:', error);
    }
}

/////////////////////////////////////////////////////
// 🔽 Helper functions for UI updates
/////////////////////////////////////////////////////

// ✅ Update claims table
function updateClaimsTable(claims) {
    const tbody = document.getElementById('claimsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (!claims || claims.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-title">No Claims Yet</div>
                        <div class="empty-state-text">You haven't filed any claims. <a href="submit-claim.html" style="color: #3b82f6; text-decoration: none; font-weight: 600;">File a claim</a></div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    claims.forEach((claim, index) => {
        const rawStatus = (claim.status || 'PENDING').toUpperCase();
        const displayStatus = rawStatus.charAt(0) + rawStatus.slice(1).toLowerCase();
        claim.displayStatus = displayStatus;

        const normalizedRiskScore = typeof window.calculateRiskScore === 'function' ? calculateRiskScore(claim) : (claim.riskScore || 0);
        const normalizedRiskLevel = typeof window.riskLevelFromScore === 'function' ? riskLevelFromScore(normalizedRiskScore) : (claim.riskLevel || 'MEDIUM');
        claim.riskScore = normalizedRiskScore;
        claim.riskLevel = normalizedRiskLevel;

        const statusClass = 'status-' + (claim.displayStatus || 'pending').toLowerCase();
        const riskClass = 'risk-' + (normalizedRiskLevel || 'medium').toLowerCase();

        const row = document.createElement('tr');
        row.style.animation = 'slideIn 0.4s ease-out forwards';
        row.style.animationDelay = `${index * 0.05}s`;
        row.dataset.claimIndex = index;
        row.innerHTML = `
            <td>${claim.id ? (claim.id.toString().startsWith('CLM-') ? claim.id : 'CLM-' + claim.id) : 'N/A'}</td>
            <td>${claim.type || claim.claimType || 'N/A'}</td>
            <td>₹${((claim.amount || claim.claimAmount || 0)).toLocaleString()}</td>
            <td>${new Date(claim.createdDate || claim.date || Date.now()).toLocaleDateString()}</td>
            <td><span class="status-badge ${statusClass}">${claim.displayStatus || 'Pending'}</span></td>
            <td><span class="status-badge ${riskClass}">${claim.riskScore || 'Medium'}</span></td>
        `;

        row.addEventListener('click', () => {
            selectClaimRow(row);
            renderClaimProgress(claim);
        });

        tbody.appendChild(row);
    });

    // Select first claim by default
    const firstRow = tbody.querySelector('tr');
    if (firstRow) {
        selectClaimRow(firstRow);
        const firstIndex = parseInt(firstRow.dataset.claimIndex, 10);
        renderClaimProgress(claims[firstIndex]);
    }
}

// ✅ Update claim stats
function updateClaimStats(claims) {
    const totalClaims = claims.length;
    const approvedClaims = claims.filter(c => (c.status || '').toUpperCase() === 'APPROVED').length;
    const pendingClaims = claims.filter(c => (c.status || '').toUpperCase() === 'PENDING').length;
    const rejectedClaims = claims.filter(c => (c.status || '').toUpperCase() === 'REJECTED').length;

    updateStatValue('totalClaims', totalClaims);
    updateStatValue('approvedClaims', approvedClaims);
    updateStatValue('pendingClaims', pendingClaims);
    updateStatValue('rejectedClaims', rejectedClaims);
}

// ✅ Update policy summary
function updatePolicySummary(policies) {
    const totalPoliciesEl = document.getElementById('totalPolicies');
    const activeCoverageEl = document.getElementById('activeCoverage');
    const expiringEl = document.getElementById('expiringSoon');
    
    if (totalPoliciesEl) totalPoliciesEl.textContent = policies.activePolicies || 0;
    if (activeCoverageEl) activeCoverageEl.textContent = '₹' + ((policies.totalCoverage || 0)/1000).toFixed(1) + 'k';
    if (expiringEl) expiringEl.textContent = policies.expiringPolicies || 0;
}

// ✅ Update fraud alerts UI
function updateFraudAlertsUI(alerts) {
    const container = document.getElementById('fraudAlertsContainer');
    if (!container) return;

    if (!alerts || alerts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">No fraud alerts</p>';
        return;
    }

    const alertsHTML = alerts.map(alert => `
        <div style="padding: 15px; background: #fef2f2; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #ef4444;">
            <h4 style="font-size: 16px; font-weight: 600; color: #1a202c; margin-bottom: 5px;">${alert.title || 'Fraud Alert'}</h4>
            <p style="font-size: 14px; color: #718096; margin-bottom: 8px;">${alert.description || 'Suspicious activity detected'}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; color: #991b1b; font-weight: 500;">${alert.severity || 'HIGH'}</span>
                <span style="font-size: 12px; color: #718096;">${new Date(alert.timestamp || Date.now()).toLocaleString()}</span>
            </div>
        </div>
    `).join('');

    container.innerHTML = alertsHTML;
}

// ✅ Update decision trends
function updateDecisionTrends(decisions) {
    const container = document.getElementById('decisionTrends');
    if (!container) return;

    if (!decisions || decisions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">No decisions yet</p>';
        return;
    }

    // Calculate trends
    const approved = decisions.filter(d => d.status === 'APPROVED').length;
    const rejected = decisions.filter(d => d.status === 'REJECTED').length;
    const pending = decisions.filter(d => d.status === 'PENDING').length;
    const total = decisions.length;

    const trendsHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
            <div style="padding: 15px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
                <h4 style="font-size: 14px; color: #065f46; margin-bottom: 5px;">Approved</h4>
                <p style="font-size: 20px; font-weight: 700; color: #065f46;">${approved}</p>
                <p style="font-size: 12px; color: #065f46;">${total > 0 ? Math.round((approved/total)*100) : 0}%</p>
            </div>
            <div style="padding: 15px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
                <h4 style="font-size: 14px; color: #991b1b; margin-bottom: 5px;">Rejected</h4>
                <p style="font-size: 20px; font-weight: 700; color: #991b1b;">${rejected}</p>
                <p style="font-size: 12px; color: #991b1b;">${total > 0 ? Math.round((rejected/total)*100) : 0}%</p>
            </div>
            <div style="padding: 15px; background: #fff7ed; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <h4 style="font-size: 14px; color: #92400e; margin-bottom: 5px;">Pending</h4>
                <p style="font-size: 20px; font-weight: 700; color: #92400e;">${pending}</p>
                <p style="font-size: 12px; color: #92400e;">${total > 0 ? Math.round((pending/total)*100) : 0}%</p>
            </div>
        </div>
        <div style="text-align: center; color: #718096; font-size: 12px;">
            Last updated: ${new Date().toLocaleString()}
        </div>
    `;

    container.innerHTML = trendsHTML;
}

// ✅ Update notifications UI
function updateNotificationsUI(notifications) {
    const container = document.getElementById('notificationsContent');
    const countEl = document.getElementById('notificationCount');
    
    if (!container || !countEl) return;

    if (!notifications || notifications.length === 0) {
        container.innerHTML = '<div class="notifications-empty">No notifications</div>';
        countEl.textContent = '0';
        return;
    }

    const unreadCount = notifications.filter(n => !n.read).length;
    countEl.textContent = unreadCount.toString();

    const notificationsHTML = notifications.map(notification => `
        <div class="notification-item ${!notification.read ? 'unread' : ''}">
            <div class="notification-icon">
                <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-title">${notification.title || 'Notification'}</div>
            <div class="notification-message">${notification.message || ''}</div>
            <div class="notification-time">${new Date(notification.timestamp || notification.createdAt || Date.now()).toLocaleString()}</div>
        </div>
    `).join('');

    container.innerHTML = notificationsHTML;
}

// ✅ Helper functions
function getNotificationIcon(type) {
    const icons = {
        'CLAIM_STATUS': 'file-alt',
        'POLICY_RENEWAL': 'calendar-alt',
        'FRAUD_ALERT': 'exclamation-triangle',
        'DECISION': 'check-circle',
        'SYSTEM': 'bell'
    };
    return icons[type] || 'bell';
}

function selectClaimRow(row) {
    const rows = row.parentElement?.querySelectorAll('tr');
    rows?.forEach(r => r.style.background = '');
    row.style.background = 'rgba(59, 130, 246, 0.12)';
}

function updateStatValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = value;
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = 'slideIn 0.5s ease-out';
        }, 10);
    }
}

// ✅ Expose functions globally
window.dashboardSync = dashboardSync;
window.updateClaimsRealtime = updateClaimsRealtime;
window.updateActivityRealtime = updateActivityRealtime;
window.updateDecisionsRealtime = updateDecisionsRealtime;
