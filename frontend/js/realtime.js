// Real-time and utility helpers for InsurAI customer portal

// Set API base from global environment override or production fallback.
window.API_HOST = window.__API_URL__ || 'https://insurai-lhup.onrender.com';
window.API_BASE_URL = window.API_BASE_URL || `${window.API_HOST}/api`;

function getToken() {
    return localStorage.getItem('authToken');
}

function getUserEmail() {
    return localStorage.getItem('userEmail');
}

function showToast(message, type = 'info') {
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

async function apiRequestRealtime(endpoint, method = 'GET', body = null, extraHeaders = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...extraHeaders
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body !== null ? JSON.stringify(body) : undefined
    });

    if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        showToast('Session expired, redirecting to login...', 'error');
        setTimeout(() => window.location.href = '/login.html', 1200);
        throw new Error('Unauthorized');
    }

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    }

    if (!response.ok) {
        const message = data && (data.message || data.error) ? (data.message || data.error) : `HTTP ${response.status}`;
        throw new Error(message);
    }

    return data;
}

function broadcastLocalUpdate(type, payload = {}) {
    const event = { type, payload, timestamp: new Date().toISOString() };
    try {
        localStorage.setItem('insurai_update_event', JSON.stringify(event));
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('insurai-updates');
            channel.postMessage(event);
            channel.close();
        }
    } catch (e) {
        console.warn('broadcastLocalUpdate failed', e);
    }
}

function listenForUpdates(onEvent) {
    window.addEventListener('storage', (ev) => {
        if (ev.key === 'insurai_update_event' && ev.newValue) {
            try {
                const payload = JSON.parse(ev.newValue);
                if (onEvent) onEvent(payload);
            } catch (e) {
                console.error('Invalid localStorage update payload', e);
            }
        }
    });

    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('insurai-updates');
        channel.onmessage = (ev) => {
            if (onEvent) onEvent(ev.data);
        };
    }
}

if (typeof window.realtimeEmitter === 'undefined') {
    window.realtimeEmitter = null;
}

