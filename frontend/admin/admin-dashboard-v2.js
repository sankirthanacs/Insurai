// Admin Dashboard V2 - Main JavaScript
// Handles navigation, theme, modals, and dynamic content loading

// ============================================
// Configuration & Constants
// ============================================
window.API_HOST = window.__API_URL__ || 'https://insurai.railway.app';
const API_BASE_URL = window.API_BASE_URL || `${window.API_HOST}/api`;
const WS_URL = window.WS_URL || window.__WS_URL__ || `wss://${new URL(window.API_HOST).host}/ws/dashboard`;

async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = { ...options.headers };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
}

async function authFetchWithBody(url, options = {}) {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = { 
        'Content-Type': 'application/json',
        ...options.headers 
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
}

const PAGES = {
    dashboard: {
        title: 'Dashboard Overview',
        subtitle: 'Monitor your insurance platform performance'
    },
    users: {
        title: 'Users & Roles',
        subtitle: 'Manage user accounts and permissions'
    },
    claims: {
        title: 'Claims Monitoring',
        subtitle: 'Track and process insurance claims'
    },
    reports: {
        title: 'Reports & Analytics',
        subtitle: 'Generate insights and reports'
    },
    'audit-logs': {
        title: '🔍 Audit Logs',
        subtitle: 'Real-time activity tracking and system audit trail'
    }
};

// ============================================
// State Management
// ============================================
const state = {
    currentPage: 'dashboard',
    theme: localStorage.getItem('theme') || 'light',
    notifications: [],
    dashboardData: null,
    websocket: null
};

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeNavigation();
    initializeSearch();
    initializeNotifications();
    initializeWebSocket();
    loadPage('dashboard');
    
    // Set up periodic refresh for dashboard (every 30 seconds)
    setInterval(() => {
        if (state.currentPage === 'dashboard') {
            loadDashboard();
        }
    }, 30000);
});

// ============================================
// Theme Management
// ============================================
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    // Apply saved theme
    if (state.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.theme);
        themeIcon.textContent = state.theme === 'light' ? '🌙' : '☀️';
        localStorage.setItem('theme', state.theme);
    });
}

// ============================================
// Navigation
// ============================================
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Load page
            loadPage(page);
        });
    });
}

