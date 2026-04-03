-- ============================================
-- Audit Logs Table Setup for InsurAI
-- ============================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    user_name VARCHAR(255),
    user_role VARCHAR(50),
    action VARCHAR(100),
    module VARCHAR(100),
    status VARCHAR(20),
    description TEXT,
    ip_address VARCHAR(45),
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_module (module),
    INDEX idx_status (status)
);

-- Insert sample audit logs (last 7 days)
INSERT INTO audit_logs (user_id, user_name, user_role, action, module, status, description, ip_address, timestamp) VALUES
-- Today's logs
(1, 'admin@insurai.com', 'ADMIN', 'LOGIN', 'auth', 'SUCCESS', 'Admin user logged in successfully', '192.168.1.100', NOW() - INTERVAL 1 HOUR),
(2, 'john.doe@example.com', 'USER', 'CREATE', 'policies', 'SUCCESS', 'Created new health insurance policy POL-2024-001', '192.168.1.101', NOW() - INTERVAL 2 HOUR),
(3, 'underwriter@insurai.com', 'UNDERWRITER', 'APPROVE', 'claims', 'SUCCESS', 'Approved claim CLM-2024-001 for ₹50,000', '192.168.1.102', NOW() - INTERVAL 3 HOUR),
(4, 'hr@insurai.com', 'HR', 'UPDATE', 'users', 'SUCCESS', 'Updated employee department mapping', '192.168.1.103', NOW() - INTERVAL 4 HOUR),
(2, 'john.doe@example.com', 'USER', 'CREATE', 'claims', 'SUCCESS', 'Submitted claim CLM-2024-002 for ₹25,000', '192.168.1.101', NOW() - INTERVAL 5 HOUR),
(3, 'underwriter@insurai.com', 'UNDERWRITER', 'REJECT', 'claims', 'FAILED', 'Rejected claim CLM-2024-003 - insufficient documentation', '192.168.1.102', NOW() - INTERVAL 6 HOUR),

-- Yesterday's logs
(1, 'admin@insurai.com', 'ADMIN', 'DELETE', 'users', 'SUCCESS', 'Deleted inactive user account', '192.168.1.100', NOW() - INTERVAL 1 DAY),
(5, 'jane.smith@example.com', 'USER', 'UPDATE', 'policies', 'SUCCESS', 'Renewed policy POL-2023-045', '192.168.1.104', NOW() - INTERVAL 1 DAY - INTERVAL 2 HOUR),
(3, 'underwriter@insurai.com', 'UNDERWRITER', 'APPROVE', 'policies', 'SUCCESS', 'Approved policy POL-2024-002 after review', '192.168.1.102', NOW() - INTERVAL 1 DAY - INTERVAL 4 HOUR),
(4, 'hr@insurai.com', 'HR', 'CREATE', 'users', 'SUCCESS', 'Added new employee record for Sarah Johnson', '192.168.1.103', NOW() - INTERVAL 1 DAY - INTERVAL 6 HOUR),

-- 2 days ago
(2, 'john.doe@example.com', 'USER', 'LOGIN', 'auth', 'SUCCESS', 'User logged in successfully', '192.168.1.101', NOW() - INTERVAL 2 DAY),
(1, 'admin@insurai.com', 'ADMIN', 'UPDATE', 'system', 'SUCCESS', 'Updated system configuration settings', '192.168.1.100', NOW() - INTERVAL 2 DAY - INTERVAL 3 HOUR),
(3, 'underwriter@insurai.com', 'UNDERWRITER', 'REJECT', 'claims', 'SUCCESS', 'Rejected fraudulent claim CLM-2024-004', '192.168.1.102', NOW() - INTERVAL 2 DAY - INTERVAL 5 HOUR),

-- 3 days ago
(5, 'jane.smith@example.com', 'USER', 'CREATE', 'policies', 'SUCCESS', 'Purchased new life insurance policy', '192.168.1.104', NOW() - INTERVAL 3 DAY),
(4, 'hr@insurai.com', 'HR', 'UPDATE', 'users', 'SUCCESS', 'Updated employee salary information', '192.168.1.103', NOW() - INTERVAL 3 DAY - INTERVAL 2 HOUR),
(1, 'admin@insurai.com', 'ADMIN', 'LOGIN', 'auth', 'FAILED', 'Failed login attempt - incorrect password', '192.168.1.100', NOW() - INTERVAL 3 DAY - INTERVAL 4 HOUR),

-- 4 days ago
(2, 'john.doe@example.com', 'USER', 'UPDATE', 'policies', 'SUCCESS', 'Updated policy beneficiary information', '192.168.1.101', NOW() - INTERVAL 4 DAY),
(3, 'underwriter@insurai.com', 'UNDERWRITER', 'APPROVE', 'claims', 'SUCCESS', 'Approved claim CLM-2024-005 for ₹75,000', '192.168.1.102', NOW() - INTERVAL 4 DAY - INTERVAL 3 HOUR),

-- 5 days ago
(5, 'jane.smith@example.com', 'USER', 'CREATE', 'claims', 'SUCCESS', 'Submitted claim CLM-2024-006 for ₹30,000', '192.168.1.104', NOW() - INTERVAL 5 DAY),
(1, 'admin@insurai.com', 'ADMIN', 'DELETE', 'policies', 'SUCCESS', 'Cancelled expired policy POL-2022-089', '192.168.1.100', NOW() - INTERVAL 5 DAY - INTERVAL 2 HOUR),

-- 6 days ago
(4, 'hr@insurai.com', 'HR', 'CREATE', 'users', 'SUCCESS', 'Onboarded new employee Michael Brown', '192.168.1.103', NOW() - INTERVAL 6 DAY),
(2, 'john.doe@example.com', 'USER', 'LOGOUT', 'auth', 'SUCCESS', 'User logged out', '192.168.1.101', NOW() - INTERVAL 6 DAY - INTERVAL 8 HOUR),

-- 7 days ago
(3, 'underwriter@insurai.com', 'UNDERWRITER', 'UPDATE', 'claims', 'SUCCESS', 'Updated claim processing status', '192.168.1.102', NOW() - INTERVAL 7 DAY),
(1, 'admin@insurai.com', 'ADMIN', 'CREATE', 'users', 'SUCCESS', 'Created new admin user account', '192.168.1.100', NOW() - INTERVAL 7 DAY - INTERVAL 4 HOUR);

-- Verify data was inserted
SELECT COUNT(*) as total_logs FROM audit_logs;
SELECT 
    module,
    COUNT(*) as log_count,
    SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
FROM audit_logs 
GROUP BY module 
ORDER BY log_count DESC;

-- ============================================
-- Real-time Update Fix for Admin Dashboard
-- ============================================
-- Add this to the JavaScript to enable real-time updates:

-- The frontend already has WebSocket support, but we need to ensure
-- the backend is sending updates. For now, we'll add a polling mechanism
-- that refreshes the audit logs every 10 seconds when on the page.

-- Add this JavaScript snippet to admin-dashboard-v2.js:
/*
// Auto-refresh audit logs every 10 seconds when on the page
setInterval(() => {
    if (state.currentPage === 'audit-logs') {
        // Only refresh if we're not already loading
        const tbody = document.getElementById('audit-logs-body');
        if (tbody && !tbody.classList.contains('loading')) {
            loadAuditLogsPage();
        }
    }
}, 10000);
*/