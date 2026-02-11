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
        setTimeout(initWebSocket,