function initRealtimeUpdates(onEvent) {
    const token = getToken();
    if (!token) return;

    const sseUrl = `${API_BASE_URL.replace(/\/?$/, '')}/notifications/stream?token=${encodeURIComponent(token)}`;

    if (realtimeEmitter) {
        realtimeEmitter.close();
    }

    try {
        realtimeEmitter = new EventSource(sseUrl);

        realtimeEmitter.addEventListener('open', () => {
            console.log('[Realtime] SSE connected', sseUrl);
        });

        // Global refresh func should exist for console/manual trigger
        window.refreshUnderwriterData = window.refreshUnderwriterData || function() {
            console.log('[Realtime] global refresh triggered');
            if (typeof loadDashboardKPIs === 'function') loadDashboardKPIs();
            if (typeof loadDashboardTable === 'function') loadDashboardTable();
            if (typeof loadClaimRiskData === 'function') loadClaimRiskData();
            if (typeof loadFraudAlerts === 'function') loadFraudAlerts();
            if (typeof loadDecisionHistoryData === 'function') loadDecisionHistoryData();
            if (typeof fetchUnderwriterClaims === 'function') fetchUnderwriterClaims();
            if (typeof fetchNotifications === 'function') fetchNotifications();
        };

        // Enhanced storage event handling for user dashboards
        window.addEventListener('storage', (ev) => {
            if (ev.key && ['insurai_update_event', 'insurai_updates', 'claimStatusChanged', 'approvedClaims', 'rejectedClaims'].includes(ev.key)) {
                console.log('[Realtime] storage event refresh', ev.key);
                window.refreshUnderwriterData();
                
                // Also refresh user dashboard data
                if (typeof loadClaims === 'function') {
                    loadClaims();
                }
                if (typeof loadPolicies === 'function') {
                    loadPolicies();
                }
                if (typeof loadNotifications === 'function') {
                    loadNotifications();
                }
            }
        });

        if (typeof BroadcastChannel !== 'undefined') {
            const broadcastChannel = new BroadcastChannel('insurai-updates');
            broadcastChannel.onmessage = (ev) => {
                if (ev && ev.data && ev.data.type) {
                    const t = ev.data.type;
                    if (['claimSubmitted', 'claimStatusChanged', 'claimUpdated'].includes(t)) {
                        console.log('[Realtime] broadcast update', t);
                        window.refreshUnderwriterData();
                        
                        // Also refresh user dashboard data
                        if (typeof loadClaims === 'function') {
                            loadClaims();
                        }
                        if (typeof loadPolicies === 'function') {
                            loadPolicies();
                        }
                        if (typeof loadNotifications === 'function') {
                            loadNotifications();
                        }
                    }
                }
            };
        }

        if (typeof window.refreshUnderwriterData !== 'function') {
        window.refreshUnderwriterData = async function() {
            console.log('[Realtime] fallback refreshUnderwriterData called');

            // Existing loader methods (if present)
            try {
                if (typeof loadDashboardKPIs === 'function') await loadDashboardKPIs();
                if (typeof loadDashboardTable === 'function') await loadDashboardTable();
                if (typeof loadClaimRiskData === 'function') await loadClaimRiskData();
                if (typeof loadFraudAlerts === 'function') await loadFraudAlerts();
                if (typeof loadDecisionHistoryData === 'function') await loadDecisionHistoryData();
            } catch (e) {
                console.warn('[Realtime] error from page loader functions', e);
            }

            // Make sure the 2 key panels are updated
            try {
                if (typeof updateRiskAnalytics === 'function') {
                    updateRiskAnalytics(window.underwriterClaimsCache || []);
                }
                if (typeof updateRiskScoreDistribution === 'function') {
                    updateRiskScoreDistribution();
                }
                if (typeof updateHighRiskClaimsOverTime === 'function') {
                    updateHighRiskClaimsOverTime();
                }
                if (typeof updateDepartmentRiskChart === 'function') {
                    updateDepartmentRiskChart();
                }
                if (typeof updateClaimsRiskDistribution === 'function') {
                    updateClaimsRiskDistribution();
                }
                if (typeof refreshFraudAlerts === 'function') {
                    await refreshFraudAlerts();
                }
                if (typeof updateFraudAlertsRealTime === 'function') {
                    updateFraudAlertsRealTime();
                }

                if (typeof refreshRiskAnalyticsCharts === 'function') {
                    refreshRiskAnalyticsCharts();
                }
            } catch (e) {
                console.warn('[Realtime] chart/fraud update error', e);
            }

            // Fallback direct API and DOM updates if page loader not available
            try {
                const claims = await apiRequestRealtime('/claims/underwriter');
                if (claims && Array.isArray(claims)) {
                    const table = document.getElementById('dashboardTableBody');
                    if (table) {
                        table.innerHTML = '';
                        claims.slice(0, 10).forEach(claim => {
                            const riskScore = window.calculateRiskScore ? calculateRiskScore(claim) : (claim.riskScore || 0);
                            const riskLevel = window.riskLevelFromScore ? riskLevelFromScore(riskScore) : (claim.riskLevel || 'MEDIUM');
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${claim.id || '-'}</td>
                                <td>${claim.type || '-'}</td>
                                <td>${claim.userId || '-'}</td>
                                <td>$${Number(claim.amount || 0).toLocaleString()}</td>
                                <td>${riskLevel} (${riskScore})</td>
                                <td>${claim.status || 'PENDING'}</td>
                                <td>${claim.createdDate ? new Date(claim.createdDate).toLocaleDateString() : '-'}</td>
                            `;
                            table.appendChild(row);
                        });
                    }

                    const history = document.getElementById('historyTableBody');
                    if (history) {
                        history.innerHTML = '';
                        claims.slice(0, 15).forEach(claim => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${claim.id}</td>
                                <td>${claim.type || '-'}</td>
                                <td>${claim.userId || '-'}</td>
                                <td>$${Number(claim.amount || 0).toLocaleString()}</td>
                                <td>${claim.riskLevel || '-'}</td>
                                <td>${claim.status || '-'}</td>
                                <td>${claim.underwriterNotes || 'N/A'}</td>
                                <td>${claim.updatedDate ? new Date(claim.updatedDate).toLocaleString() : '-'}</td>
                            `;
                            history.appendChild(row);
                        });
                    }
                }
            } catch (err) {
                console.warn('[Realtime] fallback claims refresh failed', err);
            }

            try {
                const fraud = await apiRequestRealtime('/api/ai/fraud-alerts');
                if (fraud && Array.isArray(fraud)) {
                    const fraudTable = document.getElementById('fraudTableBody');
                    if (fraudTable) {
                        fraudTable.innerHTML = '';
                        fraud.slice(0, 10).forEach(f => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${f.id || '-'}</td>
                                <td>${f.claimId || '-'}</td>
                                <td>${f.claimAmount || '-'}</td>
                                <td>${f.riskScore || '-'}</td>
                                <td>${f.status || '-'}</td>
                                <td>${f.reason || '-'}</td>
                            `;
                            fraudTable.appendChild(row);
                        });
                    }
                }
            } catch (err) {
                console.warn('[Realtime] fallback fraud refresh failed', err);
            }

            try {
                const pol = await apiRequestRealtime('/api/policies/review');
                if (pol && Array.isArray(pol)) {
                    const policyTable = document.getElementById('policyTableBody');
                    if (policyTable) {
                        policyTable.innerHTML = '';
                        pol.slice(0, 10).forEach(p => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${p.id || '-'}</td>
                                <td>${p.customerName || '-'}</td>
                                <td>${p.department || '-'}</td>
                                <td>$${p.coverage || '0'}</td>
                                <td>${p.riskScore || '-'}</td>
                                <td>${p.submitted || '-'}</td>
                                <td>${p.status || '-'}</td>
                            `;
                            policyTable.appendChild(row);
                        });
                    }
                }
            } catch (err) {
                console.warn('[Realtime] fallback policy refresh failed', err);
            }

            // Update real-time charts including Claims Risk Distribution
            try {
                if (typeof updateClaimsRiskDistribution === 'function') {
                    updateClaimsRiskDistribution();
                }
                if (typeof updateClaimsRiskTrend === 'function') {
                    updateClaimsRiskTrend();
                }
                if (typeof renderUrgentClaims === 'function') {
                    renderUrgentClaims();
                }
                if (typeof updateFraudTrendAnalysis === 'function') {
                    updateFraudTrendAnalysis();
                }
                if (typeof updateDepartmentRiskChart === 'function') {
                    updateDepartmentRiskChart();
                }
                if (typeof updateDecisionTrends === 'function') {
                    updateDecisionTrends();
                }
                if (typeof loadRecentActivity === 'function') {
                    loadRecentActivity();
                }
            } catch (err) {
                console.warn('[Realtime] fallback chart refresh failed', err);
            }
        };
        }

        // Enhanced polling for user dashboards
        setInterval(() => {
            if (typeof window.refreshUnderwriterData === 'function') {
                window.refreshUnderwriterData();
            }
            
            // Also poll user dashboard functions if they exist
            if (typeof loadClaims === 'function') {
                loadClaims();
            }
            if (typeof loadPolicies === 'function') {
                loadPolicies();
            }
            if (typeof loadNotifications === 'function') {
                loadNotifications();
            }
        }, 15000);

        realtimeEmitter.addEventListener('notification', (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (onEvent) onEvent(payload);
                showToast('New notification: ' + (payload.title || 'Update'), 'success');
                console.debug('[Realtime] notification payload', payload);
                
                // Trigger user dashboard updates on notification
                if (typeof loadClaims === 'function') {
                    loadClaims();
                }
                if (typeof loadPolicies === 'function') {
                    loadPolicies();
                }
                if (typeof loadNotifications === 'function') {
                    loadNotifications();
                }
            } catch (e) {
                console.error('[Realtime] invalid notification payload', e);
            }
        });

        realtimeEmitter.onerror = (err) => {
            console.warn('[Realtime] SSE error', err);
            if (realtimeEmitter) realtimeEmitter.close();
            setTimeout(() => initRealtimeUpdates(onEvent), 5000);
        };
    } catch (e) {
        console.error('[Realtime] SSE initialization failed', e);
        setTimeout(() => initRealtimeUpdates(onEvent), 5000);
    }
}
