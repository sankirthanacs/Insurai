 /**
 * InsurAI User Dashboard - JavaScript
 * Handles navigation, interactions, and API integration
 * Connected to backend and other dashboards
 */

// Dashboard State
const dashboardState = {
  currentPage: 'dashboard',
  user: null,
  policies: [],
  claims: [],
  notifications: [],
  documents: [],
  backendConnected: false,
  userRole: 'user'
};

// API Configuration
window.API_HOST = window.__API_URL__ || 'https://insurai-lhup.onrender.com';
window.API_BASE_URL = window.API_BASE_URL || `${window.API_HOST}/api`;

const API_CONFIG = {
  baseUrl: window.API_BASE_URL || `${window.API_HOST}/api`,
  endpoints: {
    // User endpoints
    userProfile: '/user/profile',
    userPolicies: '/policies/my-policies',
    userClaims: '/claims/user',
    userNotifications: '/notifications/user',
    notificationRead: '/notifications',
    markAllRead: '/notifications/mark-all-read',
    userDocuments: '/documents/user',
    submitClaim: '/claims/submit',
    uploadDocument: '/documents/upload',
    supportTickets: '/support/tickets',
    createTicket: '/support/tickets',
    supportContact: '/support/contact',
    
    // Real-time endpoints
    notifications: '/notifications/stream',
    claims: '/claims/stream'
  }
};


// DOM Elements
const elements = {
  sidebar: document.getElementById('sidebar'),
  hamburgerBtn: document.getElementById('hamburger-btn'),
  pageTitle: document.getElementById('page-title'),
  pageSubtitle: document.getElementById('page-subtitle'),
  pageContent: document.getElementById('page-content'),
  notificationBtn: document.getElementById('notification-btn'),
  notificationBadge: document.getElementById('notification-badge'),
  searchInput: document.getElementById('search-input'),
  logoutBtn: document.getElementById('logout-btn'),
  claimForm: document.getElementById('claim-form'),
  chatInput: document.getElementById('chat-input'),
  chatMessages: document.getElementById('chat-messages')
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
  initializeDashboard();
  setupEventListeners();
  loadUserData();
  
  // Connect to backend and setup real-time updates
  connectToBackend().then(() => {
    if (dashboardState.backendConnected) {
      setupRealTimeUpdates();
      loadSupportTickets(); // Load support tickets on page load
    }
  });
});

// Initialize Dashboard
function initializeDashboard() {
  // Set initial page
  navigateTo('dashboard');
  
  // Check for mobile view
  if (window.innerWidth <= 1024) {
    elements.sidebar.classList.remove('open');
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Hamburger menu toggle
  if (elements.hamburgerBtn) {
    elements.hamburgerBtn.addEventListener('click', toggleSidebar);
  }

  // Sidebar navigation
  const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = this.getAttribute('data-page');
      navigateTo(page);
      
      // Close sidebar on mobile
      if (window.innerWidth <= 1024) {
        elements.sidebar.classList.remove('open');
      }
    });
  });

  // Logout button
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  }

  // Claim form submission
  if (elements.claimForm) {
    elements.claimForm.addEventListener('submit', handleClaimSubmit);
  }

  // Chat input
  if (elements.chatInput) {
    elements.chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }

  // Search functionality
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', handleSearch);
    elements.searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        triggerSearch();
      }
    });
  }

  // Notifications button click (open notifications view)
  if (elements.notificationBtn) {
    elements.notificationBtn.addEventListener('click', function (e) {
      e.preventDefault();
      navigateTo('notifications');
      loadNotificationsFromBackend();
    });
  }

  // Window resize handler
  window.addEventListener('resize', handleResize);

  // File upload handlers
  setupFileUpload();
}

// Navigate to Page
function navigateTo(page) {
  // Update state
  dashboardState.currentPage = page;

  // Update active menu item
  const menuItems = document.querySelectorAll('.sidebar-menu a');
  menuItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-page') === page) {
      item.classList.add('active');
    }
  });

  // Hide all pages
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));

  // Show selected page
  const selectedPage = document.getElementById(`${page}-page`);
  if (selectedPage) {
    selectedPage.classList.add('active');
  }

  // Update header
  updatePageHeader(page);

  // Load page-specific data
  loadPageData(page);

  // Setup filter listeners for specific pages
  setTimeout(() => {
    setupPageFilters(page);
  }, 100);
}

// Store filter listener references to properly remove them
const filterListeners = {
  claimStatusFilter: null,
  policySearch: null,
  policyFilter: null
};

// Setup filter event listeners for specific pages
function setupPageFilters(page) {
  if (page === 'my-claims') {
    const statusFilter = document.getElementById('claim-status-filter');
    if (!statusFilter) return;
    
    // Remove old listener if exists
    if (filterListeners.claimStatusFilter) {
      statusFilter.removeEventListener('change', filterListeners.claimStatusFilter);
    }
    
    // Create and attach new listener
    const claimStatusHandler = function() {
      const status = this.value;
      console.log('Filtering claims by status:', status);
      console.log('Total claims in state:', dashboardState.claims.length);
      
      const filteredClaims = status === 'all' 
        ? dashboardState.claims 
        : dashboardState.claims.filter(claim => {
          const claimStatus = (claim.status || '').toString().toLowerCase();
          console.log('Claim status:', claimStatus, 'Filter:', status.toLowerCase());
          return claimStatus === status.toLowerCase();
        });
      
      console.log('Filtered claims count:', filteredClaims.length);
      updateClaimsTable(filteredClaims);
    };
    
    statusFilter.addEventListener('change', claimStatusHandler);
    filterListeners.claimStatusFilter = claimStatusHandler;
  }
  
  if (page === 'my-policies') {
    const policySearch = document.getElementById('policy-search');
    const policyFilter = document.getElementById('policy-filter');
    
    if (policySearch) {
      // Remove old listener if exists
      if (filterListeners.policySearch) {
        policySearch.removeEventListener('input', filterListeners.policySearch);
      }
      
      const policySearchHandler = function() {
        const searchTerm = this.value;
        const filterValue = policyFilter ? policyFilter.value : 'all';
        console.log('Searching policies:', searchTerm, 'Filter:', filterValue);
        filterAndSearchPolicies(searchTerm, filterValue);
      };
      
      policySearch.addEventListener('input', policySearchHandler);
      filterListeners.policySearch = policySearchHandler;
    }
    
    if (policyFilter) {
      // Remove old listener if exists
      if (filterListeners.policyFilter) {
        policyFilter.removeEventListener('change', filterListeners.policyFilter);
      }
      
      const policyFilterHandler = function() {
        const filterValue = this.value;
        const searchTerm = policySearch ? policySearch.value : '';
        console.log('Filtering policies:', filterValue, 'Search:', searchTerm);
        filterAndSearchPolicies(searchTerm, filterValue);
      };
      
      policyFilter.addEventListener('change', policyFilterHandler);
      filterListeners.policyFilter = policyFilterHandler;
    }
  }
}

// Update Page Header
function updatePageHeader(page) {
  const pageTitles = {
    'dashboard': { title: 'Dashboard', subtitle: 'Welcome back! Here\'s your insurance overview.' },
    'file-claim': { title: 'File a Claim', subtitle: 'Submit a new insurance claim.' },
    'my-claims': { title: 'My Claims', subtitle: 'Track and manage your insurance claims.' },
    'my-policies': { title: 'My Policies', subtitle: 'View and manage your insurance policies.' },
    'documents': { title: 'Documents Center', subtitle: 'Upload and manage your documents.' },
    'notifications': { title: 'Notifications', subtitle: 'Stay updated with important alerts.' },
    'support': { title: 'Support', subtitle: 'Get help and submit support tickets.' },
    'assistant': { title: 'AI Assistant', subtitle: 'Get instant help from our AI assistant.' },
    'profile': { title: 'My Profile', subtitle: 'Manage your account settings.' }
  };

  const pageInfo = pageTitles[page] || { title: 'Dashboard', subtitle: 'Welcome back!' };
  
  if (elements.pageTitle) {
    elements.pageTitle.textContent = pageInfo.title;
  }
  if (elements.pageSubtitle) {
    elements.pageSubtitle.textContent = pageInfo.subtitle;
  }
}

// Toggle Sidebar
function toggleSidebar() {
  elements.sidebar.classList.toggle('open');
}

// Handle Window Resize
function handleResize() {
  if (window.innerWidth > 1024) {
    elements.sidebar.classList.remove('open');
  }
}

// Load User Data
async function loadUserData() {
  try {
    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    
    console.log('📊 Loading user data...');
    console.log('📊 Current localStorage:', {
      authToken: token ? 'EXISTS' : 'MISSING',
      userEmail: userEmail,
      userRole: userRole
    });
    
    if (!token) {
      console.warn('⚠️ No auth token found, using default user data');
      return;
    }

    console.log('📡 Fetching user profile from:', `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userProfile}`);
    
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userProfile}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        // ✅ FIX: Add cache-busting headers
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (response.ok) {
      const userData = await response.json();
      console.log('✅ User data loaded successfully:', userData);
      console.log('✅ User email from API:', userData.email);
      console.log('✅ User email from localStorage:', userEmail);
      
      // ✅ FIX: Verify the loaded data matches the logged-in user
      if (userData.email && userEmail && userData.email.toLowerCase() !== userEmail.toLowerCase()) {
        console.error('❌ MISMATCH: API returned data for different user!');
        console.error('❌ Expected:', userEmail);
        console.error('❌ Got:', userData.email);
        console.error('❌ This indicates a caching or authentication issue!');
      }
      
      dashboardState.user = userData;
      updateUserInterface(userData);
    } else {
      console.error('❌ Failed to load user data:', response.status);
      // Fallback to localStorage data
      const fallbackData = {
        name: localStorage.getItem('userName') || 'User',
        email: localStorage.getItem('userEmail') || '',
        phone: '',
        avatar: localStorage.getItem('userName')?.charAt(0) || 'U'
      };
      dashboardState.user = fallbackData;
      updateUserInterface(fallbackData);
    }
  } catch (error) {
    console.error('❌ Error loading user data:', error);
    // Fallback to localStorage data
    const fallbackData = {
      name: localStorage.getItem('userName') || 'User',
      email: localStorage.getItem('userEmail') || '',
      phone: '',
      avatar: localStorage.getItem('userName')?.charAt(0) || 'U'
    };
    dashboardState.user = fallbackData;
    updateUserInterface(fallbackData);
  }
}

// Update User Interface
function updateUserInterface(userData) {
  // Update user name
  const userNameElement = document.getElementById('user-name');
  if (userNameElement) {
    userNameElement.textContent = userData.name || userData.fullName || 'User';
  }
  
  // Update user email
  const userEmailElement = document.getElementById('user-email');
  if (userEmailElement) {
    userEmailElement.textContent = userData.email || '';
  }
  
  // Update user phone
  const userPhoneElement = document.getElementById('user-phone');
  if (userPhoneElement) {
    userPhoneElement.textContent = userData.phone || userData.phoneNumber || '';
  }
  
  // Update user avatar
  const userAvatarElement = document.getElementById('user-avatar');
  if (userAvatarElement) {
    const avatarLetter = userData.name?.charAt(0) || userData.fullName?.charAt(0) || 'U';
    userAvatarElement.textContent = avatarLetter.toUpperCase();
  }
  
  // Update profile page if on profile page
  if (dashboardState.currentPage === 'profile') {
    updateProfilePage(userData);
  }
}

// Update Profile Page
function updateProfilePage(userData) {
  const profileNameElement = document.getElementById('profile-name');
  if (profileNameElement) {
    profileNameElement.textContent = userData.name || userData.fullName || 'User';
  }
  
  const profileEmailElement = document.getElementById('profile-email');
  if (profileEmailElement) {
    profileEmailElement.textContent = userData.email || '';
  }
  
  const profilePhoneElement = document.getElementById('profile-phone');
  if (profilePhoneElement) {
    profilePhoneElement.textContent = userData.phone || userData.phoneNumber || '';
  }
  
  const profileAddressElement = document.getElementById('profile-address');
  if (profileAddressElement) {
    profileAddressElement.textContent = userData.address || '';
  }
}

