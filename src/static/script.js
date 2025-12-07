const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const clearChatButton = document.getElementById("clear-chat");

let isTyping = false;

const userAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
const botAvatar = "https://cdn-icons-png.flaticon.com/512/4712/4712039.png";

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzY1MTEyOTAxfQ.tFIipR5lu8Wi0Yx5rDuuUCU9DnRnZIytcf07uOWKtcg";

const helloMessage = "Привет! Я простой бот. Спроси меня о чём-нибудь.";

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

function sendMessage(userText, isUser) {
    fetch("/chat/message", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "session_id": sessionStorage.getItem("session_id"),
            "sender_type": isUser ? "user" : "bot",
            "text": userText
        })
    })
    .then(data => data.json())
    .then(botAnswer => {
        isTyping = false;
        typingIndicator.style.display = "none";
        addMessage(botAnswer);
    });
}

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

function createSession(token) {
    fetch("/chat/session", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("authOverlay").style.display = "flex";
    addMessage(helloMessage, false);
    // const session_id = sessionStorage.getItem("session_id");
    // if (!session_id) {

    // }
});

// Обработка формы авторизации
document.getElementById("authForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Здесь будет логика входа
    console.log("Вход с данными:", { username, password });

    // Скрываем попап после входа (для демо)
    document.getElementById("authOverlay").style.display = "none";
});

// Обработка кнопки регистрации
document.getElementById("registerBtn").addEventListener("click", function() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Здесь будет логика регистрации
    console.log("Регистрация с данными:", { username, password });

    // Скрываем попап после регистрации (для демо)
    document.getElementById("authOverlay").style.display = "none";
});

// Для демонстрации - открываем попап при загрузке
document.addEventListener("DOMContentLoaded", function() {
});
