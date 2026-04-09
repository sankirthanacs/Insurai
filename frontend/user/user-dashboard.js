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
  currentLanguage: localStorage.getItem('insuraiLanguage') || 'en'
};

// API Configuration
window.API_HOST = window.__API_URL__ || 'https://insurai-lhup.onrender.com';
window.API_BASE_URL = window.API_BASE_URL || `${window.API_HOST}/api`;

const API_CONFIG = {
  baseUrl: window.API_BASE_URL || `${window.API_HOST}/api`,
  endpoints: {
    userProfile: '/user/profile',
    userPolicies: '/policies/my-policies',
    userClaims: '/claims/user',
    userNotifications: '/notifications/user',
    submitClaim: '/claims/submit',
    uploadDocument: '/documents/upload',
    createTicket: '/support/tickets',
    updateProfile: '/user/profile'
  }
};

// Make API_CONFIG available globally
window.API_CONFIG = API_CONFIG;

// Language Translations
const translations = {
  en: {
    dashboard: 'Dashboard',
    welcomeBack: "Welcome back! Here's your insurance overview.",
    pendingClaims: 'Pending Claims',
    approvedClaims: 'Approved Claims',
    quickActions: 'Quick Actions',
    fileNewClaim: 'File New Claim',
    uploadDocuments: 'Upload Documents',
    viewPolicies: 'View Policies',
    myPolicies: 'My Policies',
    myClaims: 'My Claims',
    documents: 'Documents',
    documentsCenter: 'Documents Center',
    settings: 'Settings',
    fileClaim: 'File a Claim',
    claimCategory: 'Claim Category *',
    selectCategory: 'Select category',
    claimAmountINR: 'Claim Amount (INR) *',
    enterAmount: 'Enter amount',
    incidentDate: 'Incident Date *',
    hospitalProvider: 'Hospital / Service Provider',
    enterProvider: 'Enter provider name',
    incidentDescription: 'Incident Description *',
    incidentDetail: 'Describe the incident in detail...',
    dragDrop: 'Drag & drop files here or click to browse',
    reset: 'Reset',
    submitClaim: 'Submit Claim',
    allStatus: 'All Status',
    claimID: 'Claim ID',
    policy: 'Policy',
    amount: 'Amount',
    status: 'Status',
    processingStage: 'Processing Stage',
    fraudRisk: 'Fraud Risk',
    actions: 'Actions',
    noClaimsFound: 'No claims found',
    claimTimeline: 'Claim Timeline',
    submitted: 'Submitted',
    verification: 'Verification',
    docsVerified: 'Documents verified',
    fraudCheck: 'Fraud Check',
    aiAnalysis: 'AI analysis in progress',
    riskReview: 'Risk Review',
    finalDecision: 'Final Decision',
    noPoliciesFound: 'No policies found',
    noPoliciesDesc: "You don't have any active policies yet. Add your first policy to get started.",
    addFirstPolicy: 'Add Your First Policy',
    addPolicy: 'Add Policy',
    totalPolicies: 'Total Policies',
    expiringSoon: 'Expiring Soon',
    active: 'Active',
    expired: 'Expired',
    allPolicies: 'All Policies',
    searchPolicies: 'Search policies...',
    manageCoverage: 'Manage your insurance coverage and policy details',
    noRecentActivity: 'No recent activity',
    recentActivity: 'Recent Activity',
    recentClaimProgress: 'Recent Claim Progress',
    noDocuments: 'No documents found',
    uploadDocument: 'Upload Document',
    documentCategory: 'Document Category',
    markAllRead: 'Mark All as Read',
    aiAssistant: 'AI Assistant',
    typeMessage: 'Type your message...',
    send: 'Send',
    close: 'Close',
    upload: 'Upload',
    viewDetails: 'View Details',
    download: 'Download',
    trustedPartner: 'Your trusted insurance partner',
    connecting: 'Connecting...',
    profile: 'Profile',
    myProfile: 'My Profile',
    editProfile: 'Edit Profile',
    personalInfo: 'Personal Information',
    fullName: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    accountSettings: 'Account Settings',
    emailNotifications: 'Email Notifications',
    emailNotifDesc: 'Receive email updates about your claims and policies',
    smsNotifications: 'SMS Notifications',
    smsNotifDesc: 'Receive SMS alerts for important updates',
    twoFactorAuth: 'Two-Factor Authentication',
    twoFactorDesc: 'Add an extra layer of security to your account'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    welcomeBack: 'वापसी पर स्वागत है! यहां आपका बीमा विवरण है।',
    pendingClaims: 'लंबित दावे',
    approvedClaims: 'स्वीकृत दावे',
    quickActions: 'त्वरित कार्य',
    fileNewClaim: 'नया दावा दायर करें',
    uploadDocuments: 'दस्तावेज़ अपलोड करें',
    viewPolicies: 'पॉलिसी देखें',
    myPolicies: 'मेरी पॉलिसियां',
    myClaims: 'मेरे दावे',
    documents: 'दस्तावेज़',
    documentsCenter: 'दस्तावेज़ केंद्र',
    settings: 'सेटिंग्स',
    fileClaim: 'दावा दायर करें',
    notifications: 'सूचनाएं',
    noNotifications: 'कोई सूचना नहीं',
    viewPolicies: 'पॉलिसी देखें',
    myPolicies: 'मेरी पॉलिसियां',
    myClaims: 'मेरे दावे',
    documents: 'दस्तावेज़',
    documentsCenter: 'दस्तावेज़ केंद्र',
    settings: 'सेटिंग्स',
    fileClaim: 'दावा दायर करें',
    claimCategory: 'दावे का प्रकार *',
    selectCategory: 'श्रेणी चुनें',
    claimAmountINR: 'दावे की राशि (INR) *',
    enterAmount: 'राशि दर्ज करें',
    incidentDate: 'घटना की तारीख *',
    hospitalProvider: 'अस्पताल / सेवा प्रदाता',
    enterProvider: 'प्रदाता का नाम दर्ज करें',
    incidentDescription: 'घटना का विवरण *',
    incidentDetail: 'घटना का विस्तार से वर्णन करें...',
    dragDrop: 'फाइलें यहां खींचें और छोड़ें या ब्राउज़ करने के लिए क्लिक करें',
    reset: 'रीसेट',
    submitClaim: 'दावा जमा करें',
    allStatus: 'सभी स्थिति',
    claimID: 'दावा आईडी',
    policy: 'पॉलिसी',
    amount: 'राशि',
    status: 'स्थिति',
    processingStage: 'प्रोसेसिंग चरण',
    fraudRisk: 'धोखाधड़ी जोखिम',
    actions: 'कार्रवाई',
    noClaimsFound: 'कोई दावा नहीं मिला',
    claimTimeline: 'दावा टाइमलाइन',
    submitted: 'जमा किया गया',
    verification: 'सत्यापन',
    docsVerified: 'दस्तावेज़ सत्यापित',
    fraudCheck: 'धोखाधड़ी जांच',
    aiAnalysis: 'AI विश्लेषण जारी',
    riskReview: 'जोखिम समीक्षा',
    finalDecision: 'अंतिम निर्णय',
    noPoliciesFound: 'कोई पॉलिसी नहीं मिली',
    noPoliciesDesc: 'आपकी कोई सक्रिय पॉलिसी नहीं है। शुरू करने के लिए अपनी पहली पॉलिसी जोड़ें।',
    addFirstPolicy: 'अपनी पहली पॉलिसी जोड़ें',
    addPolicy: 'पॉलिसी जोड़ें',
    totalPolicies: 'कुल पॉलिसियां',
    expiringSoon: 'जल्द समाप्त होने वाली',
    active: 'सक्रिय',
    expired: 'समाप्त',
    allPolicies: 'सभी पॉलिसियां',
    searchPolicies: 'पॉलिसी खोजें...',
    manageCoverage: 'अपना बीमा कवरेज और पॉलिसी विवरण प्रबंधित करें',
    noRecentActivity: 'कोई हालिया गतिविधि नहीं',
    recentActivity: 'हालिया गतिविधि',
    recentClaimProgress: 'हालिया दावा प्रगति',
    noDocuments: 'कोई दस्तावेज़ नहीं मिला',
    uploadDocument: 'दस्तावेज़ अपलोड करें',
    documentCategory: 'दस्तावेज़ श्रेणी',
    markAllRead: 'सभी पढ़ा हुआ चिह्नित करें',
    aiAssistant: 'AI सहायक',
    typeMessage: 'अपना संदेश लिखें...',
    send: 'भेजें',
    close: 'बंद करें',
    upload: 'अपलोड',
    trustedPartner: 'आपका विश्वसनीय बीमा साथी',
    connecting: 'कनेक्ट हो रहा है...',
    profile: 'प्रोफाइल',
    myProfile: 'मेरी प्रोफाइल',
    editProfile: 'प्रोफाइल संपादित करें',
    personalInfo: 'व्यक्तिगत जानकारी',
    fullName: 'पूरा नाम',
    email: 'ईमेल',
    phone: 'फोन',
    address: 'पता',
    accountSettings: 'खाता सेटिंग्स',
    emailNotifications: 'ईमेल सूचनाएं',
    emailNotifDesc: 'अपने दावों और पॉलिसियों के बारे में ईमेल अपडेट प्राप्त करें',
    smsNotifications: 'एसएमएस सूचनाएं',
    smsNotifDesc: 'महत्वपूर्ण अपडेट के लिए एसएमएस अलर्ट प्राप्त करें',
    twoFactorAuth: 'दो-कारक प्रमाणीकरण',
    twoFactorDesc: 'अपने खाते में अतिरिक्त सुरक्षा जोड़ें'
  },
  te: {
    dashboard: 'డాష్‌బోర్‌డ',
    welcomeBack: 'స్వాగతం! మీ బీమా వివరాలు ఇక్కడ ఉన్నాయి.',
    pendingClaims: 'పెండింగ్ క్లైమ్‌లు',
    approvedClaims: 'ఆమోదించబడిన క్లైమ్‌లు',
    quickActions: 'త్వరిత చర్యలు',
    fileNewClaim: 'కొత్త క్లైమ్',
    uploadDocuments: 'పత్రాలు అప్‌లోడ్',
    viewPolicies: 'పాలసీలను చూడండి',
    myPolicies: 'నా పాలసీలు',
    myClaims: 'నా క్లైమ్‌లు',
    documents: 'పత్రాలు',
    documentsCenter: 'పత్రాల కేంద్రం',
    settings: 'సెట్టింగులు',
    fileClaim: 'క్లైమ్',
    notifications: 'నోటిఫికేషన్లు',
    noNotifications: 'నోటిఫికేషన్లు లేవు',
    notificationsCenter: 'నోటిఫికేషన్ కేంద్రం',
    myProfile: 'నా ఫ్రాఫైల్',
    editProfile: 'ఫ్రాఫైల్',
    personalInfo: 'వ్యక్తిగత సమాచారం',
    fullName: 'పూర్తి పేరు',
    email: 'ఇమెయిల్',
    phone: 'ఫోన్',
    address: 'చిరునామా',
    accountSettings: 'ఖాతా సెట్టింగులు',
    emailNotifications: 'ఇమెయిల్ నోటిఫికేషన్లు',
    emailNotifDesc: 'మీ క్లైమ్‌లు మరియు పాలసీల గురించి ఇమెయిల్ అప్‌డేట్‌లు పొందండి',
    smsNotifications: 'ఎస్‌ఎమ్‌ఎస్ నోటిఫికేషన్లు',
    smsNotifDesc: 'ముఖ్యమైన అప్‌డేట్‌ల కోసం ఎస్‌ఎమ్‌ఎస్ అలర్ట్‌లు పొందండి',
    twoFactorAuth: 'రెండు-కారకాల ధృవీకరణ',
    twoFactorDesc: 'మీ ఖాతాకు అదనపు భద్రతను జోడించండి',
    recentActivity: 'ఇటీవల కార్యకలాపం',
    recentClaimProgress: 'ఇటీవల క్లైమ్ పురోగతి',
    claimCategory: 'క్లైమ్ వర్గం',
    selectCategory: 'వర్గం ఎంచుకుండి',
    claimAmountINR: 'క్లైమ్ మొత్తం (INR)',
    enterAmount: 'మొత్తం నమోదు చేయండి',
    incidentDate: 'ఘటన తేదీ',
    hospitalProvider: 'ఆసుపత్రి / సేవా ప్రొవైడర్',
    enterProvider: 'ప్రొవైడర్ పేరు నమోదు చేయండి',
    incidentDescription: 'ఘటన వివరణ',
    incidentDetail: 'ఘటన గురించి వివరంగా వర్ణించండి...',
    dragDrop: 'ఫైల్‌ను ఇక్కడ డ్రాగ్ చేయండి లేదా బ్రౌజ్ చేయండి',
    reset: 'రీసెట్',
    submitClaim: 'క్లైమ్ సబ్మిట్',
    allStatus: 'అన్ని స్థితి',
    claimID: 'క్లైమ్ ID',
    policy: 'పాలసీ',
    amount: 'మొత్తం',
    status: 'స్థితి',
    processingStage: 'ప్రాసెసింగ్ స్టేజ్',
    fraudRisk: 'మోసపు రిస్క్',
    actions: 'చర్యలు',
    noClaimsFound: 'క్లైమ్‌లు కనుగొనబడలేదు',
    claimTimeline: 'క్లైమ్ టైమ్‌లైన్',
    submitted: 'సబ్మిట్ చేయబడింది',
    verification: 'ధృవీకరణ',
    docsVerified: 'పత్రాలు ధృవీకరించబడ్డాయి',
    fraudCheck: 'మోసపు తనిఖీ',
    aiAnalysis: 'AI విశ్లేషణ పురోగతిలో ఉంది',
    riskReview: 'రిస్క్ రివ్యూ',
    finalDecision: 'చివరి నిర్ణయం',
    noPoliciesFound: 'పాలసీలు కనుగొనబడలేదు',
    noPoliciesDesc: 'మీకు యాక్టివ్ పాలసీలు లేవు. ప్రారంభించడానికి మీ మొదటి పాలసీని జోడించండి.',
    addFirstPolicy: 'మీ మొదటి పాలసీని జోడించండి',
    addPolicy: 'పాలసీని జోడించండి',
    totalPolicies: 'మొత్తం పాలసీలు',
    expiringSoon: 'త్వరలో ముగిసేవి',
    active: 'యాక్టివ్',
    expired: 'గడువు ముగిసింది',
    allPolicies: 'అన్ని పాలసీలు',
    searchPolicies: 'పాలసీలను శోధించండి...',
    manageCoverage: 'మీ బీమా కవరేజ్ మరియు పాలసీ వివరాలను నిర్వహించండి',
    noRecentActivity: 'ఇటీవల కార్యకలాపం లేదు',
    noDocuments: 'పత్రాలు కనుగొనబడలేదు',
    uploadDocument: 'పత్రం అప్‌లోడ్',
    documentCategory: 'పత్రం వర్గం',
    markAllRead: 'అన్నీ చదివినవి',
    aiAssistant: 'AI అసిస్టెంట్',
    typeMessage: 'మీ సందేశం టైప్ చేయండి...',
    send: 'పంపండి',
    close: 'మూసివేయండి',
    upload: 'అప్‌లోడ్',
    trustedPartner: 'మీ విశ్వసనీయ బీమా భాగస్వామి',
    connecting: 'కనెక్ట్ అవుతోంది...',
    profile: 'ఫ్రాఫైల్',
    viewDetails: 'వివరాలు చూడండి',
    download: 'డౌన్‌లోడ్',
    pending: 'పెండింగ్',
    approved: 'ఆమోదించబడింది',
    rejected: 'తిరస్కరించబడింది'
  }
};