// Update User Interface
function updateUserInterface(userData) {
  // Handle both backend format (firstName/lastName) and fallback format (name)
  const displayName = userData.fullName || 
    (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData.name) || 'User';
  const displayEmail = userData.email || '';
  const displayPhone = userData.phoneNumber || userData.phone || '';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Update user avatar
  const userAvatar = document.getElementById('user-avatar');
  if (userAvatar) {
    userAvatar.textContent = avatarLetter;
  }

  // Update user name
  const userName = document.getElementById('user-name');
  if (userName) {
    userName.textContent = displayName;
  }

  // Update profile page
  const profileAvatar = document.getElementById('profile-avatar');
  if (profileAvatar) {
    profileAvatar.textContent = avatarLetter;
  }

  const profileName = document.getElementById('profile-name');
  if (profileName) {
    profileName.textContent = displayName;
  }

  const profileEmail = document.getElementById('profile-email');
  if (profileEmail) {
    profileEmail.textContent = displayEmail;
  }

  const profilePhone = document.getElementById('profile-phone');
  if (profilePhone) {
    profilePhone.textContent = displayPhone;
  }

  // Update detail fields
  const detailName = document.getElementById('detail-name');
  if (detailName) {
    detailName.textContent = displayName;
  }

  const detailEmail = document.getElementById('detail-email');
  if (detailEmail) {
    detailEmail.textContent = displayEmail;
  }

  const detailPhone = document.getElementById('detail-phone');
  if (detailPhone) {
    detailPhone.textContent = displayPhone;
  }
}

// Load Page Data
function loadPageData(page) {
  switch (page) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'my-claims':
      loadClaimsData();
      break;
    case 'my-policies':
      loadPoliciesData();
      break;
    case 'documents':
      loadDocumentsData();
      break;
    case 'notifications':
      loadNotificationsData();
      break;
    case 'file-claim':
      loadPoliciesForClaimForm();
      break;
  }
}

// Alias to keep old call signatures and to avoid undefined function errors
async function loadNotificationsData() {
  await loadNotificationsFromBackend();
}

// Document modal and upload helpers
function showUploadModal() {
  const modal = document.getElementById('upload-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal() {
  const activeModal = document.querySelector('.modal.active');
  if (activeModal) {
    activeModal.classList.remove('active');
    if (activeModal.parentElement) {
      activeModal.parentElement.removeChild(activeModal);
    }
  }
}

function updateNotificationBadge(count) {
  const badge = document.getElementById('notification-badge');
  if (!badge) return;
  badge.textContent = count > 0 ? count : '0';
  badge.style.display = count > 0 ? 'inline-flex' : 'none';
}

async function markAsRead(notificationId) {
  if (!notificationId) return;
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showNotification('Please log in to manage notifications', 'warning');
      return;
    }
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.notificationRead}/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const updated = await response.json();
      const index = dashboardState.notifications.findIndex(n => n.id === updated.id);
      if (index !== -1) {
        dashboardState.notifications[index] = updated;
      }
      updateNotificationBadge(dashboardState.notifications.filter(n => !n.read).length);
      renderNotificationsPage();
      updateDashboardActivitySections();
    }
  } catch (error) {
    console.error('Error marking notification read:', error);
    showNotification('Failed to mark notification as read.', 'error');
  }
}

function closeUploadModal() {
  const modal = document.getElementById('upload-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  const fileInput = document.getElementById('document-file');
  if (fileInput) {
    fileInput.value = '';
  }
  const categoryInput = document.getElementById('document-category');
  if (categoryInput) {
    categoryInput.value = 'policy';
  }
}

async function uploadDocument() {
  const categoryElement = document.getElementById('document-category');
  const fileInput = document.getElementById('document-file');

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showNotification('Please select at least one document to upload', 'error');
    return;
  }

  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Session expired. Please log in again.', 'error');
    window.location.href = '/login.html';
    return;
  }

  const formData = new FormData();
  const category = categoryElement ? categoryElement.value : 'other';
  formData.append('category', category);

  for (let i = 0; i < fileInput.files.length; i++) {
    formData.append('files', fileInput.files[i]);
  }

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.uploadDocument}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (response.ok) {
      showNotification('Document(s) uploaded successfully!', 'success');
      closeUploadModal();
      await loadDocumentsData();
    } else if (response.status === 401) {
      localStorage.removeItem('authToken');
      showNotification('Unauthorized. Please login again.', 'error');
      window.location.href = '/login.html';
    } else {
      const body = await response.text();
      showNotification(`Upload failed: ${body}`, 'error');
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    showNotification('Upload failed, please try again.', 'error');
  }
}

// Load Dashboard Data
async function loadDashboardData() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token found, using default stats');
      return;
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/user/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Update stats from backend (with null checks)
      const totalCoverageEl = document.getElementById('total-coverage');
      if (totalCoverageEl) totalCoverageEl.textContent = data.policiesInfo || '₹0';
      const pendingClaimsEl = document.getElementById('pending-claims-count');
      if (pendingClaimsEl) pendingClaimsEl.textContent = data.pendingClaims || 0;
      const approvedClaimsEl = document.getElementById('approved-claims-count');
      if (approvedClaimsEl) approvedClaimsEl.textContent = data.approvedClaims || 0;
      const activePoliciesEl = document.getElementById('active-policies-count');
      if (activePoliciesEl) activePoliciesEl.textContent = data.activePolicies || 0;
      
      // Update recent claims if available
      if (data.recentClaims && data.recentClaims.length > 0) {
        updateRecentClaims(data.recentClaims);
      }
      
      // Update recent activity if available
      if (data.recentActivity && data.recentActivity.length > 0) {
        updateRecentActivity(data.recentActivity);
      }
      
      // Also load claims and notifications to ensure dashboard sections update
      await loadClaimsFromBackend();
      await loadNotificationsFromBackend();
      
      // Update dashboard activity sections with the loaded data
      updateDashboardActivitySections();
    } else {
      console.error('Failed to load dashboard data:', response.status);
      // Fallback: load data from individual endpoints
      await loadClaimsFromBackend();
      await loadNotificationsFromBackend();
      await loadPoliciesFromBackend();
      updateDashboardActivitySections();
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    // Fallback: load data from individual endpoints
    try {
      await loadClaimsFromBackend();
      await loadNotificationsFromBackend();
      await loadPoliciesFromBackend();
      updateDashboardActivitySections();
    } catch (fallbackError) {
      console.error('Fallback data loading also failed:', fallbackError);
    }
  }
}

// Update Recent Activity
function updateRecentActivity(activities) {
  const activityList = document.getElementById('activity-list');
  if (!activityList) return;
  
  activityList.innerHTML = '';
  
  activities.forEach(activity => {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.innerHTML = `
      <div class="activity-icon">
        <i class="fas fa-${activity.icon || 'info-circle'}"></i>
      </div>
      <div class="activity-content">
        <p>${activity.description}</p>
        <span class="activity-time">${formatTimeAgo(activity.timestamp)}</span>
      </div>
    `;
    activityList.appendChild(activityItem);
  });
}

// Format time ago
function formatTimeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

// Update Recent Claims
function updateRecentClaims(claims) {
  const recentClaimsContainer = document.getElementById('recent-claims-list');
  if (!recentClaimsContainer) return;
  
  recentClaimsContainer.innerHTML = claims.map(claim => `
    <div class="claim-item">
      <div class="claim-info">
        <span class="claim-id">${claim.id}</span>
        <span class="claim-type">${claim.type || 'Insurance Claim'}</span>
      </div>
      <div class="claim-amount">${claim.amount?.toLocaleString() || '0'}</div>
      <div class="claim-status ${claim.status?.toLowerCase()}">${claim.status || 'Pending'}</div>
    </div>
  `).join('');
}

// Load Claims Data
async function loadClaimsData() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token found, using default claims');
      return;
    }

    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userClaims}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const claims = data.content || data || [];
      dashboardState.claims = claims;
      updateClaimsTable(claims);
    } else {
      console.error('Failed to load claims data:', response.status);
    }
  } catch (error) {
    console.error('Error loading claims data:', error);
  }
}

