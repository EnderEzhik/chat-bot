const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const clearChatButton = document.getElementById("clear-chat");

let isTyping = false;

const userAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
const botAvatar = "https://cdn-icons-png.flaticon.com/512/4712/4712039.png";

const helloMessage = "Привет! Я простой бот. Спроси меня о чём-нибудь."; //TODO: заменить на тех поодержку солнца

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

function sendMessage(text, isUser) {
    const token = localStorage.getItem("token");
    const session_id = sessionStorage.getItem("session_id");

    fetch("/chat/message", {
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
    })
    .then(data => data.json())
    .then(botAnswer => {
        isTyping = false;
        typingIndicator.style.display = "none";
        if (isUser) {
            addMessage(botAnswer);
        }
    });
}

function handleSendMessage() {
    const userText = userInput.value.trim();

    if (userText === "" || isTyping) {
        return;
    }

    addMessage(userText, true);
    sendMessage(userText, true);
    userInput.value = "";

    isTyping = true;
    typingIndicator.style.display = "flex";
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function clearChatHistory() {
    if (isTyping) {
        isTyping = false;
        typingIndicator.style.display = "none";
    }

    chatMessages.innerHTML = "";

    const token = localStorage.getItem("token");
    const session_id = sessionStorage.getItem("session_id");
    fetch(`/chat/history/${session_id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    addMessage(helloMessage, false);
    sendMessage(helloMessage, false);
}

sendButton.addEventListener("click", handleSendMessage);

userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        handleSendMessage();
    }
})

clearChatButton.addEventListener("click", clearChatHistory)

async function createSession() {
    const token = localStorage.getItem("token");
    const response = await fetch("/chat/session", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    const json = await response.json();
    const session_id = json["id"];
    sessionStorage.setItem("session_id", session_id)
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
        sendMessage(helloMessage, false);
    }
    else {
        await loadSessionHistory(session_id);
    }
});

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
            const errorData = await response.json();

            if (response.status === 422) {
                displayValidationErrors(errorData.detail);
                return;
            } else if (response.status === 401) {
                displayError("Неправильный логин или пароль");
                return;
            } else {
                displayError(`Ошибка сервера: ${response.status}`);
                return;
            }
        }

        const json = await response.json();
        localStorage.setItem("token", json.access_token);

        await createSession();

        document.getElementById("authOverlay").style.display = "none";

        addMessage(helloMessage, false);
        sendMessage(helloMessage, false);
    }
    catch (error) {
        console.error("Ошибка:", error);
        displayError("Произошла ошибка при подключении к серверу");
    }
});

// Функция для отображения ошибок валидации
function displayValidationErrors(errors) {
    errors.forEach(error => {
        const fieldName = error.loc[error.loc.length - 1]; // Получаем имя поля
        const errorMessage = getErrorMessage(error.msg, fieldName);

        // Находим соответствующее поле ввода
        const inputField = document.getElementById(fieldName);
        if (inputField) {
            // Добавляем CSS класс для подсветки ошибки
            inputField.classList.add("error");

            // Создаем элемент с сообщением об ошибке
            const errorElement = document.createElement("div");
            errorElement.className = "error-message";
            errorElement.textContent = errorMessage;
            errorElement.style.color = "#dc3545";
            errorElement.style.fontSize = "0.85rem";
            errorElement.style.marginTop = "5px";

            // Вставляем после поля ввода
            inputField.parentNode.appendChild(errorElement);
        } else {
            // Если не нашли конкретное поле, показываем общую ошибку
            displayError(errorMessage);
        }
    });
}

// Функция для преобразования сообщений об ошибках в понятный текст
function getErrorMessage(msg, fieldName) {
    const fieldNames = {
        "username": "логин",
        "password": "пароль"
    };

    const fieldDisplayName = fieldNames[fieldName] || fieldName;

    if (msg.includes("min_length")) {
        if (fieldName === "username") {
            return `Логин должен содержать минимум 4 символа`;
        } else if (fieldName === "password") {
            return `Пароль должен содержать минимум 6 символов`;
        }
    }

    if (msg.includes("max_length")) {
        if (fieldName === "username") {
            return `Логин должен содержать не более 20 символов`;
        } else if (fieldName === "password") {
            return `Пароль должен содержать не более 32 символов`;
        }
    }

    if (msg.includes("string")) {
        return `Поле "${fieldDisplayName}" должно быть строкой`;
    }

    return `Ошибка в поле "${fieldDisplayName}": ${msg}`;
}

// Функция для отображения общей ошибки
function displayError(message) {
    // Можно добавить блок для общих ошибок
    const errorContainer = document.createElement("div");
    errorContainer.className = "global-error";
    errorContainer.textContent = message;
    errorContainer.style.color = "#dc3545";
    errorContainer.style.backgroundColor = "#f8d7da";
    errorContainer.style.border = "1px solid #f5c6cb";
    errorContainer.style.borderRadius = "4px";
    errorContainer.style.padding = "10px";
    errorContainer.style.margin = "10px 0";
    errorContainer.style.textAlign = "center";

    // Вставляем перед формой
    const form = document.getElementById("authForm");
    form.parentNode.insertBefore(errorContainer, form);
}

// Функция для очистки всех ошибок
function clearErrors() {
    // Удаляем все сообщения об ошибках
    document.querySelectorAll(".error-message, .global-error").forEach(el => el.remove());

    // Убираем класс ошибки с полей ввода
    document.querySelectorAll(".error").forEach(el => el.classList.remove("error"));
}

// Обработка кнопки регистрации (аналогично с другим эндпоинтом)
document.getElementById("registerBtn").addEventListener("click", async function() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Сброс предыдущих ошибок
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
            const errorData = await response.json();

            if (response.status === 422) {
                // Ошибки валидации Pydantic
                displayValidationErrors(errorData.detail);
                return;
            } else if (response.status === 400) {
                // Пользователь уже существует (пример)
                displayError("Пользователь с таким логином уже существует");
                return;
            } else {
                displayError(`Ошибка сервера: ${response.status}`);
                return;
            }
        }

        const json = await response.json();
        // Возможно сохранить токен или показать сообщение об успехе
        displaySuccess("Регистрация успешна! Теперь вы можете войти.");

    } catch (error) {
        console.error("Ошибка:", error);
        displayError("Произошла ошибка при подключении к серверу");
    }
});

// Функция для отображения успешного сообщения
function displaySuccess(message) {
    const successContainer = document.createElement("div");
    successContainer.className = "global-success";
    successContainer.textContent = message;
    successContainer.style.color = "#155724";
    successContainer.style.backgroundColor = "#d4edda";
    successContainer.style.border = "1px solid #c3e6cb";
    successContainer.style.borderRadius = "4px";
    successContainer.style.padding = "10px";
    successContainer.style.margin = "10px 0";
    successContainer.style.textAlign = "center";

    const form = document.getElementById("authForm");
    form.parentNode.insertBefore(successContainer, form);

    setTimeout(() => {
        successContainer.remove();
    }, 3000);
}