// Change language function
function changeLanguage(lang) {
  if (!translations[lang]) {
    console.warn(`Language '${lang}' not supported`);
    return;
  }
  
  localStorage.setItem('insuraiLanguage', lang);
  dashboardState.currentLanguage = lang;
  const t = translations[lang];
  
  // Update page title
  document.getElementById('page-title').textContent = t.dashboard;
  document.getElementById('page-subtitle').textContent = t.welcomeBack;
  
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.textContent = t[key];
    }
  });
  
  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) {
      el.placeholder = t[key];
    }
  });
  
  // Update sidebar navigation - force update all nav items
  const navItems = document.querySelectorAll('.sidebar-menu a span');
  const navMap = {
    'Dashboard': t.dashboard,
    'File Claim': t.fileClaim,
    'My Claims': t.myClaims,
    'My Policies': t.myPolicies,
    'Documents Center': t.documentsCenter,
    'Notifications': t.notifications,
    'AI Assistant': t.aiAssistant,
    'Profile': t.profile
  };
  navItems.forEach(item => {
    const text = item.textContent.trim();
    if (navMap[text]) {
      item.textContent = navMap[text];
    }
  });
  
  // Update section titles without data-i18n
  document.querySelectorAll('.section-title').forEach(el => {
    const text = el.textContent.trim();
    const map = {
      'Quick Actions': t.quickActions,
      'Recent Activity': t.recentActivity,
      'Recent Claim Progress': t.recentClaimProgress,
      'File a New Claim': t.fileClaim,
      'My Claims': t.myClaims,
      'My Policies': t.myPolicies,
      'Documents Center': t.documentsCenter,
      'Notifications': t.notifications,
      'AI Assistant': t.aiAssistant,
      'My Profile': t.myProfile
    };
    if (map[text]) {
      el.textContent = map[text];
    }
  });
  
  // Update stat cards
  document.querySelectorAll('.stat-content p, .summary-content p').forEach(el => {
    const text = el.textContent.trim();
    const map = {
      'Pending Claims': t.pendingClaims,
      'Approved Claims': t.approvedClaims,
      'Total Policies': t.totalPolicies,
      'Expiring Soon': t.expiringSoon,
      'Active Policies': t.activePolicies
    };
    if (map[text]) {
      el.textContent = map[text];
    }
  });
  
  // Update action buttons
  document.querySelectorAll('.action-btn span').forEach(el => {
    const text = el.textContent.trim();
    const map = {
      'File New Claim': t.fileNewClaim,
      'Upload Documents': t.uploadDocuments,
      'View Policies': t.viewPolicies
    };
    if (map[text]) {
      el.textContent = map[text];
    }
  });
  
  // Update no-data messages
  document.querySelectorAll('.no-data, .no-data p, .activity-content p, .notification-content p').forEach(el => {
    const text = el.textContent.trim();
    if (text === 'No recent activity') el.textContent = t.noRecentActivity || 'No recent activity';
    if (text === 'No notifications') el.textContent = t.noNotifications;
    if (text === 'No claims found') el.textContent = t.noClaimsFound;
    if (text === 'No policies found') el.textContent = t.noPoliciesFound;
    if (text === 'No documents found') el.textContent = t.noDocuments;
  });
  
  // Update profile section
  document.querySelectorAll('.detail-section h4').forEach(el => {
    const text = el.textContent.trim();
    if (text === 'Personal Information') el.textContent = t.personalInfo;
    if (text === 'Account Settings') el.textContent = t.accountSettings;
  });
  
  document.querySelectorAll('.setting-info h5').forEach(el => {
    const text = el.textContent.trim();
    const map = {
      'Email Notifications': t.emailNotifications,
      'SMS Notifications': t.smsNotifications,
      'Two-Factor Authentication': t.twoFactorAuth
    };
    if (map[text]) el.textContent = map[text];
  });
  
  document.querySelectorAll('.setting-info p').forEach(el => {
    const text = el.textContent.trim();
    if (text.includes('email updates')) el.textContent = t.emailNotifDesc;
    if (text.includes('SMS alerts')) el.textContent = t.smsNotifDesc;
    if (text.includes('extra layer')) el.textContent = t.twoFactorDesc;
  });
  
  // Update user role
  const userRoleEl = document.querySelector('.user-role');
  if (userRoleEl) {
    userRoleEl.textContent = lang === 'hi' ? 'पॉलिसी धारक' : lang === 'te' ? 'पॉలిసీ హోల్డర్' : 'Policy Holder';
  }
  
  showNotification(`Language changed to ${lang === 'hi' ? 'Hindi' : lang === 'te' ? 'Telugu' : 'English'}`, 'success');
  console.log(`Language changed to: ${lang}`);
}