// Update Claims Table
function updateClaimsTable(claims) {
  const claimsTableBody = document.getElementById('claims-table-body');
  if (!claimsTableBody) return;
  
  claimsTableBody.innerHTML = '';
  
  if (claims.length === 0) {
    claimsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="no-data">No claims found</td>
      </tr>
    `;
    return;
  }
  
  claims.forEach(claim => {
    const row = document.createElement('tr');

    const policyNumber = claim.policyNumber || claim.policy?.policyNumber || 'N/A';
    const claimType = claim.claimType || claim.type || 'N/A';
    const amount = claim.claimAmount || claim.amount || 0;
    const date = claim.incidentDate || claim.createdDate || claim.submittedDate || '';
    const status = (claim.status || 'Pending').toString();
    const riskScore = claim.riskScore || claim.fraudRisk || claim.risk || 'N/A';
    const processingStage = claim.processingStage || status;

    const statusClass = status.toLowerCase();
    const riskClass = (riskScore && riskScore.toString().toLowerCase().includes('high')) ? 'risk-high' :
      (riskScore && riskScore.toString().toLowerCase().includes('medium')) ? 'risk-medium' : 'risk-low';

    row.innerHTML = `
      <td>${claim.claimNumber || claim.id || 'N/A'}</td>
      <td>${claimType}</td>
      <td>₹${Number(amount).toLocaleString()}</td>
      <td>${date ? new Date(date).toLocaleDateString() : 'N/A'}</td>
      <td><span class="status-badge status-${statusClass}">${status}</span></td>
      <td><span class="risk-badge ${riskClass}">${riskScore}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-sm btn-primary" onclick="viewClaimDetails('${claim.id || claim.claimNumber}')">View</button>
        </div>
      </td>
    `;

    claimsTableBody.appendChild(row);
  });
}

// View Claim Details
function viewClaimDetails(claimId) {
  // Extract numeric ID if it has CLM- prefix
  const numericId = claimId.replace('CLM-', '');
  const id = parseInt(numericId, 10);
  
  // Search by numeric id
  const claim = dashboardState.claims.find(c => c.id === id || c.id === claimId);
  
  if (!claim) {
    console.error('Claim not found:', claimId, 'Searched for ID:', id, 'Available claims:', dashboardState.claims);
    showNotification('Claim not found', 'error');
    return;
  }
  
  // Create modal for claim details
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Claim Details</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="claim-details">
          <div class="detail-row">
            <span class="detail-label">Claim Number:</span>
            <span class="detail-value">${claim.claimNumber || claim.id || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Policy Number:</span>
            <span class="detail-value">${claim.policyNumber || claim.policy?.policyNumber || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Claim Type:</span>
            <span class="detail-value">${claim.claimType || claim.type || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Claim Amount:</span>
            <span class="detail-value">${(claim.claimAmount || claim.amount || 0).toLocaleString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value status-${(claim.status || 'pending').toLowerCase()}">${claim.status || 'Pending'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Incident Date:</span>
            <span class="detail-value">${(claim.incidentDate || claim.createdDate || claim.submittedDate) ? new Date(claim.incidentDate || claim.createdDate || claim.submittedDate).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Description:</span>
            <span class="detail-value">${claim.description || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// View Fraud Details
async function viewFraudDetails(claimId) {
  // Extract numeric ID if it has CLM- prefix
  const numericId = claimId.replace('CLM-', '');
  const id = parseInt(numericId, 10);
  
  // Search by numeric id
  const claim = dashboardState.claims.find(c => c.id === id || c.id === claimId);
  
  if (!claim) {
    console.error('Claim not found:', claimId, 'Searched for ID:', id, 'Available claims:', dashboardState.claims);
    showNotification('Claim not found', 'error');
    return;
  }

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showNotification('Please log in to view fraud details', 'warning');
      return;
    }

    // Fetch fraud details from backend
    const response = await fetch(`${API_CONFIG.baseUrl}/fraud/alerts/claim/${claim.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const fraudData = await response.json();
      
      // Create modal for fraud details
      const modal = document.createElement('div');
      modal.className = 'modal active';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Fraud Alert Details</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="fraud-details">
              <div class="detail-row">
                <span class="detail-label">Claim ID:</span>
                <span class="detail-value">${claim.claimNumber || claim.id || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Alert Date:</span>
                <span class="detail-value">${fraudData.alertDate ? new Date(fraudData.alertDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Risk Level:</span>
                <span class="detail-value status-${fraudData.riskLevel?.toLowerCase() || 'medium'}">${fraudData.riskLevel || 'Medium'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Alert Type:</span>
                <span class="detail-value">${fraudData.alertType || 'Pattern Analysis'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">${fraudData.description || 'AI fraud detection system has identified potential suspicious patterns in this claim.'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Confidence Score:</span>
                <span class="detail-value">${fraudData.confidenceScore || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value status-${fraudData.status?.toLowerCase() || 'pending'}">${fraudData.status || 'Pending Review'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      // If no specific fraud data, show generic fraud alert info
      const modal = document.createElement('div');
      modal.className = 'modal active';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Fraud Alert Details</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="fraud-details">
              <div class="detail-row">
                <span class="detail-label">Claim ID:</span>
                <span class="detail-value">${claim.claimNumber || claim.id || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Alert Status:</span>
                <span class="detail-value status-warning">Fraud Alert Active</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Risk Level:</span>
                <span class="detail-value status-medium">Medium</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Alert Type:</span>
                <span class="detail-value">AI Pattern Analysis</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">AI fraud detection system has identified potential suspicious patterns in this claim. The claim is currently under review by our fraud detection team.</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Next Steps:</span>
                <span class="detail-value">Please contact our fraud prevention department if you have any questions about this alert.</span>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
  } catch (error) {
    console.error('Error loading fraud details:', error);
    
    // Show fallback fraud alert info
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Fraud Alert Details</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="fraud-details">
            <div class="detail-row">
              <span class="detail-label">Claim ID:</span>
              <span class="detail-value">${claim.claimNumber || claim.id || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Alert Status:</span>
              <span class="detail-value status-warning">Fraud Alert Active</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Risk Level:</span>
              <span class="detail-value status-medium">Medium</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Alert Type:</span>
              <span class="detail-value">AI Pattern Analysis</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Description:</span>
              <span class="detail-value">AI fraud detection system has identified potential suspicious patterns in this claim. The claim is currently under review by our fraud detection team.</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Next Steps:</span>
              <span class="detail-value">Please contact our fraud prevention department if you have any questions about this alert.</span>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}


// Load Policies Data
async function loadPoliciesData() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token found, using default policies');
      return;
    }

    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userPolicies}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const policies = await response.json();
      dashboardState.policies = policies || [];
      updatePoliciesTable(policies);
    } else {
      console.error('Failed to load policies data:', response.status);
    }
  } catch (error) {
    console.error('Error loading policies data:', error);
  }
}

// Load Policies for Claim Form Dropdown
async function loadPoliciesForClaimForm() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token found, cannot load policies for claim form');
      // Show message to user
      const policySelect = document.getElementById('claim-policy');
      if (policySelect) {
        // Clear existing options except the first placeholder
        while (policySelect.options.length > 1) {
          policySelect.remove(1);
        }
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Please log in to file a claim';
        option.disabled = true;
        policySelect.appendChild(option);
      }
      return;
    }

    // Always fetch fresh policies from backend when loading claim form
    console.log('📡 Fetching policies for claim form...');
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userPolicies}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (response.ok) {
      const policies = await response.json();
      console.log('✅ Policies loaded for claim form:', policies.length, 'policies');
      dashboardState.policies = policies || [];
      populatePolicyDropdown(policies);
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to load policies for claim form:', response.status, errorText);
      // Show error in dropdown
      const policySelect = document.getElementById('claim-policy');
      if (policySelect) {
        while (policySelect.options.length > 1) {
          policySelect.remove(1);
        }
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Error loading policies';
        option.disabled = true;
        policySelect.appendChild(option);
      }
    }
  } catch (error) {
    console.error('❌ Error loading policies for claim form:', error);
    // Show error in dropdown
    const policySelect = document.getElementById('claim-policy');
    if (policySelect) {
      while (policySelect.options.length > 1) {
        policySelect.remove(1);
      }
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Error connecting to server';
      option.disabled = true;
      policySelect.appendChild(option);
    }
  }
}

// Populate Policy Dropdown
function populatePolicyDropdown(policies) {
  const policySelect = document.getElementById('claim-policy');
  if (!policySelect) return;

  // Clear existing options except the first placeholder
  while (policySelect.options.length > 1) {
    policySelect.remove(1);
  }

  if (!policies || policies.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No policies available';
    option.disabled = true;
    policySelect.appendChild(option);
    return;
  }

  // Add policy options
  policies.forEach(policy => {
    const option = document.createElement('option');
    option.value = policy.policyNumber || `POL-${policy.id}`;
    const policyType = policy.policyType || policy.type || 'Insurance Policy';
    const policyNumber = policy.policyNumber || `POL-${policy.id}`;
    option.textContent = `${policyType} - ${policyNumber}`;
    policySelect.appendChild(option);
  });

  console.log(`Populated claim form dropdown with ${policies.length} policies`);
}

// Update Policies Grid (matches HTML structure with policies-grid element)
function updatePoliciesTable(policies) {
  const policiesGrid = document.getElementById('policies-grid');
  if (!policiesGrid) {
    console.error('Policies grid element not found');
    return;
  }
  
  policiesGrid.innerHTML = '';
  
  // Combine policies and claims into a single list
  const allItems = [];
  
  // Add policies
  if (policies && policies.length > 0) {
    policies.forEach(policy => {
      allItems.push({
        type: 'policy',
        data: policy
      });
    });
  }
  
  // Add claims as policy-like entries
  if (dashboardState.claims && dashboardState.claims.length > 0) {
    dashboardState.claims.forEach(claim => {
      allItems.push({
        type: 'claim',
        data: claim
      });
    });
  }
  
  if (allItems.length === 0) {
    policiesGrid.innerHTML = `
      <div class="no-data">
        <i class="fas fa-file-alt"></i>
        <h4>No policies found</h4>
        <p>You don't have any active policies yet. Add your first policy to get started.</p>
        <button class="btn btn-primary" onclick="showAddPolicyModal()">Add Your First Policy</button>
      </div>
    `;
    return;
  }
  
  // Render all items (policies and claims) as cards in a grid
  policiesGrid.innerHTML = allItems.map(item => {
    if (item.type === 'policy') {
      const policy = item.data;
      const policyId = policy.policyNumber || `POL-${policy.id}` || 'N/A';
      const policyType = policy.policyType || policy.type || 'Insurance Policy';
      const coverage = policy.coverageAmount || policy.coverage || policy.premiumAmount || 0;
      const premium = policy.premium || 0;
      const startDate = policy.startDate ? new Date(policy.startDate).toLocaleDateString() : 'N/A';
      const endDate = policy.endDate ? new Date(policy.endDate).toLocaleDateString() : 'N/A';
      const status = policy.status || 'ACTIVE';
      const statusClass = status.toLowerCase();
      
      // Get appropriate icon for policy type
      let iconClass = 'fa-file-alt';
      if (policyType.toLowerCase().includes('health') || policyType.toLowerCase().includes('medical')) {
        iconClass = 'fa-heartbeat';
      } else if (policyType.toLowerCase().includes('life')) {
        iconClass = 'fa-user-shield';
      } else if (policyType.toLowerCase().includes('auto') || policyType.toLowerCase().includes('vehicle')) {
        iconClass = 'fa-car';
      } else if (policyType.toLowerCase().includes('home') || policyType.toLowerCase().includes('property')) {
        iconClass = 'fa-home';
      } else if (policyType.toLowerCase().includes('travel')) {
        iconClass = 'fa-plane';
      }
      
      return `
        <div class="policy-card" onclick="viewPolicyDetails('${policyId}')">
          <div class="policy-card-header">
            <div class="policy-icon">
              <i class="fas ${iconClass}"></i>
            </div>
            <span class="policy-status status-${statusClass}">${status}</span>
          </div>
          <div class="policy-card-body">
            <h4 class="policy-type">${policyType}</h4>
            <p class="policy-number">${policyId}</p>
            <div class="policy-details-grid">
              <div class="policy-detail">
                <span class="detail-label">Coverage</span>
                <span class="detail-value">₹${coverage.toLocaleString()}</span>
              </div>
              <div class="policy-detail">
                <span class="detail-label">Premium</span>
                <span class="detail-value">₹${premium.toLocaleString()}/yr</span>
              </div>
            </div>
            <div class="policy-dates">
              <div class="date-item">
                <i class="fas fa-calendar-check"></i>
                <span>Start: ${startDate}</span>
              </div>
              <div class="date-item">
                <i class="fas fa-calendar-times"></i>
                <span>End: ${endDate}</span>
              </div>
            </div>
          </div>
          <div class="policy-card-footer">
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewPolicyDetails('${policyId}')">
              <i class="fas fa-eye"></i> View Details
            </button>
          </div>
        </div>
      `;
    } else if (item.type === 'claim') {
      // Render claim as a policy-like card
      const claim = item.data;
      const claimId = claim.claimNumber || claim.id || 'N/A';
      const claimType = claim.claimType || claim.type || 'Insurance Claim';
      const claimAmount = claim.claimAmount || claim.amount || 0;
      const claimDate = claim.incidentDate || claim.createdDate || claim.submittedDate;
      const claimStatus = (claim.status || 'Pending').toLowerCase();
      const policyNumber = claim.policyNumber || claim.policy?.policyNumber || 'N/A';
      
      // Get appropriate icon for claim type
      let iconClass = 'fa-file-alt';
      if (claimType.toLowerCase().includes('health') || claimType.toLowerCase().includes('medical')) {
        iconClass = 'fa-heartbeat';
      } else if (claimType.toLowerCase().includes('life')) {
        iconClass = 'fa-user-shield';
      } else if (claimType.toLowerCase().includes('auto') || claimType.toLowerCase().includes('vehicle')) {
        iconClass = 'fa-car';
      } else if (claimType.toLowerCase().includes('home') || claimType.toLowerCase().includes('property')) {
        iconClass = 'fa-home';
      } else if (claimType.toLowerCase().includes('travel')) {
        iconClass = 'fa-plane';
      }
      
      return `
        <div class="policy-card claim-card" onclick="viewClaimDetails('${claimId}')">
          <div class="policy-card-header">
            <div class="policy-icon">
              <i class="fas ${iconClass}"></i>
            </div>
            <span class="policy-status status-${claimStatus}">${claim.status || 'Pending'}</span>
          </div>
          <div class="policy-card-body">
            <h4 class="policy-type">${claimType}</h4>
            <p class="policy-number">${claimId}</p>
            <div class="policy-details-grid">
              <div class="policy-detail">
                <span class="detail-label">Claim Amount</span>
                <span class="detail-value">₹${Number(claimAmount).toLocaleString()}</span>
              </div>
              <div class="policy-detail">
                <span class="detail-label">Policy</span>
                <span class="detail-value">${policyNumber}</span>
              </div>
            </div>
            <div class="policy-dates">
              <div class="date-item">
                <i class="fas fa-calendar-check"></i>
                <span>Incident: ${claimDate ? new Date(claimDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
          <div class="policy-card-footer">
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewClaimDetails('${claimId}')">
              <i class="fas fa-eye"></i> View Details
            </button>
          </div>
        </div>
      `;
    }
    return '';
  }).join('');
  
  console.log(`Rendered ${allItems.length} items in grid (${policies.length} policies, ${dashboardState.claims.length} claims)`);
  
  // Update summary cards
  updatePolicySummaryCards(policies);
}

// Update Policy Summary Cards
function updatePolicySummaryCards(policies) {
  const totalPoliciesCount = document.getElementById('total-policies-count');
  const expiringSoonCount = document.getElementById('expiring-soon-count');
  
  if (!totalPoliciesCount || !expiringSoonCount) {
    return;
  }
  
  const totalPolicies = policies.length;
  
  // Calculate expiring soon (within 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const expiringSoon = policies.filter(p => {
    if ((p.status || '').toUpperCase() !== 'ACTIVE') return false;
    const endDate = p.endDate ? new Date(p.endDate) : null;
    return endDate && endDate >= today && endDate <= thirtyDaysFromNow;
  }).length;
  
  totalPoliciesCount.textContent = totalPolicies;
  expiringSoonCount.textContent = expiringSoon;

  // Keep policy claims data in sync whenever policy card should re-render
  attachPolicyClaimBadges();
}