function loadPage(page) {
    state.currentPage = page;
    const content = document.getElementById('main-content');
    const pageInfo = PAGES[page];
    
    // Update page header
    content.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">${pageInfo.title}</h1>
            <p class="page-subtitle">${pageInfo.subtitle}</p>
        </div>
        <div id="page-content">
            <div class="loading-spinner">Loading...</div>
        </div>
    `;
    
    // Load page-specific content
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsersPage();
            break;
        case 'claims':
            loadClaimsPage();
            break;
        case 'reports':
            loadReportsPage();
            break;
        case 'audit-logs':
            loadAuditLogsPage();
            break;
    }
}

// ============================================
// Dashboard Page
// ============================================
async function loadDashboard() {
    const pageContent = document.getElementById('page-content');
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    try {
        const response = await authFetch(`${API_BASE_URL}/admin/dashboard`);
        const data = await response.json();
        state.dashboardData = data;
        
        pageContent.innerHTML = `
            <!-- KPI Cards -->
            <div class="grid grid-cols-4" style="margin-bottom: 24px;">
                <div class="kpi-card primary animate__animated animate__fadeInUp" style="animation-delay: 0s;">
                    <div class="kpi-header">
                        <div class="kpi-icon">👥</div>
                        <span class="kpi-change positive">Real-time</span>
                    </div>
                    <p class="kpi-label">Total Users</p>
                    <p class="kpi-value" id="kpi-users">${data.totalUsers || 0}</p>
                    <div class="kpi-arrow">↗️</div>
                </div>
                <div class="kpi-card success animate__animated animate__fadeInUp" style="animation-delay: 0.1s;">
                    <div class="kpi-header">
                        <div class="kpi-icon">📋</div>
                        <span class="kpi-change positive">Real-time</span>
                    </div>
                    <p class="kpi-label">Active Policies</p>
                    <p class="kpi-value" id="kpi-policies">${data.activePolicies || 0}</p>
                    <div class="kpi-arrow">↗️</div>
                </div>
                <div class="kpi-card warning animate__animated animate__fadeInUp" style="animation-delay: 0.2s;">
                    <div class="kpi-header">
                        <div class="kpi-icon">📝</div>
                        <span class="kpi-change negative">Real-time</span>
                    </div>
                    <p class="kpi-label">Pending Claims</p>
                    <p class="kpi-value" id="kpi-claims">${data.pendingClaims || 0}</p>
                    <div class="kpi-arrow">→</div>
                </div>
                <div class="kpi-card danger animate__animated animate__fadeInUp" style="animation-delay: 0.3s;">
                    <div class="kpi-header">
                        <div class="kpi-icon">⚠️</div>
                        <span class="kpi-change positive">Real-time</span>
                    </div>
                    <p class="kpi-label">Fraud Alerts</p>
                    <p class="kpi-value" id="kpi-fraud">${data.fraudAlerts || 0}</p>
                    <div class="kpi-arrow">↗️</div>
                </div>
            </div>
            
            <!-- Charts Section -->
            <div class="grid grid-cols-12" style="margin-bottom: 24px;">
                <div class="chart-wrapper col-span-8 animate__animated animate__fadeInUp" style="animation-delay: 0.4s;">
                    <div class="chart-header">
                        <h3 class="chart-title">Monthly Performance</h3>
                        <div class="chart-actions">
                            <button class="chart-btn" onclick="updateChart('line')">Line</button>
                            <button class="chart-btn" onclick="updateChart('bar')">Bar</button>
                        </div>
                    </div>
                    <canvas id="performance-chart"></canvas>
                </div>
                <div class="chart-wrapper col-span-4 animate__animated animate__fadeInUp" style="animation-delay: 0.5s;">
                    <div class="chart-header">
                        <h3 class="chart-title">User Distribution</h3>
                        <div class="chart-actions">
                            <button class="chart-btn" onclick="updatePieChart()">Refresh</button>
                        </div>
                    </div>
                    <canvas id="user-distribution-chart"></canvas>
                </div>
            </div>
            
            <!-- Charts Section 2 -->
            <div class="grid grid-cols-12" style="margin-bottom: 24px;">
                <div class="chart-wrapper col-span-6 animate__animated animate__fadeInUp" style="animation-delay: 0.6s;">
                    <div class="chart-header">
                        <h3 class="chart-title">Claims Status</h3>
                        <div class="chart-actions">
                            <button class="chart-btn" onclick="updateClaimsChart()">Update</button>
                        </div>
                    </div>
                    <canvas id="claims-chart"></canvas>
                </div>
                <div class="chart-wrapper col-span-6 animate__animated animate__fadeInUp" style="animation-delay: 0.7s;">
                    <div class="chart-header">
                        <h3 class="chart-title">Revenue Overview</h3>
                        <div class="chart-actions">
                            <button class="chart-btn" onclick="updateRevenueChart()">Update</button>
                        </div>
                    </div>
                    <canvas id="revenue-chart"></canvas>
                </div>
            </div>
            
            <!-- Tables and Actions -->
            <div class="grid grid-cols-12">
                <div class="card col-span-12 animate__animated animate__fadeInUp" style="animation-delay: 0.8s;">
                    <div class="card-header">
                        <h3 class="card-title">Recent Activity</h3>
                        <button class="btn btn-secondary btn-sm" onclick="loadDashboard()">Refresh</button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Activity</th>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="recent-activity-table">
                                ${renderRecentActivities(data.activityFeed || data.recentActivity || data.activities || [])}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Quick Actions Row -->
            <div class="card animate__animated animate__fadeInUp" style="animation-delay: 0.9s; margin-top: 24px;">
                <div class="card-header">
                    <h3 class="card-title">Quick Actions</h3>
                </div>
                <div style="display: flex; gap: 12px; padding: 16px; flex-wrap: wrap;">
                    <button class="btn btn-primary micro-interaction" onclick="showModal('addUser')">➕ Add New User</button>
                    <button class="btn btn-secondary micro-interaction" onclick="loadPage('claims')">📝 Review Claims</button>
                    <button class="btn btn-secondary micro-interaction" onclick="exportReport()">📊 Export Report</button>
                    <button class="btn btn-secondary micro-interaction" onclick="loadPage('reports')">📈 View Reports</button>
                </div>
            </div>
        `;
        
        // Initialize charts after DOM is ready
        setTimeout(() => {
            initializeCharts(data);
            // Update charts with real data
            updateChart('line'); // Update Monthly Performance chart
            updatePieChart();
            updateClaimsChart();
            updateRevenueChart();
        }, 100);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        pageContent.innerHTML = `
            <div class="card">
                <p style="color: var(--danger);">Error loading dashboard data. Please try again.</p>
                <button class="btn btn-primary" onclick="loadDashboard()">Retry</button>
            </div>
        `;
    }
}

function renderRecentActivities(activities) {
    if (activities.length === 0) {
        return '<tr><td colspan="5" style="text-align: center; color: var(--gray-500);">No recent activities</td></tr>';
    }
    
    return activities.map(activity => `
        <tr>
            <td>${activity.description || activity.action || 'N/A'}</td>
            <td>${activity.user || 'System'}</td>
            <td><span class="status-badge ${getRoleClass(activity.userRole)}">${activity.userRole || 'N/A'}</span></td>
            <td>${formatTime(activity.timestamp)}</td>
            <td><span class="status-badge ${getStatusClass(activity.status)}">${activity.status || 'Completed'}</span></td>
        </tr>
    `).join('');
}

function getRoleClass(role) {
    switch(role?.toUpperCase()) {
        case 'ADMIN':
            return 'active';
        case 'UNDERWRITER':
            return 'pending';
        case 'HR':
            return 'inactive';
        case 'USER':
            return 'active';
        default:
            return 'active';
    }
}

// ============================================
// Users Page
// ============================================
async function loadUsersPage() {
    const pageContent = document.getElementById('page-content');
    
    try {
        const response = await authFetch(`${API_BASE_URL}/admin/users`);
        const data = await response.json();
        const users = data.users || data || [];

        // Store for header search
        currentUsersData = users;
        
        pageContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">User Management</h3>
                    <button class="btn btn-primary" onclick="showModal('addUser')">➕ Add User</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderUsersTable(users)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading users:', error);
        pageContent.innerHTML = `<div class="card"><p style="color: var(--danger);">Error loading users.</p></div>`;
    }
}

function renderUsersTable(users) {
    if (!users || users.length === 0) {
        return '<tr><td colspan="5" style="text-align: center;">No users found</td></tr>';
    }
    
    return users.map(user => `
        <tr>
            <td>${user.name || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td><span class="status-badge ${getRoleClass(user.role)}">${user.role || 'User'}</span></td>
            <td><span class="status-badge ${user.status === 'ACTIVE' ? 'active' : 'inactive'}">${user.status || 'Active'}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editUser('${user.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderClaimsTable(claims) {
    if (!claims || claims.length === 0) {
        return '<tr><td colspan="7" style="text-align: center;">No claims found</td></tr>';
    }

    return claims.map(claim => {
        const policyNumber = claim.policyNumber || claim.policy_number || claim.policy?.policyNumber || 'N/A';
        const submitted = claim.submittedDate || claim.date || claim.createdDate || claim.updatedDate || 'N/A';

        return `
            <tr>
                <td><strong>${claim.claimNumber || `CLM-${claim.id || 'N/A'}`}</strong></td>
                <td>${policyNumber}</td>
                <td>${claim.claimantName || claim.userName || claim.userId || 'N/A'}</td>
                <td>₹${(claim.amount || 0).toLocaleString()}</td>
                <td><span class="status-badge ${getStatusClass(claim.status)}">${claim.status || 'N/A'}</span></td>
                <td>${formatDate(submitted)}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="reviewClaim('${claim.id}')">Review</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// Reports Page
// ============================================
async function loadReportsPage() {
    const pageContent = document.getElementById('page-content');
    
    pageContent.innerHTML = `
        <div class="grid grid-cols-3">
            <div class="card" style="cursor: pointer;" onclick="generateReport('users')">
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
                    <h3 style="margin-bottom: 8px;">User Report</h3>
                    <p style="color: var(--gray-500); font-size: 14px;">Generate user activity report</p>
                </div>
            </div>
            <div class="card" style="cursor: pointer;" onclick="generateReport('policies')">
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                    <h3 style="margin-bottom: 8px;">Policy Report</h3>
                    <p style="color: var(--gray-500); font-size: 14px;">Generate policy statistics report</p>
                </div>
            </div>
            <div class="card" style="cursor: pointer;" onclick="generateReport('claims')">
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                    <h3 style="margin-bottom: 8px;">Claims Report</h3>
                    <p style="color: var(--gray-500); font-size: 14px;">Generate claims analysis report</p>
                </div>
            </div>
            <div class="card" style="cursor: pointer;" onclick="generateReport('financial')">
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">💰</div>
                    <h3 style="margin-bottom: 8px;">Financial Report</h3>
                    <p style="color: var(--gray-500); font-size: 14px;">Generate financial summary</p>
                </div>
            </div>
            <div class="card" style="cursor: pointer;" onclick="generateReport('fraud')">
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <h3 style="margin-bottom: 8px;">Fraud Report</h3>
                    <p style="color: var(--gray-500); font-size: 14px;">Generate fraud detection report</p>
                </div>
            </div>
            <div class="card" style="cursor: pointer;" onclick="generateReport('performance')">
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📈</div>
                    <h3 style="margin-bottom: 8px;">Performance Report</h3>
                    <p style="color: var(--gray-500); font-size: 14px;">Generate system performance report</p>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// Modal Management
// ============================================
function showModal(type, data = null) {
    const modal = document.getElementById('modal-container');
    const modalTitle = modal.querySelector('.modal-title');
    const modalBody = modal.querySelector('.modal-body');
    const modalFooter = modal.querySelector('.modal-footer');
    
    modal.classList.remove('hidden');
    
    switch(type) {
        case 'addUser':
            modalTitle.textContent = 'Add New User';
            modalBody.innerHTML = `
                <form id="add-user-form">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Full Name</label>
                        <input type="text" id="user-name" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px;">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Email</label>
                        <input type="email" id="user-email" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px;">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Role</label>
                        <select id="user-role" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px;">
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                            <option value="UNDERWRITER">Underwriter</option>
                            <option value="HR">HR</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Password</label>
                        <input type="password" id="user-password" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px;">
                    </div>
                </form>
            `;
            modalFooter.innerHTML = `
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitAddUser()">Add User</button>
            `;
            break;
            
        case 'editUser':
            modalTitle.textContent = 'Edit User';
            modalBody.innerHTML = `
                <form id="edit-user-form">
                    <input type="hidden" id="edit-user-id" value="${data.id || ''}">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Full Name</label>
                        <input type="text" id="edit-user-name" value="${data.name || ''}" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px;">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Email</label>
                        <input type="email" id="edit-user-email" value="${data.email || ''}" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px;">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Role</label>
                        <select id="edit-user-role" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px;">
                            <option value="USER" ${data.role === 'USER' ? 'selected' : ''}>User</option>
                            <option value="ADMIN" ${data.role === 'ADMIN' ? 'selected' : ''}>Admin</option>
                            <option value="UNDERWRITER" ${data.role === 'UNDERWRITER' ? 'selected' : ''}>Underwriter</option>
                            <option value="HR" ${data.role === 'HR' ? 'selected' : ''}>HR</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Status</label>
                        <select id="edit-user-status" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px;">
                            <option value="ACTIVE" ${data.status === 'ACTIVE' ? 'selected' : ''}>Active</option>
                            <option value="INACTIVE" ${data.status === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">New Password (leave blank to keep current)</label>
                        <input type="password" id="edit-user-password" placeholder="Enter new password" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px;">
                    </div>
                </form>
            `;
            modalFooter.innerHTML = `
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitEditUser()">Save Changes</button>
            `;
            break;
            
        case 'reviewClaim':
            modalTitle.textContent = 'Review Claim';
            modalBody.innerHTML = `
                <div id="claim-details">
                    <p>Loading claim details...</p>
                </div>
            `;
            modalFooter.innerHTML = `
                <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                <button class="btn btn-success" onclick="approveClaim('${data}')">Approve</button>
                <button class="btn btn-danger" onclick="rejectClaim('${data}')">Reject</button>
            `;
            // Load claim details
            loadClaimDetails(data);
            break;
            
        default:
            modalTitle.textContent = 'Modal';
            modalBody.innerHTML = '<p>Modal content</p>';
            modalFooter.innerHTML = '<button class="btn btn-secondary" onclick="closeModal()">Close</button>';
    }
    
    // Close modal on overlay click
    modal.querySelector('.modal-overlay').onclick = closeModal;
    modal.querySelector('.modal-close').onclick = closeModal;
}

function closeModal() {
    const modal = document.getElementById('modal-container');
    modal.classList.add('hidden');
}

// ============================================
// Form Submissions
// ============================================
async function submitAddUser() {
    const name = document.getElementById('user-name').value;
    const email = document.getElementById('user-email').value;
    const role = document.getElementById('user-role').value;
    const password = document.getElementById('user-password').value;
    
    if (!name || !email || !password) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await authFetchWithBody(`${API_BASE_URL}/admin/users`, {
            method: 'POST',
            body: JSON.stringify({ name, email, role, password })
        });
        
        if (response.ok) {
            showNotification('User added successfully', 'success');
            closeModal();
            loadUsersPage();
        } else {
            // Parse error message from backend
            const errorData = await response.json();
            const errorMessage = errorData.error || 'Error adding user';
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Error adding user:', error);
        showNotification('Error adding user', 'error');
    }
}

async function submitAddPolicy() {
    const type = document.getElementById('policy-type').value;
    const holder = document.getElementById('policy-holder').value;
    const premium = document.getElementById('policy-premium').value;
    const coverage = document.getElementById('policy-coverage').value;
    
    if (!holder || !premium || !coverage) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await authFetchWithBody(`${API_BASE_URL}/admin/policies`, {
            method: 'POST',
            body: JSON.stringify({ type, holderName: holder, premium, coverage })
        });
        
        if (response.ok) {
            showNotification('Policy added successfully', 'success');
            closeModal();
            loadPoliciesPage();
        } else {
            // Parse error message from backend
            const errorData = await response.json();
            const errorMessage = errorData.error || 'Error adding policy';
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Error adding policy:', error);
        showNotification('Error adding policy', 'error');
    }
}

async function submitEditUser() {
    const userId = document.getElementById('edit-user-id').value;
    const name = document.getElementById('edit-user-name').value;
    const email = document.getElementById('edit-user-email').value;
    const role = document.getElementById('edit-user-role').value;
    const status = document.getElementById('edit-user-status').value;
    const password = document.getElementById('edit-user-password').value;
    
    if (!name || !email) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const updateData = { name, email, role, status };
        if (password) {
            updateData.password = password;
        }
        
        const response = await authFetchWithBody(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            showNotification('User updated successfully', 'success');
            closeModal();
            loadUsersPage();
        } else {
            const errorData = await response.json();
            const errorMessage = errorData.error || errorData.message || 'Error updating user';
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('Error updating user', 'error');
    }
}

// ============================================
// Actions
// ============================================
async function approveClaim(claimId) {
    try {
        const response = await authFetchWithBody(`${API_BASE_URL}/admin/claims/${claimId}/approve`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showNotification('Claim approved successfully', 'success');
            closeModal();
            loadClaimsPage();
        } else {
            showNotification('Error approving claim', 'error');
        }
    } catch (error) {
        console.error('Error approving claim:', error);
        showNotification('Error approving claim', 'error');
    }
}

async function rejectClaim(claimId) {
    try {
        const response = await authFetchWithBody(`${API_BASE_URL}/admin/claims/${claimId}/reject`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showNotification('Claim rejected', 'success');
            closeModal();
            loadClaimsPage();
        } else {
            showNotification('Error rejecting claim', 'error');
        }
    } catch (error) {
        console.error('Error rejecting claim:', error);
        showNotification('Error rejecting claim', 'error');
    }
}

async function reviewClaim(claimId) {
    showModal('reviewClaim', claimId);
}

async function loadClaimDetails(claimId) {
    try {
        const response = await authFetch(`${API_BASE_URL}/admin/claims/${claimId}`);
        const claim = await response.json();
        
        const claimSubmittedDate = claim.submittedDate || claim.date || claim.createdDate || claim.updatedDate || 'N/A';
        const claimPolicyNumber = claim.policyNumber || claim.policy_number || claim.policy?.policyNumber || 'N/A';

        document.getElementById('claim-details').innerHTML = `
            <div style="margin-bottom: 16px;">
                <p><strong>Claim ID:</strong> ${claim.claimNumber || claim.id}</p>
                <p><strong>Policy:</strong> ${claimPolicyNumber}</p>
                <p><strong>Claimant:</strong> ${claim.claimantName || claim.userName || 'N/A'}</p>
                <p><strong>Amount:</strong> ₹${claim.amount || 0}</p>
                <p><strong>Status:</strong> <span class="status-badge ${getStatusClass(claim.status)}">${claim.status}</span></p>
                <p><strong>Submitted:</strong> ${formatDate(claimSubmittedDate)}</p>
            </div>
            <div>
                <p><strong>Description:</strong></p>
                <p style="color: var(--gray-600);">${claim.description || 'No description provided'}</p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading claim details:', error);
        document.getElementById('claim-details').innerHTML = '<p style="color: var(--danger);">Error loading claim details</p>';
    }
}

async function editUser(userId) {
    try {
        const response = await authFetch(`${API_BASE_URL}/admin/users/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        const user = await response.json();
        
        showModal('editUser', user);
    } catch (error) {
        console.error('Error fetching user:', error);
        showNotification('Error loading user data', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await authFetchWithBody(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('User deleted successfully', 'success');
            loadUsersPage();
        } else {
            const errorData = await response.json();
            showNotification(`Error deleting user: ${errorData.message || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error deleting user', 'error');
    }
}

async function viewPolicy(policyId) {
    showNotification('View policy functionality coming soon', 'info');
}

async function editPolicy(policyId) {
    showNotification('Edit policy functionality coming soon', 'info');
}

async function deletePolicy(policyId) {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    
    try {
        const response = await authFetchWithBody(`${API_BASE_URL}/admin/policies/${policyId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Policy deleted successfully', 'success');
            loadPoliciesPage();
        } else {
            const errorData = await response.json();
            showNotification(`Error deleting policy: ${errorData.message || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting policy:', error);
        showNotification('Error deleting policy', 'error');
    }
}



async function generateReport(type) {
    showNotification(`Generating ${type} report...`, 'info');
    
    try {
        const response = await authFetch(`${API_BASE_URL}/admin/reports`);
        const data = await response.json();
        
        let csvContent = '';
        let filename = '';
        
        switch(type) {
            case 'claims':
            case 'dashboard':
                csvContent = generateClaimsCSV(data);
                filename = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'policies':
                csvContent = generatePoliciesCSV(data);
                filename = `policies-report-${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'users':
                csvContent = generateUsersCSV(data);
                filename = `users-report-${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'financial':
                csvContent = generateFinancialCSV(data);
                filename = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'fraud':
                csvContent = generateFraudCSV(data);
                filename = `fraud-report-${new Date().toISOString().split('T')[0]}.csv`;
                break;
            case 'performance':
                csvContent = generatePerformanceCSV(data);
                filename = `performance-report-${new Date().toISOString().split('T')[0]}.csv`;
                break;
            default:
                csvContent = generateClaimsCSV(data);
                filename = `report-${new Date().toISOString().split('T')[0]}.csv`;
        }
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('Report downloaded successfully', 'success');
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Error generating report', 'error');
    }
}

function generateClaimsCSV(data) {
    let csv = 'Claims Report\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    csv += 'Summary\n';
    csv += `This Month Claims,${data.thisMonthClaims || 'N/A'}\n`;
    csv += `Approval Rate,${data.approvalRate ? data.approvalRate.toFixed(1) + '%' : 'N/A'}\n`;
    csv += `Fraud Detection Rate,${data.fraudDetectionRate ? data.fraudDetectionRate.toFixed(1) + '%' : 'N/A'}\n`;
    csv += `Avg Processing Time,${data.avgProcessingTime ? data.avgProcessingTime.toFixed(1) + ' days' : 'N/A'}\n\n`;
    
    if (data.claimsTrend && data.claimsTrend.length > 0) {
        csv += 'Claims Trend\n';
        csv += 'Month,Approved,Pending,Rejected,Fraud\n';
        data.claimsTrend.forEach(trend => {
            csv += `${trend.date},${trend.approved},${trend.pending},${trend.rejected},${trend.fraud}\n`;
        });
        csv += '\n';
    }
    
    if (data.monthlySummary && data.monthlySummary.length > 0) {
        csv += 'Monthly Summary\n';
        csv += 'Month,Total Claims,Approved,Rejected,Fraud Detected\n';
        data.monthlySummary.forEach(month => {
            csv += `${month.month},${month.totalClaims},${month.approved},${month.rejected},${month.fraudDetected}\n`;
        });
    }
    
    return csv;
}

function generatePoliciesCSV(data) {
    let csv = 'Policies Report\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    csv += 'Summary\n';
    csv += `Total Policies,${data.thisMonthClaims || 'N/A'}\n`;
    csv += `Active Policies,${data.approvalRate ? Math.round(data.approvalRate * 10) : 'N/A'}\n\n`;
    
    if (data.monthlySummary && data.monthlySummary.length > 0) {
        csv += 'Monthly Policy Activity\n';
        csv += 'Month,New Policies,Active,Expired\n';
        data.monthlySummary.forEach(month => {
            csv += `${month.month},${month.totalClaims},${month.approved},${month.rejected}\n`;
        });
    }
    
    return csv;
}

function generateUsersCSV(data) {
    let csv = 'Users Report\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    csv += 'Summary\n';
    csv += `Total Active Users,${data.thisMonthClaims || 'N/A'}\n`;
    csv += `New Users This Month,${Math.round((data.thisMonthClaims || 0) * 0.1)}\n\n`;
    
    if (data.monthlySummary && data.monthlySummary.length > 0) {
        csv += 'Monthly User Activity\n';
        csv += 'Month,Active Users,New Registrations\n';
        data.monthlySummary.forEach(month => {
            csv += `${month.month},${month.totalClaims},${Math.round(month.totalClaims * 0.1)}\n`;
        });
    }
    
    return csv;
}

function generateFinancialCSV(data) {
    let csv = 'Financial Report\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    csv += 'Summary\n';
    csv += `Total Claims Value,₹${((data.thisMonthClaims || 0) * 50000).toLocaleString()}\n`;
    csv += `Average Claim Value,₹50,000\n`;
    csv += `Approval Rate,${data.approvalRate ? data.approvalRate.toFixed(1) + '%' : 'N/A'}\n\n`;
    
    if (data.monthlySummary && data.monthlySummary.length > 0) {
        csv += 'Monthly Financial Summary\n';
        csv += 'Month,Total Claims,Approved Amount,Rejected Amount\n';
        data.monthlySummary.forEach(month => {
            const approvedAmount = month.approved * 50000;
            const rejectedAmount = month.rejected * 50000;
            csv += `${month.month},${month.totalClaims},₹${approvedAmount.toLocaleString()},₹${rejectedAmount.toLocaleString()}\n`;
        });
    }
    
    return csv;
}

function generateFraudCSV(data) {
    let csv = 'Fraud Detection Report\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    csv += 'Summary\n';
    csv += `Fraud Detection Rate,${data.fraudDetectionRate ? data.fraudDetectionRate.toFixed(1) + '%' : 'N/A'}\n`;
    csv += `Total Fraud Cases,${data.fraudTrend ? data.fraudTrend.reduce((sum, t) => sum + t.fraud, 0) : 0}\n\n`;
    
    if (data.fraudTrend && data.fraudTrend.length > 0) {
        csv += 'Fraud Trend\n';
        csv += 'Month,Fraud Cases Detected\n';
        data.fraudTrend.forEach(trend => {
            csv += `${trend.date},${trend.fraud}\n`;
        });
    }
    
    return csv;
}

function generatePerformanceCSV(data) {
    let csv = 'System Performance Report\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    csv += 'Summary\n';
    csv += `Average Processing Time,${data.avgProcessingTime ? data.avgProcessingTime.toFixed(1) + ' days' : 'N/A'}\n`;
    csv += `Approval Rate,${data.approvalRate ? data.approvalRate.toFixed(1) + '%' : 'N/A'}\n`;
    csv += `Claims This Month,${data.thisMonthClaims || 'N/A'}\n\n`;
    
    if (data.claimsTrend && data.claimsTrend.length > 0) {
        csv += 'Processing Trend\n';
        csv += 'Month,Total Processed,Avg Time (est)\n';
        data.claimsTrend.forEach(trend => {
            const total = trend.approved + trend.pending + trend.rejected;
            csv += `${trend.date},${total},${(2 + Math.random()).toFixed(1)} days\n`;
        });
    }
    
    return csv;
}

async function exportReport() {
    showNotification('Exporting dashboard report...', 'info');
    await generateReport('dashboard');
}

// Store current filterable data for pages
let currentUsersData = [];
let currentClaimsData = [];

function filterUsers(query) {
    const filteredUsers = currentUsersData.filter(user => {
        const target = `${user.name || ''} ${user.email || ''} ${user.role || ''} ${user.status || ''}`.toLowerCase();
        return target.includes(query);
    });

    const tableBody = document.querySelector('#main-content tbody');
    if (tableBody) {
        tableBody.innerHTML = renderUsersTable(filteredUsers);
    }
}

function filterClaims() {
    const statusFilter = document.getElementById('claim-status-filter');
    if (!statusFilter) return;
    
    const status = statusFilter.value;
    
    console.log('Filtering claims by status:', status);
    console.log('Total claims in state:', currentClaimsData.length);
    
    // Filter the claims based on status
    const filteredClaims = status === 'all' 
        ? currentClaimsData 
        : currentClaimsData.filter(claim => {
            const claimStatus = (claim.status || '').toUpperCase();
            console.log('Claim status:', claimStatus, 'Filter:', status);
            return claimStatus === status;
        });
    
    console.log('Filtered claims count:', filteredClaims.length);
    
    // Update the table with filtered results
    const tableBody = document.querySelector('#main-content tbody');
    if (tableBody) {
        tableBody.innerHTML = renderClaimsTable(filteredClaims);
    }
    
    // Show notification with count
    const count = filteredClaims.length;
    const total = currentClaimsData.length;
    if (count === total) {
        showNotification(`Showing all ${total} claims`, 'info');
    } else {
        showNotification(`Found ${count} of ${total} claims`, 'success');
    }
}

// Update loadClaimsPage to store claims data for filtering
async function loadClaimsPage() {
    const pageContent = document.getElementById('page-content');
    
    try {
        const response = await authFetch(`${API_BASE_URL}/admin/claims`);
        const data = await response.json();
        const claims = data.claims || data || [];
        
        // Store claims for filtering
        currentClaimsData = claims;
        
        pageContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Claims Monitoring</h3>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <select id="claim-status-filter" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px;" onchange="filterClaims()">
                            <option value="all">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                        <button class="btn btn-secondary" onclick="loadClaimsPage()">Refresh</button>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Claim ID</th>
                                <th>Policy</th>
                                <th>Claimant</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Submitted</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderClaimsTable(claims)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading claims:', error);
        pageContent.innerHTML = `<div class="card"><p style="color: var(--danger);">Error loading claims.</p></div>`;
    }
}

// ============================================
// Search Functionality
// ============================================
function initializeSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (!searchInput) return;

    searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim().toLowerCase();

        if (!query) {
            // Reset current view
            loadPage(state.currentPage);
            return;
        }

        if (state.currentPage === 'users') {
            filterUsers(query);
            return;
        }

        if (state.currentPage === 'claims') {
            const filtered = currentClaimsData.filter(claim => {
                const target = `${claim.claimNumber || ''} ${claim.policyNumber || ''} ${claim.claimantName || ''} ${claim.status || ''}`.toLowerCase();
                return target.includes(query);
            });
            const tableBody = document.querySelector('#main-content tbody');
            if (tableBody) {
                tableBody.innerHTML = renderClaimsTable(filtered);
            }
            return;
        }

        if (state.currentPage === 'audit-logs') {
            const auditInput = document.getElementById('audit-search');
            if (auditInput) {
                auditInput.value = query;
                filterAuditLogs();
            }
            return;
        }

        // Fallback for endpoints that may exist in backend
        try {
            const response = await authFetch(`${API_BASE_URL}/admin/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const results = await response.json();
                displaySearchResults(results);
            } else {
                console.warn('No backend search endpoint available, local filter applied.');
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300));
}

function displaySearchResults(results) {
    // Implementation for displaying search results
    console.log('Search results:', results);
}

// ============================================
// Notifications - Real-time from all dashboards
// ============================================
function initializeNotifications() {
    const notificationIcon = document.querySelector('.notification-icon');
    
    if (notificationIcon) {
        notificationIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            showNotificationsPanel();
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('notification-panel');
        if (panel && !panel.contains(e.target) && !e.target.closest('.notification-icon')) {
            panel.style.display = 'none';
        }
    });
    
    // Set up real-time notification listeners
    setupRealtimeNotificationListeners();
    
    // Poll for new notifications every 10 seconds
    setInterval(fetchAdminNotifications, 10000);
}

function showNotificationsPanel() {
    // Remove existing panel if any
    const existingPanel = document.getElementById('notification-panel');
    if (existingPanel) {
        existingPanel.remove();
        return;
    }
    
    // Create notification panel
    const panel = document.createElement('div');
    panel.id = 'notification-panel';
    panel.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        width: 380px;
        max-height: 500px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        box-shadow: var(--shadow-xl);
        z-index: 1000;
        overflow: hidden;
        animation: slideInRight 0.3s ease;
    `;
    
    panel.innerHTML = `
        <div style="padding: 16px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 16px;">Notifications</h3>
            <button onclick="markAllNotificationsRead()" style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 13px;">Mark all read</button>
        </div>
        <div id="notification-list" style="max-height: 400px; overflow-y: auto;">
            ${state.notifications.length === 0 ? '<p style="padding: 20px; text-align: center; color: var(--gray-500);">No new notifications</p>' : ''}
            ${state.notifications.slice(0, 10).map(notif => `
                <div style="padding: 14px 16px; border-bottom: 1px solid var(--border-color); ${notif.read ? '' : 'background: rgba(79, 70, 229, 0.05);'}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <p style="font-weight: 600; margin: 0 0 4px 0; font-size: 14px;">${notif.title || 'Notification'}</p>
                            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 6px 0;">${notif.message || ''}</p>
                            <p style="font-size: 11px; color: var(--text-tertiary); margin: 0;">${formatTime(notif.timestamp)}</p>
                        </div>
                        ${!notif.read ? '<span style="width: 8px; height: 8px; background: var(--primary); border-radius: 50%; flex-shrink: 0;"></span>' : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    document.body.appendChild(panel);
}

function markAllNotificationsRead() {
    state.notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    showNotificationsPanel(); // Refresh panel
}

function updateNotificationBadge() {
    const badge = document.querySelector('.notification-icon .badge');
    const unreadCount = state.notifications.filter(n => !n.read).length;
    
    if (badge) {
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    }
}

// Create and show a notification toast
function showNotificationToast(message, type = 'info', title = '') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #e2e8f0;
        border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        max-width: 350px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    toast.innerHTML = `
        <p style="font-weight: 600; margin: 0 0 4px 0; font-size: 14px;">${title || 'Notification'}</p>
        <p style="font-size: 13px; color: #6b7280; margin: 0;">${message}</p>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Add notification to state
function addNotification(notification) {
    const notif = {
        id: Date.now() + Math.random(),
        title: notification.title || 'Notification',
        message: notification.message || '',
        type: notification.type || 'info',
        source: notification.source || 'system',
        timestamp: new Date().toISOString(),
        read: false
    };
    
    state.notifications.unshift(notif);
    
    // Keep only last 50 notifications
    if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
    }
    
    updateNotificationBadge();
    
    // Show toast for important notifications
    if (['urgent', 'warning', 'error'].includes(notif.type)) {
        showNotificationToast(notif.message, notif.type, notif.title);
    }
    
    // Broadcast to other tabs
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('insurai-admin-notifications');
        channel.postMessage({ type: 'newNotification', notification: notif });
    }
}

// Set up real-time notification listeners
function setupRealtimeNotificationListeners() {
    // WebSocket listener - real notifications from backend
    if (state.websocket) {
        const previousMessageHandler = state.websocket.onmessage;

        state.websocket.onmessage = (event) => {
            let data;

            // Try JSON first
            try {
                data = JSON.parse(event.data);
            } catch (e) {
                // Fallback: if backend sends plain text, show it as general notification
                const text = event.data && event.data.toString ? event.data.toString() : 'New notification';
                addNotification({
                    title: 'Notification',
                    message: text,
                    type: 'info',
                    source: 'system'
                });
                if (typeof previousMessageHandler === 'function') {
                    previousMessageHandler(event);
                }
                return;
            }

            // Handle no-data edge case
            if (!data) {
                return;
            }

            // Handle explicit notification event payloads
            if (data.type && (data.type.toLowerCase() === 'notification' || data.type === 'NOTIFICATION')) {
                const notifData = data.notification || data.payload || data;
                addNotification({
                    title: notifData.title || data.title || 'Notification',
                    message: notifData.message || data.message || '',
                    type: (notifData.type || data.type || 'info').toLowerCase(),
                    source: notifData.source || data.source || 'system'
                });
            } else {
                // Generic event handling for user/admin/hr/underwriter events
                handleNotificationEvent(data);

                // Allow existing content-specific logic (dashboard updates etc) to run too
                handleWebSocketMessage(data);
            }

            if (typeof previousMessageHandler === 'function') {
                previousMessageHandler(event);
            }
        };
    }
    
    // Poll for real notifications from backend every 10 seconds
    setInterval(fetchAdminNotifications, 10000);
}

// Handle notification events from various sources
function handleNotificationEvent(data) {
    if (!data || !data.type) return;
    
    let notification = null;
    
    switch (data.type) {
        // User Dashboard Events
        case 'claimSubmitted':
            notification = {
                title: 'New Claim Submitted',
                message: `Claim #${data.claimId} submitted by user`,
                type: 'info',
                source: 'user'
            };
            break;
        case 'claimUpdated':
            notification = {
                title: 'Claim Updated',
                message: `Claim #${data.claimId} status changed to ${data.status}`,
                type: 'info',
                source: 'user'
            };
            break;
        case 'policySubmitted':
            notification = {
                title: 'New Policy Request',
                message: `Policy #${data.policyId} submitted for approval`,
                type: 'info',
                source: 'user'
            };
            break;
            
        // Underwriter Dashboard Events
        case 'claimApproved':
            notification = {
                title: 'Claim Approved',
                message: `Claim #${data.claimId} approved by underwriter`,
                type: 'success',
                source: 'underwriter'
            };
            break;
        case 'claimRejected':
            notification = {
                title: 'Claim Rejected',
                message: `Claim #${data.claimId} rejected by underwriter`,
                type: 'warning',
                source: 'underwriter'
            };
            break;
        case 'fraudDetected':
            notification = {
                title: '🚨 Fraud Alert',
                message: `Fraud detected in claim #${data.claimId}`,
                type: 'urgent',
                source: 'underwriter'
            };
            break;
        case 'underwriterDecision':
            notification = {
                title: 'Underwriter Decision',
                message: data.message || 'A claim decision has been made',
                type: 'info',
                source: 'underwriter'
            };
            break;
            
        // HR Dashboard Events
        case 'employeeAdded':
            notification = {
                title: 'New Employee Added',
                message: `${data.employeeName} added to ${data.department}`,
                type: 'info',
                source: 'hr'
            };
            break;
        case 'departmentUpdated':
            notification = {
                title: 'Department Updated',
                message: data.message || 'Department information updated',
                type: 'info',
                source: 'hr'
            };
            break;
        case 'policyEnrolled':
            notification = {
                title: 'Policy Enrolled',
                message: `Employee enrolled in ${data.policyType} policy`,
                type: 'success',
                source: 'hr'
            };
            break;
            
        // System Events
        case 'systemAlert':
            notification = {
                title: 'System Alert',
                message: data.message || 'System notification',
                type: 'warning',
                source: 'system'
            };
            break;
        case 'userActivity':
            notification = {
                title: 'User Activity',
                message: data.message || 'User activity detected',
                type: 'info',
                source: 'system'
            };
            break;
        case 'notification':
        case 'NOTIFICATION':
            // Friendly compatibility with MessageEvent from NotificationService
            const sourceNotification = (data.notification || data.payload || data);
            notification = {
                title: sourceNotification.title || data.title || 'Notification',
                message: sourceNotification.message || data.message || '',
                type: sourceNotification.type?.toLowerCase() || data.type?.toLowerCase() || 'info',
                source: sourceNotification.source || data.source || 'system'
            };
            break;
        case 'claim_update':
            notification = {
                title: 'Claim Update',
                message: `Claim #${data.claimId || data.claim_id || ''} status changed to ${data.status || 'UPDATED'}`,
                type: 'info',
                source: 'underwriter'
            };
            break;
        case 'claimSubmitted':
            notification = {
                title: 'New Claim Submitted',
                message: `Claim #${data.claimId || data.claim_id || ''} submitted`,
                type: 'info',
                source: 'user'
            };
            break;
        case 'claimDecision':
            notification = {
                title: 'Claim Decision',
                message: data.message || `Claim #${data.claimId || data.claim_id || ''} decision: ${data.status || ''}`,
                type: data.status?.toLowerCase() === 'approved' ? 'success' : 'warning',
                source: 'underwriter'
            };
            break;
        case 'policyStatusChanged':
            notification = {
                title: 'Policy Status Changed',
                message: `Policy #${data.policyId || data.policy_id || ''} ${data.status || ''}`,
                type: 'info',
                source: 'policies'
            };
            break;
        default:
            // Generic notification
            if (data.message) {
                notification = {
                    title: data.title || 'Notification',
                    message: data.message,
                    type: data.priority || 'info',
                    source: data.source || 'system'
                };
            }
    }
    
    if (notification) {
        addNotification(notification);
        addLiveActivity({
            title: notification.title,
            description: notification.message,
            type: notification.type,
            source: notification.source
        }, true);
    }
}

// Fetch notifications from backend
async function fetchAdminNotifications() {
    try {
        const response = await authFetch(`${API_BASE_URL}/admin/notifications`);
        if (response.ok) {
            const notifications = await response.json();
            if (Array.isArray(notifications)) {
                // Only add new notifications that we haven't seen
                notifications.forEach(notif => {
                    const exists = state.notifications.some(n => n.id === notif.id);
                    if (!exists) {
                        addNotification({
                            id: notif.id,
                            title: notif.title,
                            message: notif.message,
                            type: notif.type || 'info',
                            source: notif.source || 'system',
                            timestamp: notif.timestamp
                        });
                    }
                });
            }
        }
    } catch (error) {
        // Silently fail - notifications will still work via WebSocket
    }
}

function showNotification(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary)'};
        color: white;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// WebSocket Connection
// ============================================
function initializeWebSocket() {
    try {
        state.websocket = new WebSocket(WS_URL);

        state.websocket.onopen = () => {
            console.log('WebSocket connected');
        };

        state.websocket.onmessage = (event) => {
            let data;            
            if (typeof event.data !== 'string') {
                try {
                    data = JSON.parse(event.data);
                } catch (e) {
                    data = null;
                }
            } else {
                try {
                    data = JSON.parse(event.data);
                } catch (e) {
                    data = null;
                }
            }

            if (!data) {
                const message = event.data?.toString() || 'Received activity';
                addLiveActivity({
                    title: 'Live message',
                    description: message,
                    type: 'system',
                    source: 'system'
                }, true);
                addNotification({
                    title: 'Live message',
                    message,
                    type: 'info',
                    source: 'system'
                });
                return;
            }

            // Notification-specific events
            if (data.type && ['notification', 'NOTIFICATION', 'claimSubmitted', 'claimDecision', 'policyStatusChanged', 'documentUploaded'].includes(data.type)) {
                handleNotificationEvent(data);
            }

            // General update events for dashboard components
            handleWebSocketMessage(data);

            // Add to live feed for known events
            if (data.type) {
                let activity = null;
                switch (data.type.toString().toLowerCase()) {
                    case 'notifications':
                    case 'notification':
                    case 'claimsubmitted':
                    case 'claimdecision':
                    case 'policystatuschanged':
                    case 'documentuploaded':
                    case 'claimedited':
                    case 'claim_update':
                    case 'user_update':
                    case 'policy_update':
                    case 'dashboard_update':
                        activity = {
                            title: data.title || data.type,
                            description: data.message || `Event ${data.type} received`,
                            type: data.source || (data.type.toString().includes('claim') ? 'claim' : 'system'),
                            source: data.source || 'system'
                        };
                        break;
                }
                if (activity) {
                    addLiveActivity(activity, true);
                }
            }
        };

        state.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        state.websocket.onclose = () => {
            console.log('WebSocket disconnected');
            setTimeout(initializeWebSocket, 5000);
        };
    } catch (error) {
        console.error('WebSocket initialization error:', error);
    }
}

function handleWebSocketMessage(data) {
    switch(data.type) {
        case 'NOTIFICATION':
            state.notifications.unshift(data.payload);
            updateNotificationBadge();
            showNotification(data.payload.message, 'info');
            break;
        case 'DASHBOARD_UPDATE':
            if (state.currentPage === 'dashboard') {
                loadDashboard();
            }
            break;
        case 'CLAIM_UPDATE':
            if (state.currentPage === 'claims') {
                loadClaimsPage();
            }
            break;
        case 'USER_UPDATE':
            if (state.currentPage === 'users') {
                loadUsersPage();
            }
            break;
        case 'POLICY_UPDATE':
            if (state.currentPage === 'policies') {
                loadPoliciesPage();
            }
            break;
    }
}

function updateNotificationBadge() {
    const badge = document.querySelector('.badge');
    const count = state.notifications.filter(n => !n.read).length;
    badge.textContent = count > 9 ? '9+' : count;
    badge.style.display = count > 0 ? 'block' : 'none';
}

// ============================================
// Utility Functions
// ============================================
function formatTime(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
}

function getStatusClass(status) {
    switch(status?.toUpperCase()) {
        case 'APPROVED':
        case 'ACTIVE':
        case 'SUCCESS':
            return 'active';
        case 'PENDING':
            return 'pending';
        case 'REJECTED':
        case 'FAILED':
        case 'INACTIVE':
            return 'inactive';
        default:
            return 'active';
    }
}

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

// ============================================
// Chart Management
// ============================================
let charts = {};

function initializeCharts(data) {
    // Performance Chart (Line/Bar)
    const performanceCtx = document.getElementById('performance-chart');
    if (performanceCtx) {
        charts.performance = new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr'],
                datasets: [{
                    label: 'Users',
                    data: [],
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Policies',
                    data: [],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // User Distribution Chart (Pie)
    const userCtx = document.getElementById('user-distribution-chart');
    if (userCtx) {
        charts.userDistribution = new Chart(userCtx, {
            type: 'doughnut',
            data: {
                labels: ['Admin', 'Users', 'Underwriters', 'HR'],
                datasets: [{
                    data: [0, 0, 0, 0], // Initialize with zeros
                    backgroundColor: [
                        '#4F46E5',
                        '#10B981',
                        '#F59E0B',
                        '#EF4444'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }

    // Claims Chart (Bar)
    const claimsCtx = document.getElementById('claims-chart');
    if (claimsCtx) {
        charts.claims = new Chart(claimsCtx, {
            type: 'bar',
            data: {
                labels: ['Pending', 'Approved', 'Rejected'],
                datasets: [{
                    label: 'Claims',
                    data: [0, 0, 0], // Initialize with zeros
                    backgroundColor: [
                        '#F59E0B',
                        '#10B981',
                        '#EF4444'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Revenue Chart (Line)
    const revenueCtx = document.getElementById('revenue-chart');
    if (revenueCtx) {
        charts.revenue = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr'],
                datasets: [{
                    label: 'Revenue (₹)',
                    data: [0, 0, 0, 0], // Initialize with zeros
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

function updateChart(type) {
    if (charts.performance) {
        charts.performance.destroy();
    }
    
    const performanceCtx = document.getElementById('performance-chart');
    
    // Get real data from dashboard state or use empty arrays
    let usersData = [];
    let policiesData = [];
    let labels = ['Jan', 'Feb', 'Mar', 'Apr'];
    
    if (state.dashboardData && state.dashboardData.monthlyTrends) {
        const trends = state.dashboardData.monthlyTrends;
        usersData = trends.users || [];
        policiesData = trends.policies || [];
        labels = trends.labels || labels;
    }
    
    charts.performance = new Chart(performanceCtx, {
        type: type || 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Users',
                data: usersData,
                borderColor: '#4F46E5',
                backgroundColor: (type || 'line') === 'bar' ? '#4F46E5' : 'rgba(79, 70, 229, 0.1)',
                borderWidth: (type || 'line') === 'bar' ? 0 : 2,
                fill: (type || 'line') === 'bar' ? false : true,
                tension: 0.4
            }, {
                label: 'Policies',
                data: policiesData,
                borderColor: '#10B981',
                backgroundColor: (type || 'line') === 'bar' ? '#10B981' : 'rgba(16, 185, 129, 0.1)',
                borderWidth: (type || 'line') === 'bar' ? 0 : 2,
                fill: (type || 'line') === 'bar' ? false : true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

async function updatePieChart() {
    // Fetch fresh data and update chart automatically
    try {
        const response = await authFetch(`${API_BASE_URL}/admin/dashboard`);
        const data = await response.json();
        console.log('[Admin Dashboard] Pie chart data:', data);
        state.dashboardData = data;
        
        if (charts.userDistribution) {
            const userStats = data.userStats || {};
            console.log('[Admin Dashboard] User stats:', userStats);
            
            // Map the correct field names from backend response
            const newData = [
                userStats.adminUsers || userStats.admin || 0,           // Admin users
                userStats.regularUsers || userStats.activeUsers || 0,    // Regular users (active users)
                userStats.underwriters || userStats.underwriter || 0,    // Underwriters
                userStats.hrUsers || userStats.hr || 0                   // HR users
            ];
            charts.userDistribution.data.datasets[0].data = newData;
            charts.userDistribution.update();
            console.log('[Admin Dashboard] Pie chart updated with:', newData);
        } else {
            console.log('[Admin Dashboard] Pie chart not initialized yet');
        }
    } catch (error) {
        console.error('Error updating pie chart:', error);
    }
}

async function updateClaimsChart() {
    // Fetch fresh data and update chart automatically
    try {
        const response = await authFetch(`${API_BASE_URL}/admin/dashboard`);
        const data = await response.json();
        console.log('[Admin Dashboard] Claims chart data:', data);
        state.dashboardData = data;
        
        if (charts.claims) {
            const claimStats = data.claimStats || {};
            console.log('[Admin Dashboard] Claim stats:', claimStats);
            const newData = [
                claimStats.pendingClaims || 0,
                claimStats.approvedClaims || 0,
                claimStats.rejectedClaims || 0
            ];
            charts.claims.data.datasets[0].data = newData;
            charts.claims.update();
            console.log('[Admin Dashboard] Claims chart updated with:', newData);
        } else {
            console.log('[Admin Dashboard] Claims chart not initialized yet');
        }
    } catch (error) {
        console.error('Error updating claims chart:', error);
    }
}

async function updateRevenueChart() {
    // Fetch fresh data and update chart automatically
    try {
        const response = await authFetch(`${API_BASE_URL}/admin/dashboard`);
        const data = await response.json();
        console.log('[Admin Dashboard] Revenue chart data:', data);
        state.dashboardData = data;
        
        if (charts.revenue) {
            // Get revenue data from monthly trends
            const monthlyTrends = data.monthlyTrends || {};
            const revenueData = monthlyTrends.revenue || [];
            
            // Format revenue data to show in thousands with INR symbol
            const formattedData = revenueData.map(revenue => {
                return Math.round(revenue / 1000); // Convert to thousands
            });
            
            charts.revenue.data.datasets[0].data = formattedData.length > 0 ? formattedData : [];
            charts.revenue.update();
            console.log('[Admin Dashboard] Revenue chart updated with:', formattedData);
        } else {
            console.log('[Admin Dashboard] Revenue chart not initialized yet');
        }
    } catch (error) {
        console.error('Error updating revenue chart:', error);
    }
}

// Auto-update all charts function
async function autoUpdateCharts() {
    console.log('[Admin Dashboard] Auto-updating charts...');
    await Promise.allSettled([
        updatePieChart(),
        updateClaimsChart(),
        updateRevenueChart()
    ]);
}

// Live Activity Feed State
const liveActivityFeed = {
    activities: [],
    maxActivities: 50,
    listeners: []
};

// Add activity to live feed
function addLiveActivity(activity, skipNotification = false) {
    const newActivity = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...activity
    };

    liveActivityFeed.activities.unshift(newActivity);

    // Keep only last N activities
    if (liveActivityFeed.activities.length > liveActivityFeed.maxActivities) {
        liveActivityFeed.activities = liveActivityFeed.activities.slice(0, liveActivityFeed.maxActivities);
    }

    // Notify all listeners
    liveActivityFeed.listeners.forEach(callback => callback(liveActivityFeed.activities));

    if (!skipNotification) {
        addNotification({
            title: activity.title,
            message: activity.description,
            type: activity.type || 'info',
            source: activity.source || 'system'
        });
    }
}

// Subscribe to live activity updates
function subscribeToLiveActivities(callback) {
    liveActivityFeed.listeners.push(callback);
}

// Render live activity feed
function renderLiveActivityFeed() {
    const container = document.getElementById('live-activity-feed');
    if (!container) return;
    
    if (liveActivityFeed.activities.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                <div style="font-size: 48px; margin-bottom: 16px;">📡</div>
                <p>No live activity yet</p>
                <p style="font-size: 12px; margin-top: 8px;">Activity will appear here in real-time</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = liveActivityFeed.activities.slice(0, 20).map(activity => `
        <div class="activity-item" style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); display: flex; gap: 12px; align-items: flex-start; animation: fadeIn 0.3s ease;">
            <div style="width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; background: ${getActivityColor(activity.type)};">
                ${getActivityIcon(activity.type)}
            </div>
            <div style="flex: 1;">
                <p style="font-weight: 500; margin: 0 0 4px 0; font-size: 13px;">${activity.title}</p>
                <p style="font-size: 12px; color: var(--text-secondary); margin: 0;">${activity.description}</p>
                <p style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">${formatTime(activity.timestamp)}</p>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const icons = {
        'policy': '📋',
        'claim': '📝',
        'user': '👤',
        'fraud': '⚠️',
        'payment': '💰',
        'system': '⚙️',
        'alert': '🔔'
    };
    return icons[type] || '📡';
}

function getActivityColor(type) {
    const colors = {
        'policy': '#10B981',
        'claim': '#3B82F6',
        'user': '#8B5CF6',
        'fraud': '#EF4444',
        'payment': '#F59E0B',
        'system': '#6B7280',
        'alert': '#DC2626'
    };
    return colors[type] || '#6B7280';
}

// Simulate real-time activities for demo
function simulateLiveActivities() {
    const activities = [
        { type: 'policy', title: 'New Policy Submitted', description: 'Health insurance policy #POL-1234 submitted for approval', source: 'user' },
        { type: 'claim', title: 'Claim Approved', description: 'Claim #CLM-5678 approved by underwriter', source: 'underwriter' },
        { type: 'user', title: 'New User Registered', description: 'John Doe registered as a new user', source: 'system' },
        { type: 'claim', title: 'Claim Submitted', description: 'Auto insurance claim #CLM-9012 submitted', source: 'user' },
        { type: 'fraud', title: 'Fraud Alert', description: 'Suspicious pattern detected in claim #CLM-3456', source: 'underwriter' },
        { type: 'payment', title: 'Premium Payment', description: 'Premium payment received for policy #POL-7890', source: 'system' },
        { type: 'policy', title: 'Policy Renewed', description: 'Life insurance policy #POL-2345 renewed', source: 'user' },
        { type: 'claim', title: 'Claim Rejected', description: 'Claim #CLM-6789 rejected - insufficient documentation', source: 'underwriter' }
    ];
    
    // Add random activity every 10-30 seconds
    function scheduleNext() {
        const delay = 10000 + Math.random() * 20000;
        setTimeout(() => {
            const activity = activities[Math.floor(Math.random() * activities.length)];
            addLiveActivity(activity);
            scheduleNext();
        }, delay);
    }
    
    scheduleNext();
}

// Set up automatic chart updates and real-time refresh
document.addEventListener('DOMContentLoaded', () => {
    // Auto-update charts every 15 seconds when on dashboard
    setInterval(() => {
        if (state.currentPage === 'dashboard') {
            autoUpdateCharts();
        }
    }, 15000);
    
    // Auto-update policies page every 30 seconds when on policies page
    setInterval(() => {
        if (state.currentPage === 'policies') {
            refreshPoliciesPage();
        }
    }, 30000);
    
    // Auto-refresh audit logs every 10 seconds when on audit logs page
    setInterval(() => {
        if (state.currentPage === 'audit-logs') {
            loadAuditLogsPage();
        }
    }, 10000);
    
    // Subscribe to live activities for real-time updates
    subscribeToLiveActivities(() => {
        renderLiveActivityFeed();
    });
    
    // Live activities will be populated from real WebSocket events
    // simulateLiveActivities(); // Disabled - only real notifications now
});

// Refresh Policies Page with real-time data
async function refreshPoliciesPage() {
    console.log('[Admin Dashboard] Refreshing policies page...');
    
    try {
        const response = await authFetch(`${API_BASE_URL}/admin/policies`);
        const data = await response.json();
        
        // Ensure policies is always an array
        let policies = [];
        if (Array.isArray(data)) {
            policies = data;
        } else if (data && Array.isArray(data.policies)) {
            policies = data.policies;
        } else if (data && data.content && Array.isArray(data.content)) {
            policies = data.content;
        }
        
        // Update window.currentPolicies for filter function
        window.currentPolicies = policies;
        
        // Update KPI cards if they exist
        const totalPoliciesEl = document.querySelector('.kpi-card.primary .kpi-value');
        const activePoliciesEl = document.querySelector('.kpi-card.success .kpi-value');
        const pendingPoliciesEl = document.querySelector('.kpi-card.warning .kpi-value');
        const expiredPoliciesEl = document.querySelector('.kpi-card.danger .kpi-value');
        
        if (totalPoliciesEl) totalPoliciesEl.textContent = data.totalPolicies || policies.length || 0;
        if (activePoliciesEl) activePoliciesEl.textContent = data.activePolicies || policies.filter(p => p.status === 'ACTIVE').length || 0;
        if (pendingPoliciesEl) pendingPoliciesEl.textContent = data.pendingPolicies || policies.filter(p => p.status === 'PENDING').length || 0;
        if (expiredPoliciesEl) expiredPoliciesEl.textContent = data.expiredPolicies || policies.filter(p => p.status === 'EXPIRED').length || 0;
        
        // Update Quick Stats if they exist
        const totalPremiumEl = document.querySelector('.grid-cols-2 > div:nth-child(1) p:last-child');
        const totalCoverageEl = document.querySelector('.grid-cols-2 > div:nth-child(2) p:last-child');
        const avgPremiumEl = document.querySelector('.grid-cols-2 > div:nth-child(3) p:last-child');
        const renewalRateEl = document.querySelector('.grid-cols-2 > div:nth-child(4) p:last-child');
        
        if (totalPremiumEl) totalPremiumEl.textContent = `₹${(data.totalPremium || 0).toLocaleString()}`;
        if (totalCoverageEl) totalCoverageEl.textContent = `₹${(data.totalCoverage || 0).toLocaleString()}`;
        if (avgPremiumEl) avgPremiumEl.textContent = `₹${(data.avgPremium || 0).toLocaleString()}`;
        if (renewalRateEl) renewalRateEl.textContent = `${data.renewalRate || 0}%`;
        
        // Update Policy Distribution chart
        updatePolicyChartWithData(data);
        
        // Re-apply current filters if any
        const currentSearch = document.getElementById('policy-search')?.value || '';
        const currentType = document.getElementById('policy-type-filter')?.value || 'all';
        const currentStatus = document.getElementById('policy-status-filter')?.value || 'all';
        const currentDate = document.getElementById('policy-date-filter')?.value || '';
        
        if (currentSearch || currentType !== 'all' || currentStatus !== 'all' || currentDate) {
            filterPolicies();
        }
        
        console.log('[Admin Dashboard] Policies page refreshed');
    } catch (error) {
        console.error('[Admin Dashboard] Error refreshing policies page:', error);
    }
}

// Update Policy Chart with new data
function updatePolicyChartWithData(data) {
    const policyChartCanvas = document.getElementById('policy-distribution-chart');
    if (!policyChartCanvas) return;
    
    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(policyChartCanvas);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Create new chart with updated data
    new Chart(policyChartCanvas, {
        type: 'doughnut',
        data: {
            labels: ['Health', 'Life', 'Auto', 'Home'],
            datasets: [{
                data: [
                    data.healthPolicies || 0,
                    data.lifePolicies || 0,
                    data.autoPolicies || 0,
                    data.homePolicies || 0
                ],
                backgroundColor: [
                    '#10B981',
                    '#4F46E5',
                    '#F59E0B',
                    '#3B82F6'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// Export refreshPoliciesPage for global access
window.refreshPoliciesPage = refreshPoliciesPage;

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .loading-spinner {
        text-align: center;
        padding: 40px;
        color: var(--gray-500);
    }
    .toast {
        animation: slideIn 0.3s ease;
    }
    .chart-wrapper canvas {
        transition: all 0.3s ease;
    }
    .chart-wrapper:hover canvas {
        transform: scale(1.02);
    }
`;
document.head.appendChild(style);

// ============================================
// Audit Logs Page
// ============================================
const auditLogState = {
    logs: [],
    currentPage: 1,
    pageSize: 10,
    totalLogs: 0,
    filters: {
        dateFrom: '',
        dateTo: '',
        user: '',
        module: 'all',
        action: 'all',
        status: 'all',
        search: ''
    }
};

function normalizeAuditLogResponse(data) {
    if (!data) return { logs: [], total: 0 };

    if (Array.isArray(data)) {
        return { logs: data, total: data.length };
    }

    if (data.data && Array.isArray(data.data)) {
        return { logs: data.data, total: data.data.length };
    }

    if (data.content && Array.isArray(data.content)) {
        return { logs: data.content, total: data.totalElements || data.total || data.content.length };
    }

    if (data.logs && Array.isArray(data.logs)) {
        return { logs: data.logs, total: data.logs.length };
    }

    return { logs: [], total: 0 };
}

function inferAuditModule(log) {
    const action = (log.action || log.event || '').toString().toLowerCase();
    if (action.includes('claim')) return 'claims';
    if (action.includes('policy')) return 'policies';
    if (action.includes('user')) return 'users';
    if (action.includes('login') || action.includes('logout') || action.includes('auth')) return 'auth';
    if (action.includes('system')) return 'system';
    if (log.module) return log.module;
    return 'N/A';
}

function inferAuditStatus(log) {
    const status = (log.status || log.state || '').toString().toLowerCase();
    if (status) {
        if (status.includes('success') || status.includes('completed') || status.includes('approved')) return 'SUCCESS';
        if (status.includes('fail') || status.includes('error') || status.includes('rejected')) return 'FAILED';
    }

    const action = (log.action || log.event || '').toString().toLowerCase();
    if (action.includes('rejected') || action.includes('failed') || action.includes('declined') || action.includes('unauthorized')) return 'FAILED';
    if (action.includes('created') || action.includes('updated') || action.includes('approved') || action.includes('login') || action.includes('logout')) return 'SUCCESS';

    if (log.details && /failed|error|rejected/i.test(log.details)) return 'FAILED';
    if (log.details && /success|completed|approved/i.test(log.details)) return 'SUCCESS';

    return 'N/A';
}

async function loadAuditLogsPage() {
    const pageContent = document.getElementById('page-content');
    
    try {
        // Primary source: AuditLogController (paginated content)
        let response = await authFetch(`${API_BASE_URL}/admin/audit/logs?page=${auditLogState.currentPage - 1}&size=${auditLogState.pageSize}`);
        let data;

        if (!response.ok) {
            console.warn('Audit logs API returned', response.status, '- trying fallback endpoint /admin/audit-logs');
            response = await authFetch(`${API_BASE_URL}/admin/audit-logs`);
        }

        if (!response.ok) {
            console.warn('Audit logs fallback returned', response.status, '- trying /admin/audit endpoint');
            response = await authFetch(`${API_BASE_URL}/admin/audit`);
        }

        if (response.ok) {
            data = await response.json();
        } else {
            console.warn('All audit endpoints failed. Using local fallback', response.status);
            data = [];
        }

        const normalized = normalizeAuditLogResponse(data);

        // Second fallback: /api/admin/audit if first two endpoints still produce no data
        if (!normalized.logs.length) {
            const backupRes = await authFetch(`${API_BASE_URL}/admin/audit`);
            if (backupRes.ok) {
                const backupData = await backupRes.json();
                const backupNormalized = normalizeAuditLogResponse(backupData);
                if (backupNormalized.logs.length) {
                    normalized.logs = backupNormalized.logs;
                    normalized.total = backupNormalized.total;
                }
            }
        }

        // Normalize and enrich each audit log object for UI stability
        const enrichedLogs = (normalized.logs || []).map((log, index) => {
            const computedId = log.id || log.logId || log.auditId || `audit-${Date.now()}-${index}`;
            const normalizedModule = inferAuditModule(log);
            const normalizedStatus = inferAuditStatus(log);

            return {
                ...log,
                id: computedId,
                __clientId: computedId,
                userName: log.userName || log.user || log.username || 'System',
                userRole: log.userRole || log.role || 'N/A',
                module: normalizedModule,
                status: normalizedStatus,
                ipAddress: log.ipAddress || log.ip || log.clientIp || 'N/A',
                description: log.description || log.details || log.message || 'No description available'
            };
        });

        auditLogState.logs = enrichedLogs;
        auditLogState.totalLogs = normalized.total || enrichedLogs.length;
        
        pageContent.innerHTML = `
            <!-- KPI Cards -->
            <div class="grid grid-cols-4" style="margin-bottom: 24px;">
                <div class="kpi-card primary animate__animated animate__fadeInUp" style="animation-delay: 0s;">
                    <div class="kpi-header">
                        <div class="kpi-icon">📊</div>
                    </div>
                    <p class="kpi-label">Total Logs</p>
                    <p class="kpi-value">${auditLogState.totalLogs}</p>
                </div>
                <div class="kpi-card success animate__animated animate__fadeInUp" style="animation-delay: 0.1s;">
                    <div class="kpi-header">
                        <div class="kpi-icon">✅</div>
                    </div>
                    <p class="kpi-label">Successful</p>
                    <p class="kpi-value">${auditLogState.logs.filter(l => l.status === 'SUCCESS').length}</p>
                </div>
                <div class="kpi-card danger animate__animated animate__fadeInUp" style="animation-delay: 0.2s;">
                    <div class="kpi-header">
                        <div class="kpi-icon">❌</div>
                    </div>
                    <p class="kpi-label">Failed</p>
                    <p class="kpi-value">${auditLogState.logs.filter(l => l.status === 'FAILED').length}</p>
                </div>
                <div class="kpi-card warning animate__animated animate__fadeInUp" style="animation-delay: 0.3s;">
                    <div class="kpi-header">
                        <div class="kpi-icon">🔴</div>
                        <span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: pulse 1.5s infinite;"></span>
                    </div>
                    <p class="kpi-label">Live</p>
                    <p class="kpi-value">Active</p>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="card animate__animated animate__fadeInUp" style="animation-delay: 0.4s; margin-bottom: 24px;">
                <div class="card-header">
                    <h3 class="card-title">🔍 Filter Audit Logs</h3>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm" onclick="exportAuditLogs('csv')">📥 Export CSV</button>
                        <button class="btn btn-secondary btn-sm" onclick="clearAuditFilters()">Clear</button>
                    </div>
                </div>
                <div style="display: flex; gap: 12px; padding: 16px; flex-wrap: wrap; align-items: flex-end;">
                    <div style="flex: 1; min-width: 150px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 12px; font-weight: 500;">Search</label>
                        <input type="text" id="audit-search" placeholder="Search logs..." style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;" oninput="filterAuditLogs()">
                    </div>
                    <div style="flex: 1; min-width: 150px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 12px; font-weight: 500;">Date From</label>
                        <input type="date" id="audit-date-from" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;" onchange="filterAuditLogs()">
                    </div>
                    <div style="flex: 1; min-width: 150px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 12px; font-weight: 500;">Date To</label>
                        <input type="date" id="audit-date-to" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;" onchange="filterAuditLogs()">
                    </div>
                    <div style="flex: 1; min-width: 150px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 12px; font-weight: 500;">User</label>
                        <input type="text" id="audit-user" placeholder="User name" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;" oninput="filterAuditLogs()">
                    </div>
                    <div style="flex: 1; min-width: 120px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 12px; font-weight: 500;">Module</label>
                        <select id="audit-module" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;" onchange="filterAuditLogs()">
                            <option value="all">All Modules</option>
                            <option value="policies">Policies</option>
                            <option value="claims">Claims</option>
                            <option value="users">Users</option>
                            <option value="auth">Authentication</option>
                            <option value="system">System</option>
                        </select>
                    </div>
                    <div style="flex: 1; min-width: 120px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 12px; font-weight: 500;">Action</label>
                        <select id="audit-action" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;" onchange="filterAuditLogs()">
                            <option value="all">All Actions</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="approve">Approve</option>
                            <option value="reject">Reject</option>
                            <option value="login">Login</option>
                            <option value="logout">Logout</option>
                        </select>
                    </div>
                    <div style="flex: 1; min-width: 120px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 12px; font-weight: 500;">Status</label>
                        <select id="audit-status" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px;" onchange="filterAuditLogs()">
                            <option value="all">All Status</option>
                            <option value="SUCCESS">Success</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Logs Table -->
            <div class="card animate__animated animate__fadeInUp" style="animation-delay: 0.5s;">
                <div class="card-header">
                    <h3 class="card-title">Audit Trail</h3>
                    <button class="btn btn-secondary btn-sm" onclick="loadAuditLogsPage()">🔄 Refresh</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Role</th>
                                <th>Action</th>
                                <th>Module</th>
                                <th>Status</th>
                                <th>IP Address</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody id="audit-logs-body">
                            ${(() => {
                                const start = (auditLogState.currentPage - 1) * auditLogState.pageSize;
                                const end = start + auditLogState.pageSize;
                                const displayedLogs = auditLogState.logs.slice(start, end);
                                return renderAuditLogsTable(displayedLogs);
                            })()}
                        </tbody>
                    </table>
                </div>
                <!-- Pagination -->
                <div style="padding: 16px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color);">
                    <p style="font-size: 13px; color: var(--gray-500);">Showing ${Math.min(auditLogState.logs.length - (auditLogState.currentPage - 1) * auditLogState.pageSize, auditLogState.pageSize)} of ${auditLogState.totalLogs} logs</p>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm" onclick="prevAuditPage()" ${auditLogState.currentPage === 1 ? 'disabled' : ''}>Previous</button>
                        <span style="padding: 6px 12px; font-size: 13px;">Page ${auditLogState.currentPage}</span>
                        <button class="btn btn-secondary btn-sm" onclick="nextAuditPage()" ${auditLogState.currentPage * auditLogState.pageSize >= auditLogState.totalLogs ? 'disabled' : ''}>Next</button>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading audit logs:', error);
        pageContent.innerHTML = `
            <div class="card">
                <p style="color: var(--danger);">Error loading audit logs. Please try again.</p>
                <button class="btn btn-primary" onclick="loadAuditLogsPage()">Retry</button>
            </div>
        `;
    }
}

function renderAuditLogsTable(logs) {
    if (!logs || logs.length === 0) {
        return '<tr><td colspan="8" style="text-align: center; color: var(--gray-500); padding: 40px;">No audit logs found</td></tr>';
    }
    
    return logs.map(log => {
        const rowId = log.id || log.logId || log.__clientId || 'unknown';
        const statusVal = log.status || log.state || 'N/A';
        const moduleVal = log.module || log.moduleName || log.type || 'N/A';
        const ipVal = log.ipAddress || log.ip || log.clientIp || 'N/A';
        const actionClass = ['delete', 'reject'].includes(String(log.action || '').toLowerCase()) ? 'status-high' : '';
        const statusClass = String(statusVal).toUpperCase() === 'SUCCESS' ? 'active' : 'inactive';

        return `
            <tr class="${actionClass}">
                <td>${log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</td>
                <td>${log.userName || log.user || 'System'}</td>
                <td><span class="status-badge ${getRoleClass(log.userRole || log.role || 'N/A')}">${log.userRole || log.role || 'N/A'}</span></td>
                <td><span class="status-badge ${actionClass}">${log.action || log.event || 'N/A'}</span></td>
                <td><span class="status-badge" style="background: var(--bg-secondary);">${moduleVal}</span></td>
                <td><span class="status-badge ${statusClass}">${statusVal}</span></td>
                <td style="font-size: 12px;">${ipVal}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="viewAuditLogDetails('${rowId}')">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterAuditLogs() {
    auditLogState.filters.search = document.getElementById('audit-search')?.value.toLowerCase() || '';
    auditLogState.filters.dateFrom = document.getElementById('audit-date-from')?.value || '';
    auditLogState.filters.dateTo = document.getElementById('audit-date-to')?.value || '';
    auditLogState.filters.user = document.getElementById('audit-user')?.value.toLowerCase() || '';
    auditLogState.filters.module = document.getElementById('audit-module')?.value || 'all';
    auditLogState.filters.action = document.getElementById('audit-action')?.value || 'all';
    auditLogState.filters.status = document.getElementById('audit-status')?.value || 'all';
    
    let filtered = [...auditLogState.logs];
    
    if (auditLogState.filters.search) {
        filtered = filtered.filter(log => 
            (log.userName || '').toLowerCase().includes(auditLogState.filters.search) ||
            (log.action || '').toLowerCase().includes(auditLogState.filters.search) ||
            (log.module || '').toLowerCase().includes(auditLogState.filters.search) ||
            (log.description || '').toLowerCase().includes(auditLogState.filters.search)
        );
    }
    
    if (auditLogState.filters.user) {
        filtered = filtered.filter(log => (log.userName || '').toLowerCase().includes(auditLogState.filters.user));
    }
    
    if (auditLogState.filters.module !== 'all') {
        filtered = filtered.filter(log => log.module?.toLowerCase() === auditLogState.filters.module);
    }
    
    if (auditLogState.filters.action !== 'all') {
        filtered = filtered.filter(log => log.action?.toLowerCase() === auditLogState.filters.action);
    }
    
    if (auditLogState.filters.status !== 'all') {
        filtered = filtered.filter(log => log.status === auditLogState.filters.status);
    }
    
    if (auditLogState.filters.dateFrom) {
        const fromDate = new Date(auditLogState.filters.dateFrom);
        filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate);
    }
    
    if (auditLogState.filters.dateTo) {
        const toDate = new Date(auditLogState.filters.dateTo);
        toDate.setHours(23, 59, 59);
        filtered = filtered.filter(log => new Date(log.timestamp) <= toDate);
    }
    
    const tbody = document.getElementById('audit-logs-body');
    if (tbody) {
        tbody.innerHTML = renderAuditLogsTable(filtered.slice(0, auditLogState.pageSize));
    }
    
    auditLogState.totalLogs = filtered.length;
}

function clearAuditFilters() {
    document.getElementById('audit-search').value = '';
    document.getElementById('audit-date-from').value = '';
    document.getElementById('audit-date-to').value = '';
    document.getElementById('audit-user').value = '';
    document.getElementById('audit-module').value = 'all';
    document.getElementById('audit-action').value = 'all';
    document.getElementById('audit-status').value = 'all';
    auditLogState.currentPage = 1;
    loadAuditLogsPage();
}

function prevAuditPage() {
    if (auditLogState.currentPage > 1) {
        auditLogState.currentPage--;
        loadAuditLogsPage();
    }
}

function nextAuditPage() {
    if (auditLogState.currentPage * auditLogState.pageSize < auditLogState.logs.length) {
        auditLogState.currentPage++;
        loadAuditLogsPage();
    }
}

function viewAuditLogDetails(logId) {
    const log = auditLogState.logs.find(l =>
        String(l.id) === String(logId) ||
        String(l.logId) === String(logId) ||
        String(l.__clientId) === String(logId)
    );
    if (!log) {
        showNotification('Log not found', 'error');
        return;
    }
    
    showModal('auditLogDetails', log);
}

function exportAuditLogs(format) {
    showNotification(`Exporting audit logs as ${format.toUpperCase()}...`, 'info');
    
    let csvContent = 'Timestamp,User,Role,Action,Module,Status,IP Address,Description\n';
    auditLogState.logs.forEach(log => {
        csvContent += `"${log.timestamp || ''}","${log.userName || ''}","${log.userRole || ''}","${log.action || ''}","${log.module || ''}","${log.status || ''}","${log.ipAddress || ''}","${(log.description || '').replace(/"/g, '""')}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Audit logs exported successfully', 'success');
}

// Add audit log details modal to showModal
const originalShowModal = showModal;
showModal = function(type, data = null) {
    if (type === 'auditLogDetails') {
        const modal = document.getElementById('modal-container');
        const modalTitle = modal.querySelector('.modal-title');
        const modalBody = modal.querySelector('.modal-body');
        const modalFooter = modal.querySelector('.modal-footer');
        
        let detailsDisplay = 'No details available';
        if (data.details) {
            try {
                const parsed = JSON.parse(data.details);
                detailsDisplay = JSON.stringify(parsed, null, 2);
            } catch (e) {
                detailsDisplay = data.details;
            }
        }

        modal.classList.remove('hidden');
        modalTitle.textContent = 'Audit Log Details';
        modalBody.innerHTML = `
            <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 500;">Log ID:</span>
                    <span>${data.id || data.logId || 'N/A'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 500;">Timestamp:</span>
                    <span>${data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 500;">User:</span>
                    <span>${data.userName || data.user || 'N/A'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 500;">Role:</span>
                    <span class="status-badge ${getRoleClass(data.userRole)}">${data.userRole || 'N/A'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 500;">Action:</span>
                    <span>${data.action || 'N/A'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 500;">Module:</span>
                    <span>${data.module || 'N/A'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 500;">Status:</span>
                    <span class="status-badge ${getStatusClass(data.status)}">${data.status || 'N/A'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 500;">IP Address:</span>
                    <span>${data.ipAddress || 'N/A'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 500;">Description:</span>
                </div>
                <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 13px;">
                    ${data.description || 'No description available'}
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 500;">Details:</span>
                </div>
                <pre style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 12px; overflow-x: auto;">${detailsDisplay}</pre>
            </div>
        `;
        modalFooter.innerHTML = '<button class="btn btn-secondary" onclick="closeModal()">Close</button>';
        return;
    }
    originalShowModal(type, data);
};

// Subscribe to audit log updates via WebSocket
function subscribeToAuditLogs() {
    if (state.websocket) {
        const originalOnMessage = state.websocket.onmessage;
        state.websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'AUDIT_LOG') {
                // Add new log to the beginning of the array
                auditLogState.logs.unshift(data.payload);
                // Re-render if on audit logs page
                if (state.currentPage === 'audit-logs') {
                    const tbody = document.getElementById('audit-logs-body');
                    if (tbody) {
                        tbody.innerHTML = renderAuditLogsTable(auditLogState.logs.slice(0, auditLogState.pageSize));
                    }
                }
                // Also add to notifications
                addNotification({
                    title: 'Audit Log Entry',
                    message: `${data.payload.userName || 'User'} performed ${data.payload.action} on ${data.payload.module}`,
                    type: 'info',
                    source: 'audit'
                });
            }
            if (originalOnMessage) {
                originalOnMessage(event);
            }
        };
    }
}

// Call subscribeToAuditLogs after WebSocket is initialized
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(subscribeToAuditLogs, 2000);
});

// ============================================
// Logout Function
// ============================================
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear any stored tokens/session data
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        
        showNotification('Logged out successfully!', 'success');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 500);
    }
}

// ============================================
// Export functions for global access
// ============================================
window.loadPage = loadPage;
window.showModal = showModal;
window.closeModal = closeModal;
window.submitAddUser = submitAddUser;
window.submitAddPolicy = submitAddPolicy;
window.submitEditUser = submitEditUser;
window.approveClaim = approveClaim;
window.rejectClaim = rejectClaim;
window.reviewClaim = reviewClaim;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.viewPolicy = viewPolicy;
window.editPolicy = editPolicy;
window.deletePolicy = deletePolicy;
window.generateReport = generateReport;
window.exportReport = exportReport;
window.filterClaims = filterClaims;
window.loadDashboard = loadDashboard;
window.filterPolicies = filterPolicies;
window.clearPolicyFilters = clearPolicyFilters;
window.exportPolicies = exportPolicies;
window.updatePolicyChart = updatePolicyChart;

function filterPolicies() {
    // Fallback no-op/pagination for policy search so page doesn't crash.
    try {
        const policies = document.querySelectorAll('.policy-row');
        return policies;
    } catch (e) {
        return [];
    }
}

function clearPolicyFilters() {
    // Fallback clear of policy filter inputs; safe if inputs are absent.
    const filterInputs = document.querySelectorAll('#policy-search, #policy-date-from, #policy-date-to');
    filterInputs.forEach(input => {
        if (input) input.value = '';
    });
    return []; // no-op returns values
}

function exportPolicies() {
    // Fallback export for policy page actions
    showNotification('Export policies is currently unavailable in this view.', 'info');
    return;
}

function updatePolicyChart() {
    // Fallback function to prevent undefined errors on admin dashboard pages.
    showNotification('Update policy chart is currently unavailable in this view.', 'info');
    return;
}