// Initialize language on load and set up event listeners
document.addEventListener('DOMContentLoaded', function() {
  const savedLang = localStorage.getItem('insuraiLanguage') || 'en';
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    langSelect.value = savedLang;
    if (savedLang !== 'en') {
      setTimeout(() => changeLanguage(savedLang), 100);
    }
  }
  
  // Set up claim form submission
  const claimForm = document.getElementById('claim-form');
  if (claimForm) {
    claimForm.addEventListener('submit', handleClaimSubmit);
  }
  
  // Connect to backend on load
  connectToBackend();
});

// Navigate to page function
function navigateTo(page) {
  dashboardState.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(page + '-page');
  if (targetPage) targetPage.classList.add('active');
  document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-page') === page) link.classList.add('active');
  });
  console.log('Navigated to:', page);
}

// Toggle sidebar function
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

// Close modal function
function closeModal() {
  document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
}

// Reset claim form function
function resetClaimForm() {
  document.getElementById('claim-form')?.reset();
  document.getElementById('uploaded-files').innerHTML = '';
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




// Missing Functions Implementation

// Update Claims Table function
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
    row.innerHTML = `
      <td>${claim.claimNumber || claim.id || 'N/A'}</td>
      <td>${claim.claimType || claim.type || 'N/A'}</td>
      <td>₹${(claim.claimAmount || claim.amount || 0).toLocaleString()}</td>
      <td>${claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString() : 'N/A'}</td>
      <td><span class="status-badge status-${(claim.status || 'pending').toLowerCase()}">${claim.status || 'Pending'}</span></td>
      <td><span class="risk-badge risk-low">${claim.riskScore || 'Low'}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-sm btn-primary" onclick="viewClaimDetails('${claim.id || claim.claimNumber}')">View</button>
        </div>
      </td>
    `;
    claimsTableBody.appendChild(row);
  });
}