function attachPolicyClaimBadges() {
  const policyCards = document.querySelectorAll('#policies-grid .policy-card');
  policyCards.forEach(card => {
    const policyNumberEl = card.querySelector('.policy-number');
    if (!policyNumberEl) return;

    const policyNumber = policyNumberEl.textContent.trim();
    const relatedClaims = dashboardState.claims.filter(c => {
      const claimPolicyNumber = (c.policyNumber || c.policy?.policyNumber || '').toString();
      return claimPolicyNumber === policyNumber;
    });

    const existingSummary = card.querySelector('.policy-claim-summary');
    if (existingSummary) existingSummary.remove();

    const latestClaim = relatedClaims.slice().sort((a, b) => new Date(b.incidentDate || b.createdDate || b.date || 0) - new Date(a.incidentDate || a.createdDate || a.date || 0))[0];
    const latestClaimStatus = latestClaim ? (latestClaim.status || latestClaim.caseStatus || 'N/A') : 'N/A';

    const summary = document.createElement('div');
    summary.className = 'policy-claim-summary';
    summary.innerHTML = `
      <div class="policy-detail">
        <span class="detail-label">Claims Filed</span>
        <span class="detail-value">${relatedClaims.length}</span>
      </div>
      <div class="policy-detail">
        <span class="detail-label">Latest Claim</span>
        <span class="detail-value">${latestClaimStatus}</span>
      </div>
    `;

    const policyDetailsGrid = card.querySelector('.policy-details-grid');
    if (policyDetailsGrid) {
      policyDetailsGrid.appendChild(summary);
    }
  });
}

// Policy Search and Filter Functions
function setupPolicySearchAndFilter() {
  const policySearch = document.getElementById('policy-search');
  const policyFilter = document.getElementById('policy-filter');
  
  if (policySearch) {
    policySearch.addEventListener('input', function() {
      filterAndSearchPolicies(this.value, policyFilter ? policyFilter.value : 'all');
    });
  }
  
  if (policyFilter) {
    policyFilter.addEventListener('change', function() {
      filterAndSearchPolicies(policySearch ? policySearch.value : '', this.value);
    });
  }
}

// Filter and Search Policies (includes both policies and claims)
function filterAndSearchPolicies(searchTerm, filterValue) {
  const policiesGrid = document.getElementById('policies-grid');
  if (!policiesGrid) return;
  
  // Build combined list of policies and claims (same as updatePoliciesTable)
  const allItems = [];
  
  // Add policies
  if (dashboardState.policies && dashboardState.policies.length > 0) {
    dashboardState.policies.forEach(policy => {
      allItems.push({
        type: 'policy',
        data: policy
      });
    });
  }
  
  // Add claims
  if (dashboardState.claims && dashboardState.claims.length > 0) {
    dashboardState.claims.forEach(claim => {
      allItems.push({
        type: 'claim',
        data: claim
      });
    });
  }
  
  // Apply filter
  let filteredItems = allItems;
  if (filterValue !== 'all') {
    filteredItems = filteredItems.filter(item => {
      if (item.type === 'policy') {
        const policy = item.data;
        const policyType = (policy.policyType || policy.type || '').toLowerCase();
        const status = (policy.status || '').toLowerCase();
        
        switch (filterValue) {
          case 'active':
            return status === 'active';
          case 'expired':
            return status === 'expired' || status === 'inactive';
          case 'pending':
            return status === 'pending';
          case 'health':
            return policyType.includes('health') || policyType.includes('medical');
          case 'life':
            return policyType.includes('life');
          case 'auto':
            return policyType.includes('auto') || policyType.includes('vehicle');
          case 'home':
            return policyType.includes('home') || policyType.includes('property');
          default:
            return true;
        }
      } else if (item.type === 'claim') {
        const claim = item.data;
        const claimType = (claim.claimType || claim.type || '').toLowerCase();
        const status = (claim.status || '').toLowerCase();
        
        switch (filterValue) {
          case 'active':
          case 'expired':
          case 'pending':
            return status === filterValue;
          case 'health':
            return claimType.includes('health') || claimType.includes('medical');
          case 'life':
            return claimType.includes('life');
          case 'auto':
            return claimType.includes('auto') || claimType.includes('vehicle');
          case 'home':
            return claimType.includes('home') || claimType.includes('property');
          default:
            return true;
        }
      }
      return false;
    });
  }
  
  // Apply search
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    filteredItems = filteredItems.filter(item => {
      if (item.type === 'policy') {
        const policy = item.data;
        const policyNumber = (policy.policyNumber || '').toLowerCase();
        const policyType = (policy.policyType || policy.type || '').toLowerCase();
        const provider = (policy.provider || '').toLowerCase();
        return policyNumber.includes(searchLower) || 
               policyType.includes(searchLower) || 
               provider.includes(searchLower);
      } else if (item.type === 'claim') {
        const claim = item.data;
        const claimNumber = (claim.claimNumber || claim.id || '').toLowerCase();
        const claimType = (claim.claimType || claim.type || '').toLowerCase();
        const policyNumber = (claim.policyNumber || claim.policy?.policyNumber || '').toLowerCase();
        return claimNumber.includes(searchLower) || 
               claimType.includes(searchLower) || 
               policyNumber.includes(searchLower);
      }
      return false;
    });
  }
  
  // Re-render filtered items
  renderFilteredItems(filteredItems);
}

// Render Filtered Items (policies and claims)
function renderFilteredItems(filteredItems) {
  const policiesGrid = document.getElementById('policies-grid');
  if (!policiesGrid) return;
  
  policiesGrid.innerHTML = '';
  
  if (!filteredItems || filteredItems.length === 0) {
    policiesGrid.innerHTML = `
      <div class="no-data">
        <i class="fas fa-file-alt"></i>
        <h4>No policies found</h4>
        <p>No policies match your search criteria.</p>
      </div>
    `;
    return;
  }
  
  // Render all items (policies and claims) as cards in a grid
  policiesGrid.innerHTML = filteredItems.map(item => {
    if (item.type === 'policy') {
      const policy = item.data;
      const policyId = policy.policyNumber || `POL-${policy.id}` || 'N/A';
      const policyType = policy.policyType || policy.type || 'Insurance Policy';
      const coverage = policy.coverageAmount || policy.coverage || policy.premiumAmount || 0;
      const premium = policy.premium || 0;
      const startDate = policy.startDate ? new Date(policy.startDate).toLocaleDateString() : 'N/A';
      const endDate = policy.endDate ? new Date(policy.endDate).toLocaleDateString() : 'N/A';
      const status = policy.status || 'ACTIVE';
      const statusClass = status.toLowerCase();
      
      // Get appropriate icon for policy type
      let iconClass = 'fa-file-alt';
      if (policyType.toLowerCase().includes('health') || policyType.toLowerCase().includes('medical')) {
        iconClass = 'fa-heartbeat';
      } else if (policyType.toLowerCase().includes('life')) {
        iconClass = 'fa-user-shield';
      } else if (policyType.toLowerCase().includes('auto') || policyType.toLowerCase().includes('vehicle')) {
        iconClass = 'fa-car';
      } else if (policyType.toLowerCase().includes('home') || policyType.toLowerCase().includes('property')) {
        iconClass = 'fa-home';
      } else if (policyType.toLowerCase().includes('travel')) {
        iconClass = 'fa-plane';
      }
      
      return `
        <div class="policy-card" onclick="viewPolicyDetails('${policyId}')">
          <div class="policy-card-header">
            <div class="policy-icon">
              <i class="fas ${iconClass}"></i>
            </div>
            <span class="policy-status status-${statusClass}">${status}</span>
          </div>
          <div class="policy-card-body">
            <h4 class="policy-type">${policyType}</h4>
            <p class="policy-number">${policyId}</p>
            <div class="policy-details-grid">
              <div class="policy-detail">
                <span class="detail-label">Coverage</span>
                <span class="detail-value">₹${coverage.toLocaleString()}</span>
              </div>
              <div class="policy-detail">
                <span class="detail-label">Premium</span>
                <span class="detail-value">₹${premium.toLocaleString()}/yr</span>
              </div>
            </div>
            <div class="policy-dates">
              <div class="date-item">
                <i class="fas fa-calendar-check"></i>
                <span>Start: ${startDate}</span>
              </div>
              <div class="date-item">
                <i class="fas fa-calendar-times"></i>
                <span>End: ${endDate}</span>
              </div>
            </div>
          </div>
          <div class="policy-card-footer">
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewPolicyDetails('${policyId}')">
              <i class="fas fa-eye"></i> View Details
            </button>
          </div>
        </div>
      `;
    } else if (item.type === 'claim') {
      // Render claim as a policy-like card
      const claim = item.data;
      const claimId = claim.claimNumber || claim.id || 'N/A';
      const claimType = claim.claimType || claim.type || 'Insurance Claim';
      const claimAmount = claim.claimAmount || claim.amount || 0;
      const claimDate = claim.incidentDate || claim.createdDate || claim.submittedDate;
      const claimStatus = (claim.status || 'Pending').toLowerCase();
      const policyNumber = claim.policyNumber || claim.policy?.policyNumber || 'N/A';
      
      // Get appropriate icon for claim type
      let iconClass = 'fa-file-alt';
      if (claimType.toLowerCase().includes('health') || claimType.toLowerCase().includes('medical')) {
        iconClass = 'fa-heartbeat';
      } else if (claimType.toLowerCase().includes('life')) {
        iconClass = 'fa-user-shield';
      } else if (claimType.toLowerCase().includes('auto') || claimType.toLowerCase().includes('vehicle')) {
        iconClass = 'fa-car';
      } else if (claimType.toLowerCase().includes('home') || claimType.toLowerCase().includes('property')) {
        iconClass = 'fa-home';
      } else if (claimType.toLowerCase().includes('travel')) {
        iconClass = 'fa-plane';
      }
      
      return `
        <div class="policy-card claim-card" onclick="viewClaimDetails('${claimId}')">
          <div class="policy-card-header">
            <div class="policy-icon">
              <i class="fas ${iconClass}"></i>
            </div>
            <span class="policy-status status-${claimStatus}">${claim.status || 'Pending'}</span>
          </div>
          <div class="policy-card-body">
            <h4 class="policy-type">${claimType}</h4>
            <p class="policy-number">${claimId}</p>
            <div class="policy-details-grid">
              <div class="policy-detail">
                <span class="detail-label">Claim Amount</span>
                <span class="detail-value">₹${Number(claimAmount).toLocaleString()}</span>
              </div>
              <div class="policy-detail">
                <span class="detail-label">Policy</span>
                <span class="detail-value">${policyNumber}</span>
              </div>
            </div>
            <div class="policy-dates">
              <div class="date-item">
                <i class="fas fa-calendar-check"></i>
                <span>Incident: ${claimDate ? new Date(claimDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
          <div class="policy-card-footer">
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewClaimDetails('${claimId}')">
              <i class="fas fa-eye"></i> View Details
            </button>
          </div>
        </div>
      `;
    }
    return '';
  }).join('');
}

