// Notification real-time streaming module
// Handles Server-Sent Events for live notification updates

function getNotificationIcon(type) {
    const icons = {
        'claim': '📋',
        'policy': '📄',
        'alert': '⚠️',
        'success': '✅'
    };
    return icons[type] || '📬';
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationCount');
    if (!badge) return;
    badge.textContent = count > 0 ? count : '0';
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
}

function addNotificationToList(notification) {
    const container = document.getElementById('notificationsContent');
    if (!container) return;

    // Check for duplicates in existing notifications (within 5 minutes)
    const now = Date.now();
    const recentThreshold = 5 * 60 * 1000; // 5 minutes
    
    const existingItems = container.querySelectorAll('.notification-item');
    const isDuplicate = Array.from(existingItems).some(item => {
        const titleEl = item.querySelector('.notification-title');
        const timeEl = item.querySelector('.notification-time');
        if (!titleEl || !timeEl) return false;
        
        const existingTitle = titleEl.textContent.trim();
        const existingMessage = item.querySelector('.notification-message')?.textContent.trim() || '';
        const notificationTitle = notification.title || 'Notification';
        const notificationMessage = notification.message || '';
        
        // Check if title and message match
        if (existingTitle === notificationTitle && existingMessage === notificationMessage) {
            // Check if it's recent (within 5 minutes)
            const timeText = timeEl.textContent.trim();
            if (timeText.includes('just now') || timeText.includes('m ago') || timeText.includes('h ago')) {
                return true;
            }
        }
        return false;
    });

    if (isDuplicate) {
        console.log(`[Notifications] Duplicate notification suppressed: ${notification.title || notification.message}`);
        return; // Skip adding duplicate notification
    }

    // Additional throttling: prevent any notifications within 10 seconds of last notification
    const lastNotificationItem = container.querySelector('.notification-item');
    if (lastNotificationItem) {
        const timeEl = lastNotificationItem.querySelector('.notification-time');
        if (timeEl) {
            const timeText = timeEl.textContent.trim();
            if (timeText.includes('just now') || timeText.includes('m ago')) {
                console.log(`[Notifications] Notification throttled: too frequent (${timeText})`);
                return;
            }
        }
    }

    const html = `
        <div class="notification-item unread" onclick="markAsRead(${notification.id})">
            <div class="notification-icon">${getNotificationIcon(notification.type)}</div>
            <div class="notification-title">${notification.title || 'Notification'}</div>
            <div class="notification-message">${notification.message || ''}</div>
            <div class="notification-time">${getTimeAgo(notification.createdDate)}</div>
        </div>
    `;

    const existing = container.innerHTML.trim();
    if (!existing || existing.includes('No notifications')) {
        container.innerHTML = html;
    } else {
        container.insertAdjacentHTML('afterbegin', html);
    }

    const current = parseInt(document.getElementById('notificationCount')?.textContent || '0', 10) || 0;
    updateNotificationBadge(current + 1);
}

async function loadNotifications() {
    const token = localStorage.getItem('authToken');
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/user`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const container = document.getElementById('notificationsContent');
    if (response.ok) {
            const data = await response.json();
            const notifications = data.notifications || [];
            const unreadCount = notifications.filter(n => !n.read).length;

            updateNotificationBadge(unreadCount);

            if (!container) {
                return;
            }
            if (notifications.length === 0) {
                container.innerHTML = '<div class="notifications-empty">No notifications</div>';
                return;
            }

            const notificationsHTML = notifications.map(notif => `
                <div class="notification-item ${!notif.read ? 'unread' : ''}" onclick="markAsRead(${notif.id})">
                    <div class="notification-icon">${getNotificationIcon(notif.type)}</div>
                    <div class="notification-title">${notif.title || 'Notification'}</div>
                    <div class="notification-message">${notif.message || ''}</div>
                    <div class="notification-time">${getTimeAgo(notif.createdDate)}</div>
                </div>
            `).join('');

            document.getElementById('notificationsContent').innerHTML = notificationsHTML || '<div class="notifications-empty">No notifications</div>';
        } else {
            document.getElementById('notificationsContent').innerHTML = '<div class="notifications-empty">Failed to load notifications</div>';
        }
    } catch (error) {
        console.log('Could not load notifications (backend may not be running)');
        document.getElementById('notificationsContent').innerHTML = '<div class="notifications-empty">No notifications</div>';
    }
}

async function markAsRead(notificationId) {
    const token = localStorage.getItem('authToken');
    try {
        await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await loadNotifications();
    } catch (error) {
        console.error('Error marking as read:', error);
    }
}

if (typeof window.notificationSource === 'undefined') {
    window.notificationSource = null;
}

function setupNotificationStream(onNotification, onError) {
    if (notificationSource) {
        notificationSource.close();
        notificationSource = null;
    }

    notificationSource = createNotificationEventSource((notification) => {
        if (notification && typeof addNotificationToList === 'function') {
            addNotificationToList(notification);
        }
        if (onNotification) {
            onNotification(notification);
        }
    }, (err) => {
        if (onError) {
            onError(err);
        }
    });
}

function createNotificationEventSource(onNotification, onError) {
    const token = localStorage.getItem('authToken');
    const API = window.API_HOST || window.__API_URL__ || 'https://insurai.railway.app';
    const API_BASE_URL = window.API_BASE_URL || `${API}/api`;

    if (!token) {
        console.warn('No auth token available for notification stream');
        return null;
    }

    try {
        const eventSourceUrl = `${API_BASE_URL}/notifications/stream`;
        let aborted = false;
        const controller = new AbortController();

        fetch(eventSourceUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'text/event-stream'
            },
            signal: controller.signal
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Stream response ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            function readStream() {
                reader.read().then(({ done, value }) => {
                    if (done) return;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    lines.forEach(line => {
                        if (line.startsWith('data:')) {
                            try {
                                const jsonStr = line.substring(5).trim();
                                if (jsonStr) {
                                    const notification = JSON.parse(jsonStr);
                                    if (onNotification) {
                                        onNotification(notification);
                                    }
                                }
                            } catch (e) {
                                console.error('Error parsing notification:', e);
                            }
                        }
                    });

                    readStream();
                }).catch(err => {
                    if (!aborted && onError) {
                        onError(err);
                    }
                });
            }

            readStream();
        })
        .catch(err => {
            if (!aborted && onError) {
                onError(err);
            }
        });

        return {
            close: () => {
                aborted = true;
                controller.abort();
            }
        };
    } catch (error) {
        console.error('Error creating notification event source:', error);
        if (onError) onError(error);
        return null;
    }
}

