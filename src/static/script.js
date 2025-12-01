const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const clearChatButton = document.getElementById("clear-chat");

let isTyping = false;

const userAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
const botAvatar = "https://cdn-icons-png.flaticon.com/512/4712/4712039.png";

function addMessage(text, isUser) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.classList.add(isUser ? "user-message" : "bot-message");

    messageDiv.innerHTML = `
        <img src="${isUser ? userAvatar : botAvatar}" alt="${isUser ? "Аватарка пользователя" : "Аватарка бота"}" class="message-avatar">
        <div class="message-text">${text}</div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

const wsProtocol = location.protocol === "https:" ? "wss" : "ws";
const ws = new WebSocket(`${wsProtocol}://${location.host}/ws`);
ws.addEventListener("message", (e) => {
    if (isTyping) {
        isTyping = false;
        typingIndicator.style.display = "none";
        addMessage(e.data, false);
    }
});

function handleSendMessage() {
    const userText = userInput.value.trim();

    if (userText === "" || isTyping) {
        return;
    }

    addMessage(userText, true);
    userInput.value = "";

    isTyping = true;
    typingIndicator.style.display = "flex";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (ws.readyState === WebSocket.OPEN) {
        ws.send(userText);
    }
    else {
        isTyping = false;

        typingIndicator.style.display = "none";

        addMessage("The server is unavailable", false);
    }
}

function clearChatHistory() {
    if (isTyping) {
        istyping = false;
        typingIndicator.style.display = "none";
    }

    const welcomeMessage = chatMessages.querySelector(".bot-message");
    chatMessages.innerHTML = "";

    if (welcomeMessage) {
        chatMessages.appendChild(welcomeMessage);
    }
}

sendButton.addEventListener("click", handleSendMessage);

userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        handleSendMessage();
    }
})

clearChatButton.addEventListener("click", clearChatHistory)