// Render Filtered Policies (legacy function - kept for compatibility)
function renderFilteredPolicies(policies) {
  const policiesGrid = document.getElementById('policies-grid');
  if (!policiesGrid) return;
  
  policiesGrid.innerHTML = '';
  
  if (!policies || policies.length === 0) {
    policiesGrid.innerHTML = `
      <div class="no-data">
        <i class="fas fa-file-alt"></i>
        <h4>No policies found</h4>
        <p>No policies match your search criteria.</p>
      </div>
    `;
    return;
  }
  
  // Render policies as cards in a grid
  policiesGrid.innerHTML = policies.map(policy => {
    const policyId = policy.policyNumber || `POL-${policy.id}` || 'N/A';
    const policyType = policy.policyType || policy.type || 'Insurance Policy';
    const coverage = policy.coverageAmount || policy.coverage || policy.premiumAmount || 0;
    const premium = policy.premium || 0;
    const startDate = policy.startDate ? new Date(policy.startDate).toLocaleDateString() : 'N/A';
    const endDate = policy.endDate ? new Date(policy.endDate).toLocaleDateString() : 'N/A';
    const status = policy.status || 'ACTIVE';
    const statusClass = status.toLowerCase();
    
    // Get appropriate icon for policy type
    let iconClass = 'fa-file-alt';
    if (policyType.toLowerCase().includes('health') || policyType.toLowerCase().includes('medical')) {
      iconClass = 'fa-heartbeat';
    } else if (policyType.toLowerCase().includes('life')) {
      iconClass = 'fa-user-shield';
    } else if (policyType.toLowerCase().includes('auto') || policyType.toLowerCase().includes('vehicle')) {
      iconClass = 'fa-car';
    } else if (policyType.toLowerCase().includes('home') || policyType.toLowerCase().includes('property')) {
      iconClass = 'fa-home';
    } else if (policyType.toLowerCase().includes('travel')) {
      iconClass = 'fa-plane';
    }
    
    return `
      <div class="policy-card" onclick="viewPolicyDetails('${policyId}')">
        <div class="policy-card-header">
          <div class="policy-icon">
            <i class="fas ${iconClass}"></i>
          </div>
          <span class="policy-status status-${statusClass}">${status}</span>
        </div>
        <div class="policy-card-body">
          <h4 class="policy-type">${policyType}</h4>
          <p class="policy-number">${policyId}</p>
          <div class="policy-details-grid">
            <div class="policy-detail">
              <span class="detail-label">Coverage</span>
              <span class="detail-value">₹${coverage.toLocaleString()}</span>
            </div>
            <div class="policy-detail">
              <span class="detail-label">Premium</span>
              <span class="detail-value">₹${premium.toLocaleString()}/yr</span>
            </div>
          </div>
          <div class="policy-dates">
            <div class="date-item">
              <i class="fas fa-calendar-check"></i>
              <span>Start: ${startDate}</span>
            </div>
            <div class="date-item">
              <i class="fas fa-calendar-times"></i>
              <span>End: ${endDate}</span>
            </div>
          </div>
        </div>
        <div class="policy-card-footer">
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewPolicyDetails('${policyId}')">
            <i class="fas fa-eye"></i> View Details
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Policy Details Modal Functions
function showAddPolicyModal() {
  const modal = document.getElementById('add-policy-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

function closeAddPolicyModal() {
  const modal = document.getElementById('add-policy-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  
  // Reset form
  const form = document.getElementById('add-policy-form');
  if (form) {
    form.reset();
  }
}

function addNewPolicy() {
  const policyType = document.getElementById('new-policy-type').value;
  const policyNumber = document.getElementById('new-policy-number').value;
  const provider = document.getElementById('new-policy-provider').value;
  const premium = document.getElementById('new-policy-premium').value;
  const startDate = document.getElementById('new-policy-start-date').value;
  const endDate = document.getElementById('new-policy-end-date').value;
  const coverage = document.getElementById('new-policy-coverage').value;
  const description = document.getElementById('new-policy-description').value;

  if (!policyType || !policyNumber || !provider || !premium || !startDate || !endDate || !coverage) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }

  // Create new policy object
  const newPolicy = {
    id: Date.now(),
    policyNumber: policyNumber,
    policyType: policyType,
    provider: provider,
    premium: parseFloat(premium),
    startDate: startDate,
    endDate: endDate,
    coverageAmount: parseFloat(coverage),
    description: description,
    status: 'ACTIVE'
  };

  // Add to policies array
  dashboardState.policies.push(newPolicy);
  
  // Update UI
  updatePoliciesTable(dashboardState.policies);
  
  // Close modal
  closeAddPolicyModal();
  
  // Show success message
  showNotification('Policy added successfully!', 'success');
}

// Policy Details Modal Functions
function closePolicyDetailsModal() {
  const modal = document.getElementById('policy-details-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function switchPolicyTab(tabName) {
  // Hide all tab panes
  const tabPanes = document.querySelectorAll('.tab-pane');
  tabPanes.forEach(pane => pane.classList.remove('active'));
  
  // Remove active class from all tab buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  // Show selected tab pane
  const selectedPane = document.getElementById(`${tabName}-pane`);
  if (selectedPane) {
    selectedPane.classList.add('active');
  }
  
  // Add active class to selected tab button
  const selectedButton = event.target;
  if (selectedButton) {
    selectedButton.classList.add('active');
  }
}

function fileClaimForPolicy() {
  // Get policy ID from modal
  const modalTitle = document.getElementById('modal-policy-title');
  const policyId = modalTitle ? modalTitle.textContent.replace('Policy Details - ', '') : '';
  
  if (policyId) {
    // Navigate to file claim page and pre-select the policy
    navigateTo('file-claim');
    
    // Set the policy in the claim form
    const policySelect = document.getElementById('claim-policy');
    if (policySelect) {
      policySelect.value = policyId;
    }
    
    // Close policy details modal
    closePolicyDetailsModal();
    
    showNotification(`Policy ${policyId} selected for claim filing`, 'info');
  }
}

// Download and View Document Functions
function downloadDocument(docType) {
  showNotification(`Downloading ${docType}...`, 'info');
  // Implement actual download logic
}

function viewDocument(docType) {
  showNotification(`Viewing ${docType}...`, 'info');
  // Implement actual view logic
}

// Download Policy (stub function for export)
function downloadPolicy(policyId) {
  showNotification(`Downloading policy ${policyId}...`, 'info');
  // Implement actual download logic
}

// Renew Policy (stub function for export)
function renewPolicy(policyId) {
  showNotification(`Renewal request for policy ${policyId} submitted.`, 'info');
  // Implement actual renewal logic
}

// View Policy Details
function viewPolicyDetails(policyId) {
  // Search by policyNumber first, then by id
  const policy = dashboardState.policies.find(p => 
    p.policyNumber === policyId || p.id === policyId || `POL-${p.id}` === policyId
  );
  
  if (!policy) {
    console.error('Policy not found:', policyId, 'Available policies:', dashboardState.policies);
    showNotification('Policy not found', 'error');
    return;
  }
  
  // Update existing modal with real data
  const modal = document.getElementById('policy-details-modal');
  if (modal) {
    // Update modal title
    const modalTitle = document.getElementById('modal-policy-title');
    if (modalTitle) {
      modalTitle.textContent = `Policy Details - ${policy.policyNumber || policy.id}`;
    }
    
    // Update overview tab
    const overviewPolicyNumber = document.getElementById('overview-policy-number');
    if (overviewPolicyNumber) {
      overviewPolicyNumber.textContent = policy.policyNumber || policy.id || 'N/A';
    }
    
    const overviewPolicyType = document.getElementById('overview-policy-type');
    if (overviewPolicyType) {
      overviewPolicyType.textContent = policy.policyType || policy.type || 'Insurance Policy';
    }
    
    const overviewStartDate = document.getElementById('overview-start-date');
    if (overviewStartDate) {
      overviewStartDate.textContent = policy.startDate ? new Date(policy.startDate).toLocaleDateString() : 'N/A';
    }
    
    const overviewEndDate = document.getElementById('overview-end-date');
    if (overviewEndDate) {
      overviewEndDate.textContent = policy.endDate ? new Date(policy.endDate).toLocaleDateString() : 'N/A';
    }
    
    const overviewPremium = document.getElementById('overview-premium');
    if (overviewPremium) {
      overviewPremium.textContent = `₹${(policy.premium || 0).toLocaleString()}/year`;
    }
    
    const overviewAnnualLimit = document.getElementById('overview-annual-limit');
    if (overviewAnnualLimit) {
      overviewAnnualLimit.textContent = `₹${(policy.coverageAmount || policy.coverage || 0).toLocaleString()}`;
    }
    
    // Update claims tab with real claims for this policy
    const policyClaimsList = document.getElementById('policy-claims-list');
    if (policyClaimsList) {
      const policyNumber = policy.policyNumber || `POL-${policy.id}`;
      const relatedClaims = dashboardState.claims.filter(c => {
        const claimPolicyNumber = (c.policyNumber || c.policy?.policyNumber || '').toString();
        return claimPolicyNumber === policyNumber;
      });
      
      if (relatedClaims.length === 0) {
        policyClaimsList.innerHTML = '<div class="no-data">No claims found for this policy</div>';
      } else {
        policyClaimsList.innerHTML = relatedClaims.map(claim => {
          const claimId = claim.claimNumber || claim.id || 'N/A';
          const claimStatus = (claim.status || 'Pending').toLowerCase();
          const claimDate = claim.incidentDate || claim.createdDate || claim.submittedDate;
          const claimAmount = claim.claimAmount || claim.amount || 0;
          const claimDescription = claim.description || 'No description';
          
          return `
            <div class="claim-item">
              <div class="claim-header">
                <div class="claim-id">${claimId}</div>
                <div class="claim-status ${claimStatus}">${claim.status || 'Pending'}</div>
              </div>
              <div class="claim-details">
                <div class="claim-info">
                  <span class="claim-date">${claimDate ? new Date(claimDate).toLocaleDateString() : 'N/A'}</span>
                  <span class="claim-amount">₹${Number(claimAmount).toLocaleString()}</span>
                </div>
                <div class="claim-description">${claimDescription}</div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
    
    // Show the modal
    modal.classList.add('active');
  }
}


// Load Documents Data
async function loadDocumentsData() {
  try {
    const isValidToken = await validateAuthToken();
    if (!isValidToken) {
      showNotification('Session expired. Please log in again.', 'error');
      // Redirect to login page or show login modal
      window.location.href = '/login.html';
      return;
    }

    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userDocuments}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const documents = await response.json();
      dashboardState.documents = documents || [];
      updateDocumentsTable(documents);
    } else {
      console.error('Failed to load documents data:', response.status);
    }
  } catch (error) {
    console.error('Error loading documents data:', error);
  }
}

// Function to validate the authentication token
async function validateAuthToken() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userProfile}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return true;
    } else {
      console.warn('Invalid or expired token');
      return false;
    }
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
}

