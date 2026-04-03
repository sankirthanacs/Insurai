// Underwriter Dashboard JS
// Loads real-time data from backend and populates dashboard

document.addEventListener('DOMContentLoaded', () => {
    // Initialize real-time WebSocket connection
    initRealtimeDashboard('underwriter');
    
    loadDashboardKPIs();
    loadDashboardTable();
    loadFraudAlerts();
    setPageActive('dashboard');
});

function setPageActive(page) {
    if (!page) return;

    if (page === 'dashboard') {
        loadDashboardKPIs();
        loadDashboardTable();
        loadFraudAlerts();
    }

    if (page === 'policy-review') {
        loadPolicyReviewData && loadPolicyReviewData();
    }

    if (page === 'claim-risk') {
        loadClaimRiskData();
    }

    if (page === 'fraud-alerts') {
        loadFraudAlerts();
    }

    if (page === 'risk-analytics') {
        loadRiskAnalyticsData();
    }

    if (page === 'decision-history') {
        loadDecisionHistoryData();
    }

    if (page === 'settings') {
        loadSettingsData && loadSettingsData();
    }
}

function setKPI(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
    else console.warn('KPI element not found:', id);
}

async function loadDashboardKPIs() {
    try {
        const data = await apiRequest('/user/underwriter/dashboard');
        if (!data) return;

        setKPI('pending-reviews', data.pendingReviews ?? 0);
        setKPI('total-claims', data.totalClaims ?? 0);
        setKPI('high-risk-claims', data.highRiskClaims ?? 0);
        setKPI('approved-today', data.approvedToday ?? 0);
        setKPI('fraud-alerts', data.fraudAlerts ?? 0);

        document.getElementById('risk-avg-score') && (document.getElementById('risk-avg-score').textContent = data.avgRiskScore ?? '0');
        document.getElementById('risk-approval-rate') && (document.getElementById('risk-approval-rate').textContent = (data.approvalRate ? data.approvalRate + '%' : '0%'));
        document.getElementById('risk-rejection-rate') && (document.getElementById('risk-rejection-rate').textContent = (data.rejectionRate ? data.rejectionRate + '%' : '0%'));
        document.getElementById('risk-under-review') && (document.getElementById('risk-under-review').textContent = data.underReview ?? 0);
    } catch (error) {
        console.error('Error loading dashboard KPIs:', error);
    }
}

function calculateRiskScore(claim) {
    if (!claim) return 0;
    if (typeof claim.riskScore === 'number' && !isNaN(claim.riskScore)) {
        return Math.max(0, Math.min(100, claim.riskScore));
    }

    let base = 20;
    const amount = Number(claim.amount || 0);
    if (amount > 100000) base += 40;
    else base += Math.round(Math.min(amount, 100000) / 2500); // up to +40

    if (claim.fraudDetected) base += 20;
    if (claim.status === 'PENDING') base += 5;
    if (claim.status === 'REJECTED') base = Math.max(0, base - 15);

    return Math.max(0, Math.min(100, base));
}

function riskLevelFromScore(score) {
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
}

