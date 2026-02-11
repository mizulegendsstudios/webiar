/**
 * LLM Web Modifier Frontend
 *
 * Handles the chat UI interactions and communication with the backend API for web modification.
 */

// DOM elements
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const htmlEditor = document.getElementById("html-editor");
const previewFrame = document.getElementById("preview-frame");
const connectionStatus = document.getElementById("connection-status");

// Chat state
let chatHistory = [
    {
        role: "assistant",
        content:
            "Hello! I'm an LLM web modifier. I can help you modify web content in real-time. Try giving me instructions like 'Make the title red and larger' or 'Add a button in the top right corner'.",
    },
];
let isProcessing = false;
let ws;

// Initialize WebSocket connection
function initWebSocket() {
    ws = new WebSocket('wss://webiar.mizulegendsstudios.workers.dev/ws');
    
    ws.onopen = () => {
        connectionStatus.classList.remove('status-offline');
        connectionStatus.classList.add('status-online');
        console.log('Connected to WebAI Worker');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat') {
            addMessageToChat('assistant', data.content);
        }
        
        if (data.type === 'updateHtml') {
            htmlEditor.value = data.html;
            updatePreview(data.html);
        }
        
        if (data.type === 'error') {
            addMessageToChat('assistant', `Error: ${data.message}`);
        }
    };
    
    ws.onclose = () => {
        connectionStatus.classList.remove('status-online');
        connectionStatus.classList.add('status-offline');
        console.log('Disconnected from WebAI Worker');
        setTimeout(initWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Auto-resize textarea as user types
userInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
});

htmlEditor.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
    
    // Send HTML update to server
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'updateHtml',
            html: this.value
        }));
    }
});

// Send message on Enter (without Shift)
userInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Send button click handler
sendButton.addEventListener("click", sendMessage);

/**
 * Sends a message to the chat API and processes the response
 */
async function sendMessage() {
    const message = userInput.value.trim();

    // Don't send empty messages
    if (message === "" || isProcessing) return;

    // Disable input while processing
    isProcessing = true;
    userInput.disabled = true;
    sendButton.disabled = true;

    // Add user message to chat
    addMessageToChat("user", message);

    // Clear input
    userInput.value = "";
    userInput.style.height = "auto";

    // Show typing indicator
    typingIndicator.classList.add("visible");

    // Add message to history
    chatHistory.push({ role: "user", content: message });

    try {
        // Send request to API
        ws.send(JSON.stringify({
            type: 'chat',
            message: message,
            html: htmlEditor.value
        }));
    } catch (error) {
        console.error("Error:", error);
        addMessageToChat(
            "assistant",
            "Sorry, there was an error processing your request.",
        );
    } finally {
        // Hide typing indicator
        typingIndicator.classList.remove("visible");

        // Re-enable input
        isProcessing = false;
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

/**
 * Helper function to add message to chat
 */
function addMessageToChat(role, content) {
    const messageEl = document.createElement("div");
    messageEl.className = `message ${role}-message`;
    messageEl.innerHTML = `<p>${content}</p>`;
    chatMessages.appendChild(messageEl);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Update the preview iframe with new HTML
 */
function updatePreview(html) {
    const previewDoc = previewFrame.contentDocument;
    previewDoc.open();
    previewDoc.write(html);
    previewDoc.close();
}

// Initialize WebSocket connection
initWebSocket();

// Initial preview update
updatePreview(htmlEditor.value);