// Update Documents Display (Grid and Table)
function updateDocumentsTable(documents) {
  // Update grid view
  const documentsGrid = document.getElementById('documents-grid');
  if (documentsGrid) {
    documentsGrid.innerHTML = '';
    
    if (!documents || documents.length === 0) {
      documentsGrid.innerHTML = '<div class="no-data">No documents found</div>';
      return;
    }

    documentsGrid.innerHTML = documents.map(doc => {
      const docId = doc.id || 'N/A';
      const docName = doc.fileName || doc.name || 'Document';
      const docCategory = doc.category || doc.documentType || 'General';
      const uploadDate = doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : doc.uploadedAt || 'N/A';
      const fileSize = doc.fileSize ? formatFileSize(doc.fileSize) : doc.size || 'N/A';
      
      return `
        <div class="document-card">
          <div class="document-icon">
            <i class="fas fa-file-alt"></i>
          </div>
          <div class="document-info">
            <h4>${docName}</h4>
            <p>Category: ${docCategory}</p>
            <p>Uploaded: ${uploadDate}</p>
            <span class="document-size">${fileSize}</span>
          </div>
          <div class="document-actions">
            <button class="btn-icon" onclick="viewDocumentDetails(${docId})"><i class="fas fa-eye"></i></button>
            <button class="btn-icon" onclick="downloadDocument(${docId})"><i class="fas fa-download"></i></button>
            <button class="btn-icon" onclick="deleteDocument(${docId})"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Update table view if it exists
  const documentsTableBody = document.getElementById('documents-table-body');
  if (documentsTableBody) {
    documentsTableBody.innerHTML = '';
    
    if (!documents || documents.length === 0) {
      documentsTableBody.innerHTML = '<tr><td colspan="6" class="no-data">No documents found</td></tr>';
      return;
    }

    documentsTableBody.innerHTML = documents.map(doc => {
      const docId = doc.id || 'N/A';
      const docName = doc.fileName || doc.name || 'Document';
      const docCategory = doc.category || doc.documentType || 'General';
      const uploadDate = doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : doc.uploadedAt || 'N/A';
      const fileSize = doc.fileSize ? formatFileSize(doc.fileSize) : doc.size || 'N/A';
      
      return `
        <tr>
          <td>${docId}</td>
          <td>${docName}</td>
          <td>${docCategory}</td>
          <td>${uploadDate}</td>
          <td>${fileSize}</td>
          <td>
            <button class="btn-icon" onclick="viewDocumentDetails(${docId})"><i class="fas fa-eye"></i></button>
            <button class="btn-icon" onclick="downloadDocument(${docId})"><i class="fas fa-download"></i></button>
            <button class="btn-icon" onclick="deleteDocument(${docId})"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// View Document Details
function viewDocumentDetails(docId) {
  const doc = dashboardState.documents.find(d => d.id === docId);
  if (!doc) {
    showNotification('Document not found', 'error');
    return;
  }
  
  // Create modal for document details
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Document Details</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="document-details">
          <div class="detail-row">
            <span class="detail-label">Document Name:</span>
            <span class="detail-value">${doc.documentName || doc.name || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Document Type:</span>
            <span class="detail-value">${doc.documentType || doc.type || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Upload Date:</span>
            <span class="detail-value">${doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">File Size:</span>
            <span class="detail-value">${doc.fileSize ? formatFileSize(doc.fileSize) : 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value status-${(doc.status || 'uploaded').toLowerCase()}">${doc.status || 'Uploaded'}</span>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Download Document
async function downloadDocument(docId) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showNotification('Please log in to download documents', 'warning');
      return;
    }

    showNotification('Downloading document...', 'info');
    
    // Download document from backend API
    const response = await fetch(`${API_CONFIG.baseUrl}/documents/${docId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${docId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showNotification('Document downloaded successfully!', 'success');
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to download document');
    }
  } catch (error) {
    console.error('Error downloading document:', error);
    showNotification(error.message || 'Error downloading document. Please try again.', 'error');
  }
}

// Delete Document
async function deleteDocument(docId) {
  if (!confirm('Are you sure you want to delete this document?')) {
    return;
  }

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showNotification('Please log in to delete documents', 'warning');
      return;
    }

    // Delete document from backend API
    const response = await fetch(`${API_CONFIG.baseUrl}/documents/${docId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      showNotification('Document deleted successfully!', 'success');
      
      // Reload documents data to remove the deleted document
      await loadDocumentsData();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete document');
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    showNotification(error.message || 'Error deleting document. Please try again.', 'error');
  }
}

// Mark All as Read
async function markAllAsRead() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showNotification('Please log in to mark notifications as read', 'warning');
      return;
    }

    // Mark all notifications as read from backend API
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.markAllRead}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      showNotification('All notifications marked as read', 'success');
      updateNotificationBadge(0);
      
      // Reload notifications data to show updated read status
      await loadNotificationsData();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to mark notifications as read');
    }
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    showNotification(error.message || 'Error marking notifications as read. Please try again.', 'error');
  }
}

// Show Create Ticket Modal
function showCreateTicketModal() {
  const modal = document.getElementById('create-ticket-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

// Close Create Ticket Modal
function closeCreateTicketModal() {
  const modal = document.getElementById('create-ticket-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Show FAQ
function showFAQ() {
  showNotification('Opening FAQ section...', 'info');
  // Implement FAQ display logic
}

// Contact Support
function contactSupport() {
  showNotification('Opening contact form...', 'info');
  // Implement contact form logic
}

// Send Message (AI Assistant)
function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();

  if (!message) return;

  // Add user message to chat
  addChatMessage(message, 'user');

  // Clear input
  input.value = '';

  // Simulate AI response (expand this with real AI backend if available)
  setTimeout(() => {
    const response = generateAssistantResponse(message);
    addChatMessage(response, 'bot');
  }, 800);
}

function generateAssistantResponse(rawMessage) {
  const lowerMsg = rawMessage.toLowerCase();

  if (/(file|submit).*(claim)|claim.*(file|submit)/.test(lowerMsg)) {
    return 'To file a claim, open "File Claim" from the sidebar, choose the correct policy, enter incident details, amount, description and either upload or attach supporting documents. After submitting, you can track it in "My Claims".';
  }

  if (/(status).*(claim)|claim.*status/.test(lowerMsg)) {
    const claimIdMatch = rawMessage.match(/\bclm-?\d+\b/i);
    if (claimIdMatch) {
      return `You can find the status of ${claimIdMatch[0]} in "My Claims". If you want, I can guide you on where to click and what columns to look at.`;
    }
    return 'Visit "My Claims" to see each claim status. Filter by pending/approved/rejected and click the claim row for detailed updates.';
  }

  if (/(coverage|policy).*details|details.*(coverage|policy)/.test(lowerMsg)) {
    return 'Check "My Policies" for coverage info: insured amount, deductible, premium, benefits and expiry. For any ambiguous policy item, use the policy ID and contact support to confirm.';
  }

  if (/(deductible|excess|out[- ]of[- ]pocket)/.test(lowerMsg)) {
    return 'Your deductible is listed in each policy detail page under "My Policies". If you don\'t see it, click a policy and look for "deductible" or "excess" field; this is the amount you pay before the insurer covers the rest.';
  }

  if (/(how many|total).*claims/.test(lowerMsg)) {
    return 'You can see your submitted claims count in "My Claims". For a summary, filter by status (pending/approved/rejected) and use the dashboard card to get total claims, this year claims, and claim success rate.';
  }

  if (/(renew|expiry|expire|expiration).*policy|policy.*(renew|expiry|expire|expiration)/.test(lowerMsg)) {
    return 'Policy renewal and expiry are shown on the "My Policies" page. If your policy is close to expiry, open the policy details and you should see a renew option or instructions to contact support.';
  }

  if (/(premium|payment|due).*date|date.*(premium|payment|due)/.test(lowerMsg)) {
    return 'Premium and payment details are indicated under each policy. For overdue or upcoming payments, check "My Policies" and visit the payment section in your account settings.';
  }

  if (/(terms|coverage).*(limits|cap)/.test(lowerMsg)) {
    return 'Coverage limits, caps and sub-limits are shown in policy details under "My Policies". Review the section labeled "Coverage Limits", or open your policy PDF for full legal terms.';
  }

  if (/(document|upload).*(claim|policy)|claim.*(document|upload)/.test(lowerMsg)) {
    return 'You can upload supporting documents in the claim detail view or under "My Documents". Ensure files are PNG/JPG/PDF and total size is within the permitted limit.';
  }

  if (/(approve|reject).*(claim)|claim.*(approve|reject)/.test(lowerMsg)) {
    return 'Claims are reviewed by underwriters and cannot be approved manually. Your claim status updates automatically in "My Claims" when a decision is made.';
  }

  if (/(contact|support|help).*(human|agent)?/.test(lowerMsg)) {
    return 'For complex issues, click "Contact Support" or email support@insurai.com. Our team is available Mon-Fri 9am-6pm to assist with policy, claims, and billing questions.';
  }

  if (/(what.*can.*you.*do|what.*services|help)/.test(lowerMsg)) {
    return 'I can help with claim filing guidance, policy coverage questions, status tracking, document instructions and basic pricing info. Ask about your policy number, claim process, or payment due date.';
  }

  if (/(greeting|hi|hello|hey)/.test(lowerMsg)) {
    return 'Hello! I\'m your InsurAI assistant. How can I help you with your policy or claim today?';
  }

  // Contract query patterns (generic fallback)
  if (lowerMsg.includes('policy') || lowerMsg.includes('claim') || lowerMsg.includes('coverage') || lowerMsg.includes('payment')) {
    return 'Great question! Please check the "My Policies" and "My Claims" pages for accuracy, or ask for specific terms like "deductible", "benefits", "renewal" or "claim status" and I\'ll provide details.';
  }

  return 'I\'m here to help! Ask me about filing claims, your policy coverage, claim status, payments, and tickets. If you need help with a specific claim ID (e.g., CLM123), include it in your question.';
}


// Add Chat Message
function addChatMessage(message, sender) {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  
  const avatar = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  messageDiv.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      <p>${message}</p>
      <span class="message-time">${time}</span>
    </div>
  `;

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Ask Question (Quick Question Button)
function askQuestion(question) {
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = question;
    sendMessage();
  }
}

// Edit Profile
function editProfile() {
  showNotification('Opening profile editor...', 'info');
  // Implement profile editing logic
  const profileModal = document.createElement('div');
  profileModal.className = 'modal active';
  profileModal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Edit Profile</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <form id="profile-form">
          <div class="form-group">
            <label for="edit-first-name">First Name</label>
            <input type="text" id="edit-first-name" value="${dashboardState.user?.firstName || ''}" required>
          </div>
          <div class="form-group">
            <label for="edit-last-name">Last Name</label>
            <input type="text" id="edit-last-name" value="${dashboardState.user?.lastName || ''}" required>
          </div>
          <div class="form-group">
            <label for="edit-phone">Phone Number</label>
            <input type="tel" id="edit-phone" value="${dashboardState.user?.phoneNumber || ''}">
          </div>
          <div class="form-group">
            <label for="edit-address">Address</label>
            <input type="text" id="edit-address" value="${dashboardState.user?.address || ''}">
          </div>
          <div class="form-group">
            <label for="edit-city">City</label>
            <input type="text" id="edit-city" value="${dashboardState.user?.city || ''}">
          </div>
          <div class="form-group">
            <label for="edit-state">State</label>
            <input type="text" id="edit-state" value="${dashboardState.user?.state || ''}">
          </div>
          <div class="form-group">
            <label for="edit-zip">Zip Code</label>
            <input type="text" id="edit-zip" value="${dashboardState.user?.zipCode || ''}">
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(profileModal);

  // Add form submission handler
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = {
        firstName: document.getElementById('edit-first-name').value,
        lastName: document.getElementById('edit-last-name').value,
        phoneNumber: document.getElementById('edit-phone').value,
        address: document.getElementById('edit-address').value,
        city: document.getElementById('edit-city').value,
        state: document.getElementById('edit-state').value,
        zipCode: document.getElementById('edit-zip').value
      };

      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          showNotification('Please log in to update your profile', 'warning');
          return;
        }

        const response = await fetch(`${API_CONFIG.baseUrl}/user/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const updatedData = await response.json();
          dashboardState.user = updatedData;
          updateUserInterface(updatedData);
          showNotification('Profile updated successfully!', 'success');
          profileModal.remove();
        } else {
          throw new Error('Failed to update profile');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error updating profile. Please try again.', 'error');
      }
    });
  }
}

// Trigger Search from button click
function triggerSearch() {
  const searchInput = document.getElementById('search-input');
  if (searchInput && searchInput.value.trim()) {
    handleSearch({ target: searchInput });
  } else if (searchInput) {
    searchInput.focus();
  }
}

// Handle Search
function handleSearch(e) {
  const searchTerm = (e.target.value || '').toLowerCase().trim();
  console.log('Searching for:', searchTerm);

  if (!searchTerm) {
    // Reset on empty search input
    if (dashboardState.currentPage === 'my-claims') {
      updateClaimsTable(dashboardState.claims);
    } else if (dashboardState.currentPage === 'my-policies') {
      filterAndSearchPolicies('', document.getElementById('policy-filter')?.value || 'all');
    }
    return;
  }

  // If on policies page, filter policies
  if (dashboardState.currentPage === 'my-policies') {
    filterAndSearchPolicies(searchTerm, document.getElementById('policy-filter')?.value || 'all');
    return;
  }

  // If on claims page, filter claims table
  if (dashboardState.currentPage === 'my-claims') {
    filterClaimsTable(searchTerm);
    return;
  }

  // General search across claims + policies on other pages
  if (searchTerm.length >= 2) {
    const matchingClaims = dashboardState.claims.filter(claim => {
      const payload = `${claim.claimNumber || claim.id || ''} ${claim.type || claim.claimType || ''} ${claim.status || ''} ${claim.policyNumber || ''}`.toLowerCase();
      return payload.includes(searchTerm);
    });

    const matchingPolicies = dashboardState.policies.filter(policy => {
      const payload = `${policy.policyNumber || ''} ${policy.policyType || policy.type || ''} ${policy.status || ''}`.toLowerCase();
      return payload.includes(searchTerm);
    });

    if (matchingClaims.length > 0) {
      navigateTo('my-claims');
      updateClaimsTable(matchingClaims);
      showNotification(`Showing ${matchingClaims.length} matching claim(s)`, 'info');
      return;
    }

    if (matchingPolicies.length > 0) {
      navigateTo('my-policies');
      filterAndSearchPolicies(searchTerm, 'all');
      showNotification(`Showing ${matchingPolicies.length} matching policy(ies)`, 'info');
      return;
    }

    showNotification(`No results found for "${searchTerm}"`, 'warning');
  }
}

// Filter Claims Table
function filterClaimsTable(searchTerm) {
  const rows = document.querySelectorAll('#claims-table-body tr');
  let visibleCount = 0;
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const isVisible = !searchTerm || text.includes(searchTerm);
    row.style.display = isVisible ? '' : 'none';
    if (isVisible) visibleCount++;
  });
  
  // Show count
  if (searchTerm) {
    const totalRows = rows.length;
    console.log(`Found ${visibleCount} of ${totalRows} claims matching "${searchTerm}"`);
  }
}

