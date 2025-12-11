import { sendRequest, clearErrors, displaySuccess } from "./utils.js";

const userAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
const botAvatar = "https://cdn-icons-png.flaticon.com/512/4712/4712039.png";

const helloMessage = "Привет! Я бот технической поддержки солнца. Что тебя интересует?";

const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const clearChatButton = document.getElementById("clear-chat");

let isTyping = false;

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

async function sendMessage(text, isUser) {
    const token = localStorage.getItem("token");
    const session_id = sessionStorage.getItem("session_id");

    const requestPath = "/chat/message";
    const requestMethod = "POST";
    const requestHeaders = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
    };
    const requestBody = {
            "session_id": session_id,
            "sender_type": isUser ? "user" : "bot",
            "text": text
    };

    const response = await sendRequest(requestPath, requestMethod, requestHeaders, requestBody);

    if (isTyping) {
        isTyping = false;
        typingIndicator.style.display = "none";

        if (isUser) {
            const json = await response.json();
            addMessage(json.answer)
        }
    }
}

async function handleSendMessage() {
    const userText = userInput.value.trim();

    if (userText === "" || isTyping) {
        return;
    }

    userInput.value = "";
    isTyping = true;
    typingIndicator.style.display = "flex";

    addMessage(userText, true);
    await sendMessage(userText, true);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function clearChatHistory() {
    if (isTyping) {
        isTyping = false;
        typingIndicator.style.display = "none";
    }

    chatMessages.innerHTML = "";

    const token = localStorage.getItem("token");
    const session_id = sessionStorage.getItem("session_id");

    const requestPath = `/chat/history/${session_id}`;
    const requestMethod = "DELETE";
    const requestHeaders = {
            "Authorization": `Bearer ${token}`
    };

    await sendRequest(requestPath, requestMethod, requestHeaders);

    addMessage(helloMessage, false);
    await sendMessage(helloMessage, false);
}

async function createSession() {
    const token = localStorage.getItem("token");

    const requestPath = "/chat/session";
    const requestMethod = "POST";
    const requestHeaders = {
        "Authorization": `Bearer ${token}`
    };

    const response = await sendRequest(requestPath, requestMethod, requestHeaders);

    const data = await response.json();
    const session_id = data["id"];
    sessionStorage.setItem("session_id", session_id);
}

async function loadSessionHistory(session_id) {
    const token = localStorage.getItem("token");
    const response = await fetch(`/chat/history/${session_id}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    const messages = await response.json();
    Array.from(messages).forEach(message => {
        addMessage(message.text, message.sender_type == "user" ? true : false);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        document.getElementById("authOverlay").style.display = "flex";
        return;
    }

    const session_id = sessionStorage.getItem("session_id");
    if (!session_id) {
        await createSession();
        addMessage(helloMessage, false);
        await sendMessage(helloMessage, false);
    }
    else {
        await loadSessionHistory(session_id);
    }
});

sendButton.addEventListener("click", handleSendMessage);

userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        handleSendMessage();
    }
})

clearChatButton.addEventListener("click", clearChatHistory)

document.getElementById("authForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    clearErrors();

    const requestPath = "/auth/login";
    const requestMethod = "POST";
    const requestHeaders = {
        "Content-Type": "application/json"
    };
    const requestBody = {
        "username": username,
        "password": password
    };

    const response = await sendRequest(requestPath, requestMethod, requestHeaders, requestBody);

    if (!response) return;

    const json = await response.json();
    localStorage.setItem("token", json.access_token);

    await createSession();

    document.getElementById("authOverlay").style.display = "none";

    addMessage(helloMessage, false);
    await sendMessage(helloMessage, false);
});

document.getElementById("registerBtn").addEventListener("click", async function() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    clearErrors();

    const requestPath = "/auth/register";
    const requestMethod = "POST";
    const requestHeaders = {
        "Content-Type": "application/json"
    };
    const requestBody = {
        "username": username,
        "password": password
    };

    const response = await sendRequest(requestPath, requestMethod, requestHeaders, requestBody);

    if (!response) return;

    displaySuccess("Регистрация прошла успешна!");
});
