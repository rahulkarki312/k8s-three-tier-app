document.addEventListener('DOMContentLoaded', () => {
    const messageForm = document.getElementById('messageForm');
    const messageContent = document.getElementById('messageContent');
    const charCount = document.getElementById('charCount');
    const messagesList = document.getElementById('messagesList');
    const messageCount = document.getElementById('messageCount');
    const refreshBtn = document.getElementById('refreshBtn');
    
    // Character counter
    messageContent.addEventListener('input', () => {
        const length = messageContent.value.length;
        charCount.textContent = `${length}/500`;
        charCount.style.color = length > 450 ? '#dc2626' : '#6b7280';
    });
    
    // Load messages
    const loadMessages = async () => {
        try {
            const response = await fetch('/api/messages');
            const data = await response.json();
            
            if (data.success) {
                displayMessages(data.data);
                messageCount.textContent = `${data.count} message${data.count !== 1 ? 's' : ''}`;
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            messagesList.innerHTML = '<p class="error-message">Failed to load messages. Please try again.</p>';
        }
    };
    
    // Display messages
    const displayMessages = (messages) => {
        if (messages.length === 0) {
            messagesList.innerHTML = '<p class="empty-state">No messages yet. Post your first message!</p>';
            return;
        }
        
        messagesList.innerHTML = messages.map(message => `
            <div class="message-item">
                <p class="message-content">${escapeHtml(message.content)}</p>
                <p class="message-time">${new Date(message.created_at).toLocaleString()}</p>
            </div>
        `).join('');
    };
    
    // Submit message
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const content = messageContent.value.trim();
        if (!content) return;
        
        const submitBtn = messageForm.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                messageContent.value = '';
                charCount.textContent = '0/500';
                
                // Show success message briefly
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = 'Message posted successfully!';
                messageForm.appendChild(successMsg);
                
                setTimeout(() => successMsg.remove(), 3000);
                
                // Reload messages
                await loadMessages();
            } else {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.textContent = data.error || 'Failed to post message';
                messageForm.appendChild(errorMsg);
                
                setTimeout(() => errorMsg.remove(), 5000);
            }
        } catch (error) {
            console.error('Error posting message:', error);
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Network error. Please try again.';
            messageForm.appendChild(errorMsg);
            
            setTimeout(() => errorMsg.remove(), 5000);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
    });
    
    // Refresh button
    refreshBtn.addEventListener('click', loadMessages);
    
    // Escape HTML to prevent XSS
    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };
    
    // Initial load
    loadMessages();
    
    // Auto-refresh every 30 seconds
    setInterval(loadMessages, 30000);
});