// Perform General Search
function performGeneralSearch(searchTerm) {
  const results = [];
  
  // Search in policies
  dashboardState.policies.forEach(policy => {
    const policyNumber = (policy.policyNumber || '').toLowerCase();
    const policyType = (policy.policyType || policy.type || '').toLowerCase();
    const provider = (policy.provider || '').toLowerCase();
    
    if (policyNumber.includes(searchTerm) || policyType.includes(searchTerm) || provider.includes(searchTerm)) {
      results.push({ type: 'policy', data: policy });
    }
  });
  
  // Search in claims
  dashboardState.claims.forEach(claim => {
    const claimNumber = (claim.claimNumber || claim.id || '').toLowerCase();
    const claimType = (claim.claimType || claim.type || '').toLowerCase();
    
    if (claimNumber.includes(searchTerm) || claimType.includes(searchTerm)) {
      results.push({ type: 'claim', data: claim });
    }
  });
  
  console.log(`General search found ${results.length} results for "${searchTerm}"`);
  // Could display results in a dropdown or navigate to search results page
}

// Setup File Upload
function setupFileUpload() {
  const fileUploadAreas = document.querySelectorAll('.file-upload-area');
  
  fileUploadAreas.forEach(area => {
    const fileInput = area.querySelector('input[type="file"]');
    
    if (fileInput) {
      // Click to upload
      area.addEventListener('click', () => {
        fileInput.click();
      });

      // Drag and drop
      area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.style.borderColor = 'var(--primary-500)';
        area.style.background = 'var(--primary-50)';
      });

      area.addEventListener('dragleave', () => {
        area.style.borderColor = 'var(--neutral-300)';
        area.style.background = 'transparent';
      });

      area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.style.borderColor = 'var(--neutral-300)';
        area.style.background = 'transparent';
        
        const files = e.dataTransfer.files;
        handleFileSelect(files, area);
      });

      // File input change
      fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files, area);
      });
    }
  });
}

// Handle File Select
function handleFileSelect(files, area) {
  const uploadedFilesContainer = area.closest('.form-group').querySelector('.uploaded-files') || 
                                  document.getElementById('uploaded-files');
  
  if (!uploadedFilesContainer) return;

  Array.from(files).forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.className = 'uploaded-file-item';
    fileItem.innerHTML = `
      <span>${file.name}</span>
      <button type="button" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    uploadedFilesContainer.appendChild(fileItem);
  });
}

// Upload claim attachments to Documents Center first
async function uploadClaimDocuments(files) {
  if (!files || files.length === 0) return [];

  const token = localStorage.getItem('authToken');
  if (!token) {
    showNotification('Session expired. Please login again.', 'error');
    window.location.href = '/login.html';
    return [];
  }

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }
  formData.append('category', 'claim');

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.uploadDocument}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Document upload failed: ${errorText}`);
    }

    const uploadedDocs = await response.json();
    return uploadedDocs;
  } catch (error) {
    console.error('Error uploading claim documents:', error);
    showNotification('Claim attachments upload failed. Try again.', 'error');
    throw error;
  }
}

// Claim form submission handler
async function handleClaimSubmit(event) {
  event.preventDefault();

  const claimCategory = document.getElementById('claim-category')?.value;
  const amountValue = document.getElementById('claim-amount')?.value;
  const incidentDate = document.getElementById('incident-date')?.value;
  const description = document.getElementById('incident-description')?.value;
  const fileInput = document.getElementById('claim-documents');

  if (!claimCategory || !amountValue || !incidentDate || !description) {
    showNotification('Please fill in all required claim fields.', 'error');
    return;
  }

  const amount = parseFloat(amountValue);
  if (Number.isNaN(amount) || amount <= 0) {
    showNotification('Please enter a valid claim amount', 'error');
    return;
  }

  let uploadedDocs = [];
  if (fileInput && fileInput.files.length > 0) {
    try {
      uploadedDocs = await uploadClaimDocuments(fileInput.files);
    } catch (err) {
      return; // abort claim submission if document upload fails
    }
  }

  // Keep only the minimal document metadata in claim (for the claim record)
  const documentRefs = uploadedDocs && uploadedDocs.length
    ? uploadedDocs.map(doc => ({ id: doc.id, fileName: doc.fileName }))
    : [];

  const claimPayload = {
    claimType: claimCategory,
    type: claimCategory,
    amount: amount,
    incidentDate: incidentDate,
    description: description,
    documents: documentRefs.length ? JSON.stringify(documentRefs) : null
  };

  const submitted = await submitClaimToBackend(claimPayload);

  if (submitted) {
    showNotification('Claim submitted successfully.', 'success');
    resetClaimForm();
    // Refresh all dashboard data including policies to show updated claim counts
    await refreshAllDashboardData();
    // Update policies page to reflect the new claim
    if (dashboardState.policies && dashboardState.policies.length > 0) {
      updatePoliciesTable(dashboardState.policies);
    }
    navigateTo('my-claims');
  }
}

// Reset claim form fields and uploaded file preview
function resetClaimForm() {
  const claimForm = document.getElementById('claim-form');
  if (claimForm) {
    claimForm.reset();
  }

  const fileInput = document.getElementById('claim-documents');
  if (fileInput) {
    fileInput.value = '';
  }

  const uploadedFilesContainer = document.getElementById('uploaded-files');
  if (uploadedFilesContainer) {
    uploadedFilesContainer.innerHTML = '';
  }
}

