import { displaySuccess, handleTokenExpired, showErrorPopup, NoAccessToSession, showAuthForm } from "./utils.js";

const userAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
const botAvatar = "https://cdn-icons-png.flaticon.com/512/4712/4712039.png";

const helloMessage = "Привет! Я бот технической поддержки солнца. Что тебя интересует?";

const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const typingIndicator = document.getElementById("typing-indicator");

let isTyping = false;
let abortController = null;

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

    return messageDiv;
}

function removeMessage(message) {
    chatMessages.removeChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage(text, isUser) {
    const token = localStorage.getItem("token");
    const session_id = sessionStorage.getItem("session_id");

    abortController = new AbortController();
    const signal = abortController.signal;

    const sendedMessage = addMessage(text, isUser);

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
            }),
            signal: signal
        });

        if (isTyping) {
            isTyping = false;
            typingIndicator.style.display = "none";
        }

        if (!response.ok) {
            removeMessage(sendedMessage);

            if (response.status === 401) {
                handleTokenExpired();
            }
            else {
                const errorText = await response.text();
                console.log(errorText);
                showErrorPopup("Ошибка при отправке сообщения.");
            }
            return;
        }

        if (isUser) {
            const json = await response.json();
            addMessage(json.answer, false);
        }
    }
    catch (error) {
        removeMessage(sendedMessage);
        if (isTyping) {
            isTyping = false;
            typingIndicator.style.display = "none";
        }
        if (error.name === "AbortError") {
            return;
        }

        console.error("Ошибка при отправке сообщения:", error);
        showErrorPopup("Ошибка подключения к серверу.");
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

    await sendMessage(userText, true);
}

async function clearChatHistory() {
    if (abortController) {
        abortController.abort();
    }
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
            else {
                showErrorPopup("Ошибка при очистке истории.");
            }
            return;
        }

        await sendMessage(helloMessage, false);
    }
    catch (error) {
        console.error("Ошибка при очистке истории:", error);
        showErrorPopup("Ошибка подключения к серверу.");
    }
}

async function createSession(token) {
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
            else {
                const errorText = await response.text();
                console.log(errorText);
                showErrorPopup("Ошибка при создании сессии.");
            }
            return;
        }

        const json = await response.json();
        const session_id = json["id"];
        sessionStorage.setItem("session_id", session_id);
    }
    catch (error) {
        console.error("Ошибка при создании сессии:", error);
        showErrorPopup("Ошибка подключения к серверу.");
    }
}

async function loadSessionHistory(session_id) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`/chat/history/${session_id}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                handleTokenExpired();
            }
            else if (response.status === 403) {
                NoAccessToSession();
            }
            else {
                const errorText = await response.text();
                console.log(errorText);
                showErrorPopup("Ошибка при загрузке истории.");
            }
            return;
        }

        const messages = await response.json();
        messages.forEach(message => {
            addMessage(message.text, message.sender_type === "user");
        });
    }
    catch (error) {
        console.error("Ошибка при загрузке истории:", error);
        showErrorPopup("Ошибка подключения к серверу.");
    }
}

function setHelpPopupListeners() {
    const helpIcon = document.getElementById("helpIcon");
    const helpPopup = document.getElementById("helpPopup");
    const popupClose = document.querySelector(".popup-close");

    helpIcon.addEventListener("mouseenter", () => {
        helpPopup.classList.add("show");
    });

    helpIcon.addEventListener("mouseleave", (e) => {
        if (!helpPopup.contains(e.relatedTarget)) {
            setTimeout(() => {
                if (!helpPopup.matches(":hover")) {
                    helpPopup.classList.remove("show");
                }
            }, 100);
        }
    });

    helpPopup.addEventListener("mouseleave", (e) => {
        if (!helpIcon.contains(e.relatedTarget)) {
            helpPopup.classList.remove("show");
        }
    });

    popupClose.addEventListener("click", () => {
        helpPopup.classList.remove("show");
    });

    document.addEventListener("click", (e) => {
        if (!helpIcon.contains(e.target) && !helpPopup.contains(e.target)) {
            helpPopup.classList.remove("show");
        }
    });

    helpIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle("show");
    });
}

function setListeners() {
    document.getElementById("send-button").addEventListener("click", handleSendMessage);
    document.getElementById("clear-chat").addEventListener("click", clearChatHistory);

    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleSendMessage();
        }
    });

    document.getElementById("authForm").addEventListener("submit", async function(e) {
        e.preventDefault();
        const form = document.getElementById("authForm");

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

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
                    showErrorPopup("Неверный логин или пароль");
                }
                else {
                    showErrorPopup("Ошибка при входе в систему.");
                }
                return;
            }

            document.getElementById("authOverlay").style.display = "none";

            const json = await response.json();
            const token = json.access_token;
            localStorage.setItem("token", token);

            const session_id = sessionStorage.getItem("session_id");
            if (!session_id) {
                await createSession(token);
                await sendMessage(helloMessage, false);
            }
            else {
                await loadSessionHistory(session_id);
            }
        }
        catch (error) {
            console.error("Ошибка при входе:", error);
            showErrorPopup("Ошибка подключения к серверу");
        }
    });

    document.getElementById("registerBtn").addEventListener("click", async function() {
        const form = document.getElementById("authForm");

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

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
                    showErrorPopup("Пользователь с таким логином уже существует");
                }
                else {
                    showErrorPopup("Ошибка при регистрации.");
                }
                return;
            }

            displaySuccess("Регистрация прошла успешно!");
        } catch (error) {
            console.error("Ошибка при регистрации:", error);
            showErrorPopup("Ошибка подключения к серверу");
        }
    });

    setHelpPopupListeners();
}

document.addEventListener("DOMContentLoaded", async () => {
    setListeners();

    const token = localStorage.getItem("token");
    if (!token) {
        showAuthForm();
        return;
    }

    const session_id = sessionStorage.getItem("session_id");
    if (!session_id) {
        await createSession(token);
        await sendMessage(helloMessage, false);
    }
    else {
        await loadSessionHistory(session_id);
    }
});