// Update Policies Table function
function updatePoliciesTable(policies) {
  const policiesGrid = document.getElementById('policies-grid');
  if (!policiesGrid) return;
  
  policiesGrid.innerHTML = '';
  
  if (!policies || policies.length === 0) {
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
  
  policiesGrid.innerHTML = policies.map(policy => {
    const policyId = policy.policyNumber || `POL-${policy.id}`;
    const policyType = policy.policyType || policy.type || 'Insurance Policy';
    const coverage = policy.coverageAmount || policy.coverage || 0;
    const premium = policy.premium || 0;
    const startDate = policy.startDate ? new Date(policy.startDate).toLocaleDateString() : 'N/A';
    const endDate = policy.endDate ? new Date(policy.endDate).toLocaleDateString() : 'N/A';
    const status = policy.status || 'ACTIVE';
    const statusClass = status.toLowerCase();
    
    return `
      <div class="policy-card" onclick="viewPolicyDetails('${policyId}')">
        <div class="policy-card-header">
          <div class="policy-icon">
            <i class="fas fa-file-alt"></i>
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

// Update Notification Badge function
function updateNotificationBadge(count) {
  const badge = document.getElementById('notification-badge');
  if (!badge) return;
  badge.textContent = count > 0 ? count : '0';
  badge.style.display = count > 0 ? 'inline-flex' : 'none';
}

// Format Time Ago function
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

// Filter and Search Policies function
function filterAndSearchPolicies(searchTerm, filterValue) {
  const policiesGrid = document.getElementById('policies-grid');
  if (!policiesGrid) return;
  
  let filteredPolicies = dashboardState.policies;
  
  // Apply filter
  if (filterValue !== 'all') {
    filteredPolicies = filteredPolicies.filter(policy => {
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
    });
  }
  
  // Apply search
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    filteredPolicies = filteredPolicies.filter(policy => {
      const policyNumber = (policy.policyNumber || '').toLowerCase();
      const policyType = (policy.policyType || policy.type || '').toLowerCase();
      const provider = (policy.provider || '').toLowerCase();
      return policyNumber.includes(searchLower) || 
             policyType.includes(searchLower) || 
             provider.includes(searchLower);
    });
  }
  
  // Re-render filtered policies
  updatePoliciesTable(filteredPolicies);
}

// Load Documents Data function
async function loadDocumentsData() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const response = await fetch(`${API_CONFIG.baseUrl}/documents/user`, {
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
    }
  } catch (error) {
    console.error('Error loading documents:', error);
  }
}

// Update Documents Table function
function updateDocumentsTable(documents) {
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
      const uploadDate = doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'N/A';
      
      return `
        <div class="document-card">
          <div class="document-icon">
            <i class="fas fa-file-alt"></i>
          </div>
          <div class="document-info">
            <h4>${docName}</h4>
            <p>Category: ${docCategory}</p>
            <p>Uploaded: ${uploadDate}</p>
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
}

// Load Support Tickets function
async function loadSupportTickets() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const response = await fetch(`${API_CONFIG.baseUrl}/support/tickets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const tickets = await response.json();
      updateSupportTicketsTable(tickets);
    }
  } catch (error) {
    console.error('Error loading support tickets:', error);
  }
}

// Update Support Tickets Table function
function updateSupportTicketsTable(tickets) {
  const ticketsTableBody = document.getElementById('support-tickets-body');
  if (!ticketsTableBody) return;
  
  ticketsTableBody.innerHTML = '';
  
  if (!tickets || tickets.length === 0) {
    ticketsTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="no-data">No support tickets found</td>
      </tr>
    `;
    return;
  }
  
  tickets.forEach(ticket => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${ticket.id || 'N/A'}</td>
      <td>${ticket.subject || 'No subject'}</td>
      <td>${ticket.category || 'General'}</td>
      <td><span class="status-badge status-${(ticket.status || 'open').toLowerCase()}">${ticket.status || 'Open'}</span></td>
      <td>${ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}</td>
    `;
    ticketsTableBody.appendChild(row);
  });
}

// Mark as Read function
async function markAsRead(notificationId) {
  if (!notificationId) return;
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      showNotification('Please log in to manage notifications', 'warning');
      return;
    }
    const response = await fetch(`${API_CONFIG.baseUrl}/notifications/${notificationId}/read`, {
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

// View Document Details function
function viewDocumentDetails(docId) {
  const doc = dashboardState.documents.find(d => d.id === docId);
  if (!doc) {
    showNotification('Document not found', 'error');
    return;
  }
  
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
            <span class="detail-value">${doc.fileName || doc.name || 'N/A'}</span>
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
            <span class="detail-label">Status:</span>
            <span class="detail-value status-${(doc.status || 'uploaded').toLowerCase()}">${doc.status || 'Uploaded'}</span>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Show Add Policy Modal function
function showAddPolicyModal() {
  const modal = document.getElementById('add-policy-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

// Close Add Policy Modal function
function closeAddPolicyModal() {
  const modal = document.getElementById('add-policy-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

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

