/**
 * ForgeAssist Chat Interface 
 * Provides a user-friendly chat interface for interacting with ForgeAssist
 */

import ForgeAssist from './forgeassist.js';

(function() {
    // DOM Elements
    let chatContainer;
    let chatToggle;
    let chatPanel;
    let chatMessages;
    let chatInput;
    let chatSend;
    let chatMinimize;
    let suggestionsContainer;
    
    // Initialize chat interface after DOM loads
    document.addEventListener('DOMContentLoaded', initChatInterface);
    
    function initChatInterface() {
        // Get DOM elements
        chatContainer = document.getElementById('forge-chat-container');
        chatToggle = document.getElementById('forge-chat-toggle');
        chatPanel = document.getElementById('forge-chat-panel');
        chatMessages = document.getElementById('forge-chat-messages');
        chatInput = document.getElementById('forge-chat-input');
        chatSend = document.getElementById('forge-chat-send');
        chatMinimize = document.getElementById('forge-chat-minimize');
        suggestionsContainer = document.querySelector('.forge-chat-suggestions');
        
        if (!chatContainer) {
            console.error('ForgeAssist Chat: Could not find chat container elements');
            return;
        }
        
        // Add event listeners
        chatToggle.addEventListener('click', toggleChat);
        chatMinimize.addEventListener('click', toggleChat);
        chatSend.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Add event listeners to suggestion chips
        document.querySelectorAll('.forge-chat-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', function() {
                const command = this.getAttribute('data-command');
                if (command) {
                    chatInput.value = command;
                    sendMessage();
                }
            });
        });
        
        // Check URL parameters for auto-open
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('forgeassist') === 'open') {
            openChat();
        }
    }
    
    function toggleChat() {
        if (chatContainer.classList.contains('is-open')) {
            closeChat();
        } else {
            openChat();
        }
    }
    
    function openChat() {
        chatContainer.classList.add('is-open');
        chatInput.focus();
    }
    
    function closeChat() {
        chatContainer.classList.remove('is-open');
    }
    
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addMessageToChat(message, 'user');
        
        // Clear input
        chatInput.value = '';
        
        // Process command through ForgeAssist
        processCommand(message);
    }
    
    function processCommand(message) {
        // Show typing indicator
        showTypingIndicator();
        
        // Process with ForgeAssist after a slight delay for UX
        setTimeout(() => {
            if (ForgeAssist && typeof ForgeAssist.processCommand === 'function') {
                ForgeAssist.processCommand(message)
                    .then(response => {
                        // Remove typing indicator and add response
                        removeTypingIndicator();
                        addMessageToChat(response, 'assistant');
                    })
                    .catch(error => {
                        console.error('ForgeAssist error:', error);
                        removeTypingIndicator();
                        addMessageToChat('Sorry, I encountered an error processing your request.', 'assistant');
                    });
            } else {
                // Fallback if ForgeAssist isn't available
                console.warn('ForgeAssist module not fully loaded or compatible');
                removeTypingIndicator();
                addMessageToChat('I\'m having trouble connecting to the ForgeAssist system. Please try again later.', 'assistant');
            }
        }, 500);
    }
    
    function addMessageToChat(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `forge-chat-message ${sender}`;
        
        let avatar;
        if (sender === 'user') {
            avatar = '👤';
        } else {
            avatar = '🤖';
        }
        
        messageElement.innerHTML = `
            <div class="forge-chat-avatar">${avatar}</div>
            <div class="forge-chat-bubble">${message}</div>
        `;
        
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.className = 'forge-chat-message assistant typing-indicator';
        typingElement.innerHTML = `
            <div class="forge-chat-avatar">🤖</div>
            <div class="forge-chat-bubble">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        
        typingElement.id = 'forge-chat-typing';
        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function removeTypingIndicator() {
        const typingElement = document.getElementById('forge-chat-typing');
        if (typingElement) {
            typingElement.remove();
        }
    }
    
    // Expose the chat API
    window.ForgeAssistChat = {
        open: openChat,
        close: closeChat,
        toggle: toggleChat,
        addMessage: addMessageToChat
    };
})(); 