// Show Notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification-toast ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 3000;
    animation: slideIn 0.3s ease;
  `;

  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Enhanced API Integration Functions
async function connectToBackend() {
  try {
    // Test backend connection
    const response = await fetch(`${API_CONFIG.baseUrl}/test`);
    if (response.ok) {
      dashboardState.backendConnected = true;
      console.log('✅ Backend connected successfully');
      return true;
    }
  } catch (error) {
    console.warn('❌ Backend connection failed:', error);
    dashboardState.backendConnected = false;
    return false;
  }
}

// Load User Data from Backend
async function loadUserDataFromBackend() {
  if (!dashboardState.backendConnected) {
    await connectToBackend();
  }

  try {
    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');
    
    console.log('📊 Loading user data from backend...');
    console.log('📊 Current localStorage:', {
      authToken: token ? 'EXISTS' : 'MISSING',
      userEmail: userEmail
    });
    
    if (!token) {
      showNotification('Please log in to access your data', 'warning');
      return;
    }

    console.log('📡 Fetching user profile from:', `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userProfile}`);
    
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userProfile}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        // ✅ FIX: Add cache-busting headers
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (response.ok) {
      const userData = await response.json();
      console.log('✅ User data loaded from backend:', userData);
      console.log('✅ User email from API:', userData.email);
      console.log('✅ User email from localStorage:', userEmail);
      
      // ✅ FIX: Verify the loaded data matches the logged-in user
      if (userData.email && userEmail && userData.email.toLowerCase() !== userEmail.toLowerCase()) {
        console.error('❌ MISMATCH: API returned data for different user!');
        console.error('❌ Expected:', userEmail);
        console.error('❌ Got:', userData.email);
        console.error('❌ This indicates a caching or authentication issue!');
      }
      
      dashboardState.user = userData;
      updateUserInterface(userData);
      showNotification('Welcome back!', 'success');
    } else {
      throw new Error('Failed to load user data');
    }
  } catch (error) {
    console.error('❌ Error loading user data from backend:', error);
    showNotification('Unable to connect to server', 'error');
  }
}

// Load Claims from Backend
async function loadClaimsFromBackend() {
  if (!dashboardState.backendConnected) {
    await connectToBackend();
  }

  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userClaims}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

     if (response.ok) {
      const claimsData = await response.json();
      const claims = Array.isArray(claimsData)
        ? claimsData
        : (claimsData.content || claimsData.data || []);
      dashboardState.claims = claims;
      updateClaimsTable(claims);
      // Re-sync policies page with updated claim results
      if (dashboardState.policies && dashboardState.policies.length > 0) {
        updatePoliciesTable(dashboardState.policies);
      }
    } else {
      throw new Error('Failed to load claims');
    }
  } catch (error) {
    console.error('Error loading claims:', error);
  }
}

// Load Policies from Backend
async function loadPoliciesFromBackend() {
  if (!dashboardState.backendConnected) {
    await connectToBackend();
  }

  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userPolicies}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

     if (response.ok) {
      const policies = await response.json();
      dashboardState.policies = policies;
      updatePoliciesTable(policies);
    } else {
      throw new Error('Failed to load policies');
    }
  } catch (error) {
    console.error('Error loading policies:', error);
  }
}

// Load Notifications from Backend
async function loadNotificationsFromBackend() {
  if (!dashboardState.backendConnected) {
    await connectToBackend();
  }

  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userNotifications}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const notifications = Array.isArray(data) ? data : (data.notifications || []);
      dashboardState.notifications = notifications;
      const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;
      updateNotificationBadge(unreadCount);
      renderNotificationsPage();
      updateDashboardActivitySections();
    } else {
      throw new Error('Failed to load notifications');
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

// Refresh All Dashboard Data
async function refreshAllDashboardData() {
  try {
    // Reload all data from backend
    await Promise.all([
      loadUserDataFromBackend(),
      loadClaimsFromBackend(),
      loadPoliciesFromBackend(),
      loadNotificationsFromBackend(),
      loadDocumentsData(),
      loadSupportTickets()
    ]);
    
    // Update UI based on current page
    if (dashboardState.currentPage === 'dashboard') {
      updateDashboardStats();
    }
  } catch (error) {
    console.error('Error refreshing dashboard data:', error);
  }
}

// Update Dashboard Stats
function updateDashboardStats() {
  // Update claims count
  const claimsCount = dashboardState.claims.length;
  const pendingClaims = dashboardState.claims.filter(c => c.status === 'PENDING' || c.status === 'pending').length;
  const approvedClaims = dashboardState.claims.filter(c => c.status === 'APPROVED' || c.status === 'approved').length;
  
  // Update policies count
  const policiesCount = dashboardState.policies.length;
  
  // Update notifications count
  const unreadNotifications = dashboardState.notifications.filter(n => !n.read).length;
  
  // Update dashboard UI elements if they exist
  const pendingClaimsEl = document.getElementById('pending-claims-count');
  const approvedClaimsEl = document.getElementById('approved-claims-count');
  const policiesCountEl = document.getElementById('active-policies-count');
  const notificationsCountEl = document.getElementById('notification-badge');
  
  if (pendingClaimsEl) pendingClaimsEl.textContent = pendingClaims;
  if (approvedClaimsEl) approvedClaimsEl.textContent = approvedClaims;
  if (policiesCountEl) policiesCountEl.textContent = policiesCount;
  if (notificationsCountEl) {
    notificationsCountEl.textContent = unreadNotifications;
    notificationsCountEl.style.display = unreadNotifications > 0 ? 'block' : 'none';
  }
}

// Update Dashboard Activity Sections (Recent Activity, Notifications, Claim Progress)
function renderNotificationsPage() {
  const fullList = document.getElementById('notifications-full-list');
  if (!fullList) return;

  if (!dashboardState.notifications || dashboardState.notifications.length === 0) {
    fullList.innerHTML = '<div class="no-data">No notifications found</div>';
    return;
  }

  fullList.innerHTML = dashboardState.notifications
    .slice()
    .sort((a, b) => {
      const aDate = new Date(a.createdAt || a.createdDate || a.timestamp || a.date);
      const bDate = new Date(b.createdAt || b.createdDate || b.timestamp || b.date);
      return bDate - aDate;
    })
    .map(notification => {
      const isUnread = !notification.read;
      const createdTime = notification.createdAt || notification.createdDate || notification.timestamp || notification.date;
      const timeLabel = createdTime ? formatTimeAgo(createdTime) : 'Just now';

      let iconClass = 'fa-bell';
      if (notification.type === 'CLAIM') {
        iconClass = 'fa-clipboard-list';
      } else if (notification.type === 'POLICY') {
        iconClass = 'fa-file-alt';
      } else if (notification.type === 'PAYMENT') {
        iconClass = 'fa-credit-card';
      } else if (notification.type === 'WARNING') {
        iconClass = 'fa-exclamation-triangle';
      }

      return `
        <div class="notification-item ${isUnread ? 'unread' : ''}" onclick="markAsRead(${notification.id || 0})">
          <div class="notification-icon"><i class="fas ${iconClass}"></i></div>
          <div class="notification-content">
            <h4>${notification.title || 'Notification'}</h4>
            <p>${notification.message || ''}</p>
            <span class="notification-time">${timeLabel}</span>
          </div>
        </div>
      `;
    }).join('');
}

function updateDashboardActivitySections() {
  // Update Recent Activity
  const activityList = document.getElementById('activity-list');
  if (activityList) {
    activityList.innerHTML = '';
    
    if (dashboardState.claims.length > 0) {
      // Add recent claims as activity items
      dashboardState.claims.slice(0, 5).forEach(claim => {
        const claimId = claim.id ? `CLM-${claim.id}` : 'New Claim';
        const claimType = claim.type || claim.claimType || 'Insurance Claim';
        const claimDate = claim.createdDate ? new Date(claim.createdDate).toLocaleDateString() : (claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString() : 'N/A');
        const status = claim.status || 'PENDING';
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        // Set icon based on status
        let iconClass = 'fa-plus-circle';
        let statusText = 'submitted';
        if (status === 'APPROVED' || status === 'approved') {
          iconClass = 'fa-check-circle';
          statusText = 'approved';
        } else if (status === 'REJECTED' || status === 'rejected') {
          iconClass = 'fa-times-circle';
          statusText = 'rejected';
        } else if (status === 'PROCESSING' || status === 'processing') {
          iconClass = 'fa-spinner';
          statusText = 'being processed';
        }
        
        activityItem.innerHTML = `
          <div class="activity-icon" style="background: ${status === 'APPROVED' ? '#16a34a' : status === 'REJECTED' ? '#dc2626' : '#3b82f6'}">
            <i class="fas ${iconClass}"></i>
          </div>
          <div class="activity-content">
            <p><strong>${claimId}</strong> ${statusText} (${claimType})</p>
            <span class="activity-time">${claimDate}</span>
          </div>
        `;
        activityList.appendChild(activityItem);
      });
    } else {
      activityList.innerHTML = `
        <div class="activity-item">
          <div class="activity-icon">
            <i class="fas fa-info-circle"></i>
          </div>
          <div class="activity-content">
            <p>No recent activity</p>
            <span class="activity-time">-</span>
          </div>
        </div>
      `;
    }
  }
  
  // Update notifications in dashboard widget
  const notificationsList = document.getElementById('notifications-list');
  if (notificationsList) {
    notificationsList.innerHTML = '';

    if (dashboardState.notifications && dashboardState.notifications.length > 0) {
      dashboardState.notifications.slice(0, 3).forEach(notification => {
        const notifItem = document.createElement('div');
        notifItem.className = 'notification-item ' + (notification.read ? '' : 'unread');
        
        // Set icon based on notification type
        let iconClass = 'fa-info-circle';
        if (notification.type === 'CLAIM') {
          iconClass = 'fa-clipboard-list';
        } else if (notification.type === 'POLICY') {
          iconClass = 'fa-file-alt';
        } else if (notification.type === 'PAYMENT') {
          iconClass = 'fa-credit-card';
        }
        
        notifItem.innerHTML = `
          <div class="notification-icon">
            <i class="fas ${iconClass}"></i>
          </div>
          <div class="notification-content">
            <p>${notification.title || notification.message || 'New notification'}</p>
            <span class="notification-time">${(notification.createdAt || notification.createdDate || notification.timestamp || notification.date) ? formatTimeAgo(notification.createdAt || notification.createdDate || notification.timestamp || notification.date) : 'Just now'}</span>
          </div>
        `;
        notificationsList.appendChild(notifItem);
      });
    } else {
      notificationsList.innerHTML = `
        <div class="notification-item">
          <div class="notification-icon">
            <i class="fas fa-info-circle"></i>
          </div>
          <div class="notification-content">
            <p>No notifications</p>
            <span class="notification-time">-</span>
          </div>
        </div>
      `;
    }
  }

  // Ensure notifications page is also updated when active
  renderNotificationsPage();

  // Update Claim Progress Timeline
  const claimTimeline = document.getElementById('claim-timeline');
  if (claimTimeline) {
    claimTimeline.innerHTML = '';
    
    if (dashboardState.claims.length > 0) {
      // Get the most recent claim
      const recentClaim = dashboardState.claims[0];
      const claimId = recentClaim.id ? `CLM-${recentClaim.id}` : 'New Claim';
      const claimDate = recentClaim.createdDate ? new Date(recentClaim.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const status = recentClaim.status || 'PENDING';
      
      // Define timeline stages
      const stages = [
        { name: 'Submitted', desc: 'Claim submitted successfully', completed: true },
        { name: 'Verification', desc: 'Documents verification', completed: status === 'APPROVED' || status === 'REJECTED' || status === 'PROCESSING' },
        { name: 'Fraud Check', desc: 'AI analysis in progress', completed: status === 'APPROVED' || status === 'REJECTED', active: status === 'PROCESSING' || status === 'PENDING' },
        { name: 'Risk Review', desc: 'Underwriter review', completed: status === 'APPROVED' || status === 'REJECTED' },
        { name: 'Final Decision', desc: status === 'APPROVED' ? 'Claim approved' : status === 'REJECTED' ? 'Claim rejected' : 'Pending', completed: status === 'APPROVED' || status === 'REJECTED' }
      ];
      
      stages.forEach((stage, index) => {
        const timelineItem = document.createElement('div');
        timelineItem.className = `timeline-item ${stage.completed ? 'completed' : ''} ${stage.active ? 'active' : ''}`;
        timelineItem.innerHTML = `
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <h4>${claimId} - ${stage.name}</h4>
            <p>${stage.desc}</p>
            <span class="timeline-date">${index === 0 ? claimDate : '-'}</span>
          </div>
        `;
        claimTimeline.appendChild(timelineItem);
      });
    } else {
      claimTimeline.innerHTML = `
        <div class="timeline-item">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <h4>No claims yet</h4>
            <p>File a claim to see progress here</p>
            <span class="timeline-date">-</span>
          </div>
        </div>
      `;
    }
  }
  
  // Update stats
  updateDashboardStats();
}

// Submit Claim to Backend
async function submitClaimToBackend(formData) {
  if (!dashboardState.backendConnected) {
    await connectToBackend();
  }

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showNotification('Please log in to submit claims', 'warning');
      return false;
    }

    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.submitClaim}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      const result = await response.json();
      showNotification('Claim submitted successfully!', 'success');
      
      // Refresh all dashboard data to show the new claim
      await refreshAllDashboardData();
      
      return true;
    } else {
      const errorText = await response.text();
      const errorMessage = `Failed to submit claim (${response.status}): ${errorText}`;
      console.error(errorMessage);
      showNotification(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Error submitting claim:', error);
    showNotification('Error submitting claim. Please try again.', 'error');
    return false;
  }
}

// Enhanced Logout with Backend Cleanup
async function logout() {
  if (confirm('Are you sure you want to logout?')) {
    // Clear user data
    dashboardState.user = null;
    
    // Clear any stored authentication tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    
    // Notify backend of logout (optional)
    try {
      await fetch(`${API_CONFIG.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('Logout notification to backend failed:', error);
    }
    
    // Redirect to login page with proper path
    window.location.href = '../index.html';
  }
}

// Real-time Updates Setup
function setupRealTimeUpdates() {
  if (!dashboardState.backendConnected) return;

  // Setup WebSocket connection for real-time updates
  const token = localStorage.getItem('authToken');
  if (!token) return;

  // Connect to the notifications WebSocket endpoint for real-time updates
  const wsUrl = `${API_CONFIG.baseUrl.replace('http', 'ws').replace('/api', '')}/ws/notifications`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connected for real-time updates');
    // Send authentication
    ws.send(JSON.stringify({ type: 'auth', token: token }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleRealTimeUpdate(data);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected, attempting to reconnect...');
    setTimeout(setupRealTimeUpdates, 5000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

// Handle Real-time Updates
function handleRealTimeUpdate(data) {
  console.log('[User Dashboard] Real-time update received:', data);
  switch (data.type) {
    case 'claim_update':
    case 'claimSubmitted':
    case 'claimStatusChanged':
      showNotification(`Claim ${data.claimId} status updated to ${data.status}`, 'info');
      // Refresh all dashboard data to ensure consistency
      refreshAllDashboardData();
      break;
    case 'policy_update':
    case 'policyStatusChanged':
      showNotification(`Policy ${data.policyId} status changed to ${data.status}`, 'info');
      // Refresh all dashboard data to ensure consistency
      refreshAllDashboardData();
      break;
    case 'notification':
      dashboardState.notifications.push(data.notification);
      updateNotificationBadge(dashboardState.notifications.filter(n => !n.read).length);
      renderNotificationsPage();
      updateDashboardActivitySections();
      showNotification(data.notification.message, 'info');
      break;
    case 'document_update':
      showNotification('Document has been updated', 'info');
      // Refresh all dashboard data to ensure consistency
      refreshAllDashboardData();
      break;
    case 'ticket_update':
      showNotification('Support ticket has been updated', 'info');
      // Refresh all dashboard data to ensure consistency
      refreshAllDashboardData();
      break;
  }
}


document.addEventListener('DOMContentLoaded', function() {
  const ticketForm = document.getElementById('ticket-form');
  if (ticketForm) {
    ticketForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = {
        subject: document.getElementById('ticket-subject').value,
        category: document.getElementById('ticket-category').value,
        priority: document.getElementById('ticket-priority').value,
        description: document.getElementById('ticket-description').value
      };

      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          showNotification('Please log in to submit a support ticket', 'warning');
          return;
        }

        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.createTicket}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          showNotification('Support ticket submitted successfully!', 'success');
          closeCreateTicketModal();
          ticketForm.reset();
          loadSupportTickets();
        } else {
          throw new Error('Failed to submit ticket');
        }
      } catch (error) {
        console.error('Error submitting ticket:', error);
        showNotification('Error submitting ticket. Please try again.', 'error');
      }
    });
  }
});




// Export functions for global access
window.navigateTo = navigateTo;
window.toggleSidebar = toggleSidebar;
window.viewClaimDetails = viewClaimDetails;
window.viewPolicyDetails = viewPolicyDetails;
window.closeModal = closeModal;
window.downloadPolicy = downloadPolicy;
window.renewPolicy = renewPolicy;
window.showUploadModal = showUploadModal;
window.closeUploadModal = closeUploadModal;
window.uploadDocument = uploadDocument;
window.downloadDocument = downloadDocument;
window.deleteDocument = deleteDocument;
window.markAllAsRead = markAllAsRead;
window.showCreateTicketModal = showCreateTicketModal;
window.closeCreateTicketModal = closeCreateTicketModal;
window.showFAQ = showFAQ;
window.contactSupport = contactSupport;
window.sendMessage = sendMessage;
window.askQuestion = askQuestion;
window.editProfile = editProfile;
window.resetClaimForm = resetClaimForm;