async function loadDashboardTable() {
    try {
        const data = await apiRequest('/claims/underwriter');
        const tbody = document.getElementById('dashboardTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (data && Array.isArray(data) && data.length > 0) {
            data.slice(0, 10).forEach(claim => {
                const riskScore = calculateRiskScore(claim);
                const riskLevel = riskLevelFromScore(riskScore);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${claim.id || '-'}</td>
                    <td>${claim.type || '-'}</td>
                    <td>${claim.userId || '-'}</td>
                    <td>$${(claim.amount || 0).toFixed ? claim.amount.toFixed(2) : claim.amount || '0.00'}</td>
                    <td>${riskLevel} (${riskScore}%)</td>
                    <td><span class="badge badge-${claim.status === 'APPROVED' ? 'success' : claim.status === 'REJECTED' ? 'danger' : 'info'}">${claim.status || 'PENDING'}</span></td>
                    <td>${claim.createdDate ? new Date(claim.createdDate).toLocaleDateString() : '-'}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7">No claims found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading dashboard table:', error);
    }
}

async function loadFraudAlerts() {
    try {
        let data = await apiRequest('/ai/fraud-alerts');
        if (!data) {
            data = await apiRequest('/admin/fraud'); // fallback legacy endpoint
        }
        const panel = document.getElementById('fraudAlertsPanel') || document.querySelector('.side-panel');
        if (!panel) return;

        panel.innerHTML = '<h3>🚨 Active Fraud Alerts</h3>';

        if (data && Array.isArray(data) && data.length > 0) {
            data.slice(0, 5).forEach(alert => {
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert-item alert-danger';
                alertDiv.innerHTML = `
                    <h4>${alert.claimId || 'Claim #' + alert.id}</h4>
                    <p>${alert.claimant || 'Unknown'} | $${alert.claimAmount || '0'}</p>
                    <div class="alert-meta">
                        <span>Risk: ${alert.riskScore || '--'}</span>
                        <span>${alert.status || 'N/A'}</span>
                    </div>
                `;
                panel.appendChild(alertDiv);
            });
        } else {
            panel.innerHTML += '<div class="empty-state">No fraud alerts</div>';
        }
    } catch (error) {
        console.error('Error loading fraud alerts:', error);
    }
}

async function loadClaimRiskData() {
    try {
        const allClaims = await apiRequest('/claims/underwriter');
        const highRisk = await apiRequest('/claims/high-risk');

        document.getElementById('claim-risk-high') && (document.getElementById('claim-risk-high').textContent = highRisk ? highRisk.length : 0);

        if (allClaims && Array.isArray(allClaims)) {
            const fraudCount = allClaims.filter(c => c.fraudDetected).length;
            const underReview = allClaims.filter(c => c.status === 'PENDING').length;

            document.getElementById('claim-risk-fraud') && (document.getElementById('claim-risk-fraud').textContent = fraudCount);
            document.getElementById('claim-risk-underreview') && (document.getElementById('claim-risk-underreview').textContent = underReview);

            const claimTableBody = document.getElementById('claimTableBody');
            if (claimTableBody) {
                claimTableBody.innerHTML = '';
                allClaims.slice(0, 12).forEach(claim => {
                    const riskScore = calculateRiskScore(claim);
                    const riskLevel = riskLevelFromScore(riskScore);
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${claim.id}</td>
                        <td>${claim.userId || '-'}</td>
                        <td>$${(claim.amount || 0).toFixed ? claim.amount.toFixed(2) : claim.amount || '0.00'}</td>
                        <td>${claim.type || '-'}</td>
                        <td>${riskLevel} (${riskScore}%)</td>
                        <td>${claim.fraudDetected ? 'Yes' : 'No'}</td>
                        <td>${claim.createdDate ? new Date(claim.createdDate).toLocaleDateString() : '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-success" onclick="handleClaimAction(${claim.id}, 'approve')">Approve</button>
                            <button class="btn btn-sm btn-danger" onclick="handleClaimAction(${claim.id}, 'reject')">Reject</button>
                        </td>
                    `;
                    claimTableBody.appendChild(row);
                });
            }

            const alertContainer = document.getElementById('claimRiskAlerts');
            if (alertContainer) {
                alertContainer.innerHTML = '<h3>🚨 Urgent Claims</h3>';
                const urgentClaims = allClaims.filter(c => riskLevelFromScore(c.riskScore || calculateRiskScore(c)) === 'HIGH' || c.fraudDetected).slice(0, 5);
                if (urgentClaims.length === 0) {
                    alertContainer.innerHTML += '<div class="alert-item alert-info">No urgent claims at the moment</div>';
                } else {
                    urgentClaims.forEach(claim => {
                        const item = document.createElement('div');
                        item.className = 'alert-item alert-danger';
                        item.innerHTML = `
                            <h4>CLM-${claim.id}</h4>
                            <p>${claim.type || 'Claim'} | $${claim.amount || 0}</p>
                            <div class="alert-meta">
                                <span>${claim.riskLevel || '-'}</span>
                                <span>${claim.status || '-'}</span>
                            </div>
                        `;
                        alertContainer.appendChild(item);
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error loading claim risk data:', error);
    }
}

async function loadRiskAnalyticsData() {
    try {
        const claims = await apiRequest('/claims/underwriter');
        if (!claims || !Array.isArray(claims)) return;

        // Update the cache
        window.underwriterClaimsCache = claims;

        // Update all risk analytics charts
        if (typeof updateRiskAnalytics === 'function') {
            updateRiskAnalytics(claims);
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
        if (typeof updateDecisionTrends === 'function') {
            updateDecisionTrends();
        }
        if (typeof updateClaimsRiskDistribution === 'function') {
            updateClaimsRiskDistribution();
        }
        if (typeof updateFraudTrendAnalysis === 'function') {
            updateFraudTrendAnalysis();
        }
    } catch (error) {
        console.error('Error loading risk analytics data:', error);
    }
}

async function loadDecisionHistoryData() {
    try {
        const claims = await apiRequest('/claims/underwriter');
        if (!claims || !Array.isArray(claims)) return;

        const total = claims.length;
        const approved = claims.filter(c => c.status === 'APPROVED').length;
        const rejected = claims.filter(c => c.status === 'REJECTED').length;
        const modified = claims.filter(c => c.status === 'UPDATED' || c.updatedDate).length;

        document.getElementById('decisions-total') && (document.getElementById('decisions-total').textContent = total);
        document.getElementById('decisions-approved') && (document.getElementById('decisions-approved').textContent = approved);
        document.getElementById('decisions-rejected') && (document.getElementById('decisions-rejected').textContent = rejected);
        document.getElementById('decisions-modified') && (document.getElementById('decisions-modified').textContent = modified);

        const historyBody = document.getElementById('historyTableBody');
        if (historyBody) {
            historyBody.innerHTML = '';
            claims.slice(0, 15).forEach(claim => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${claim.id}</td>
                    <td>${claim.type || '-'}</td>
                    <td>${claim.userId || '-'}</td>
                    <td>$${(claim.amount || 0).toFixed ? claim.amount.toFixed(2) : claim.amount || '0.00'}</td>
                    <td>${claim.riskLevel || '-'}</td>
                    <td>${claim.status || '-'}</td>
                    <td>${claim.underwriterNotes || 'N/A'}</td>
                    <td>${claim.updatedDate ? new Date(claim.updatedDate).toLocaleString() : '-'}</td>
                `;
                historyBody.appendChild(row);
            });
        }

        // Ensure Decision Trends chart updates immediately when decision-history page loads
        if (typeof updateDecisionTrends === 'function') {
            updateDecisionTrends();
        }
    } catch (error) {
        console.error('Error loading decision history data:', error);
    }
}

async function handleClaimAction(claimId, action) {
    const decision = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const notes = prompt(`Enter notes for ${decision} (optional):`, '');

    try {
        const endpoint = `/claims/${claimId}/decision`;
        const body = {
            decision,
            notes: notes || ''
        };

        const result = await apiRequest(endpoint, 'POST', body);

        if (!result) {
            alert('Action failed: no response from server');
            return;
        }

        alert(`Claim #${claimId} ${decision.toLowerCase()} successfully`);

        // Refresh dashboard tables / KPI
        loadDashboardKPIs();
        loadDashboardTable();
        loadClaimRiskData();
        loadDecisionHistoryData();
        loadFraudAlerts();
        loadRiskAnalyticsData();
    } catch (error) {
        console.error('Error applying decision:', error);
        alert('Error applying decision, please try again.');
    }
}

// Helper to load all underwriter view data
function loadUnderwriterData() {
    loadDashboardKPIs();
    loadDashboardTable();
    loadFraudAlerts();
    loadClaimRiskData();
    loadDecisionHistoryData();
    loadRiskAnalyticsData();
}

function logout() {
    removeToken();
    window.location.href = '../index.html';
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced refresh function to prevent multiple rapid updates
const debouncedRefreshUnderwriterData = debounce(() => {
    // Show visual feedback for data update
    const dashboardContent = document.querySelector('.content-area');
    if (dashboardContent) {
        dashboardContent.style.transition = 'opacity 0.3s ease';
        dashboardContent.style.opacity = '0.7';
    }

    loadDashboardKPIs();
    loadDashboardTable();
    loadFraudAlerts();
    loadClaimRiskData();
    loadDecisionHistoryData();
    
    // Update real-time charts including Claims Risk Distribution
    if (typeof updateClaimsRiskDistribution === 'function') {
        updateClaimsRiskDistribution();
    }
    if (typeof updateRiskScoreDistribution === 'function') {
        updateRiskScoreDistribution();
    }
    if (typeof updateHighRiskClaimsOverTime === 'function') {
        updateHighRiskClaimsOverTime();
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
    if (typeof updateFraudAlertsRealTime === 'function') {
        updateFraudAlertsRealTime();
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
    if (typeof refreshFraudAlerts === 'function') {
        refreshFraudAlerts();
    }

    // Restore opacity after update
    setTimeout(() => {
        if (dashboardContent) {
            dashboardContent.style.opacity = '1';
        }
    }, 500);
}, 300); // 300ms debounce delay

function refreshUnderwriterData() {
    debouncedRefreshUnderwriterData();
    // Also refresh risk analytics data
    loadRiskAnalyticsData();
}

window.addEventListener('storage', (event) => {
    if (!event || !event.key) return;
    if (['insurai_update_event', 'claimStatusChanged', 'approvedClaims', 'rejectedClaims'].includes(event.key)) {
        console.log('[Underwriter] Storage event reload data:', event.key);
        refreshUnderwriterData();
    }
});

if (typeof BroadcastChannel !== 'undefined') {
    const bc = new BroadcastChannel('insurai-updates');
    bc.onmessage = (event) => {
        if (event && event.data && event.data.type) {
            if (['claimSubmitted', 'claimStatusChanged', 'claimUpdated'].includes(event.data.type)) {
                console.log('[Underwriter] BroadcastChannel reload data:', event.data.type);
                refreshUnderwriterData();
            }
        }
    };
}

setInterval(refreshUnderwriterData, 15000); // ensure refresh every 15s
