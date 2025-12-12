import { clearErrors, displaySuccess, handleTokenExpired, displayError, displayValidationErrors } from "./utils.js";

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

    try {
        const response = await fetch("/chat/message", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "session_id": session_id,
                "sender_type": isUser ? "user" : "bot",
                "text": text
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                handleTokenExpired();
            }
            if (isTyping) {
                isTyping = false;
                typingIndicator.style.display = "none";
            }
            return;
        }

        if (isTyping) {
            isTyping = false;
            typingIndicator.style.display = "none";

            if (isUser) {
                const json = await response.json();
                addMessage(json.answer);
            }
        }
    } catch (error) {
        console.error("Ошибка при отправке сообщения:", error);
        if (isTyping) {
            isTyping = false;
            typingIndicator.style.display = "none";
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

    try {
        const response = await fetch(`/chat/history/${session_id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                handleTokenExpired();
            }
            return;
        }

        addMessage(helloMessage, false);
        await sendMessage(helloMessage, false);
    } catch (error) {
        console.error("Ошибка при очистке истории:", error);
    }
}

async function createSession() {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch("/chat/session", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                handleTokenExpired();
            }
            return;
        }

        const data = await response.json();
        const session_id = data["id"];
        sessionStorage.setItem("session_id", session_id);
    } catch (error) {
        console.error("Ошибка при создании сессии:", error);
    }
}

async function loadSessionHistory(session_id) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`/chat/history/${session_id}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                handleTokenExpired();
            }
            return;
        }

        const messages = await response.json();
        Array.from(messages).forEach(message => {
            addMessage(message.text, message.sender_type == "user" ? true : false);
        });
    } catch (error) {
        console.error("Ошибка при загрузке истории:", error);
    }
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

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "username": username,
                "password": password
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                displayError("Неверный логин или пароль");
            } else if (response.status === 422) {
                const errorData = await response.json();
                displayValidationErrors(errorData.detail);
            }
            return;
        }

        const json = await response.json();
        localStorage.setItem("token", json.access_token);

        await createSession();

        document.getElementById("authOverlay").style.display = "none";

        addMessage(helloMessage, false);
        await sendMessage(helloMessage, false);
    } catch (error) {
        console.error("Ошибка при входе:", error);
        displayError("Ошибка подключения к серверу");
    }
});

document.getElementById("registerBtn").addEventListener("click", async function() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    clearErrors();

    try {
        const response = await fetch("/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "username": username,
                "password": password
            })
        });

        if (!response.ok) {
            if (response.status === 400) {
                displayError("Пользователь с таким логином уже существует");
            } else if (response.status === 422) {
                const errorData = await response.json();
                displayValidationErrors(errorData.detail);
            }
            return;
        }

        displaySuccess("Регистрация прошла успешно!");
    } catch (error) {
        console.error("Ошибка при регистрации:", error);
        displayError("Ошибка подключения к серверу");
    }
});
