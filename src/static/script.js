import { clearErrors, displaySuccess, handleTokenExpired, displayError, displayValidationErrors, showErrorPopup } from "./utils.js";

const userAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
const botAvatar = "https://cdn-icons-png.flaticon.com/512/4712/4712039.png";

const helloMessage = "Привет! Я бот технической поддержки солнца. Что тебя интересует?";

const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const typingIndicator = document.getElementById("typing-indicator");

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

        if (isTyping) {
            isTyping = false;
            typingIndicator.style.display = "none";
        }

        if (!response.ok) {
            if (response.status === 401) {
                handleTokenExpired();
            }
            else {
                const errorText = await response.text();
                showErrorPopup("Ошибка при отправке сообщения.");
                console.log(errorText);
            }

            return;
        }

        if (isUser) {
            const json = await response.json();
            addMessage(json.answer);
        }
    }
    catch (error) {
        console.error("Ошибка при отправке сообщения:", error);
        if (isTyping) {
            isTyping = false;
            typingIndicator.style.display = "none";
        }
        showErrorPopup("Ошибка при отправке сообщения.");
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
        //TODO: добавить отмену запроса отправленнного сообщения
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

        addMessage(helloMessage, false);
        await sendMessage(helloMessage, false);
    }
    catch (error) {
        console.error("Ошибка при очистке истории:", error);
        showErrorPopup("Ошибка при очистке истории.");
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
            else {
                const errorText = await response.text();
                console.log(errorText);
                showErrorPopup("Ошибка при создании сессии.");
            }
            return;
        }

        const data = await response.json();
        const session_id = data["id"];
        sessionStorage.setItem("session_id", session_id);
    } catch (error) {
        console.error("Ошибка при создании сессии:", error);
        showErrorPopup("Ошибка при создании сессии.");
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
            else {
                const errorText = await response.text();
                console.log(errorText);
                showErrorPopup("Ошибка при загрузке истории. Попробуйте еще раз.");
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
        showErrorPopup("Ошибка при загрузке истории.");
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
    document.getElementById("clear-chat").addEventListener("click", clearChatHistory)

    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleSendMessage();
        }
    })

    document.getElementById("authForm").addEventListener("submit", async function(e) {
        e.preventDefault();
        const form = document.getElementById("authForm");

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

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
                }
                else if (response.status === 422) {
                    const errorData = await response.json();
                    displayValidationErrors(errorData.detail);
                }
                else {
                    showErrorPopup("Ошибка при входе в систему.");
                }
                return;
            }

            const json = await response.json();
            localStorage.setItem("token", json.access_token);

            const session_id = sessionStorage.getItem("session_id");
            if (!session_id) {
                await createSession();

                addMessage(helloMessage, false);
                await sendMessage(helloMessage, false);
            }
            else {
                await loadSessionHistory(session_id);
            }

            document.getElementById("authOverlay").style.display = "none";
        }
        catch (error) {
            console.error("Ошибка при входе:", error);
            displayError("Ошибка подключения к серверу");
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

    setHelpPopupListeners();
}

document.addEventListener("DOMContentLoaded", async () => {
    setListeners();

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
