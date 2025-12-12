export function handleTokenExpired() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("session_id");

    displayError("Сессия истекла. Пожалуйста, войдите снова.");

    const authOverlay = document.getElementById("authOverlay");
    if (authOverlay) {
        authOverlay.style.display = "flex";
    }

    const chatMessages = document.getElementById("chat-messages");
    if (chatMessages) {
        chatMessages.innerHTML = "";
    }
}

export function displayError(message) {
    const errorContainer = document.createElement("div");
    errorContainer.className = "global-error";
    errorContainer.textContent = message;

    const form = document.getElementById("authForm");
    form.parentNode.insertBefore(errorContainer, form);
}

export function displayValidationErrors(errors) {
    errors.forEach(error => {
        const fieldName = error.loc[error.loc.length - 1];
        const errorMessage = getErrorMessage(error.type, error.msg, fieldName);

        const inputField = document.getElementById(fieldName);
        if (inputField) {
            inputField.classList.add("error");

            const errorElement = document.createElement("div");
            errorElement.className = "error-message";
            errorElement.textContent = errorMessage;

            inputField.parentNode.appendChild(errorElement);
        } else {
            displayError(errorMessage);
        }
    });
}

function getErrorMessage(type, msg, fieldName) {
    const fieldNames = {
        "username": "логин",
        "password": "пароль"
    };

    const fieldDisplayName = fieldNames[fieldName] || fieldName;

    if (type === "string_too_short") {
        if (fieldName === "username") {
            return "Логин должен содержать минимум 4 символа";
        }
        else if (fieldName === "password") {
            return "Пароль должен содержать минимум 6 символов";
        }
    }
    else if (type === "string_too_long") {
        if (fieldName === "username") {
            return "Логин должен содержать не более 20 символов";
        }
        else if (fieldName === "password") {
            return "Пароль должен содержать не более 32 символов";
        }
    }

    return `Ошибка в поле "${fieldDisplayName}": ${msg}`;
}

export function clearErrors() {
    document.querySelectorAll(".error-message, .global-error").forEach(el => el.remove());
    document.querySelectorAll(".error").forEach(el => el.classList.remove("error"));
}

export function displaySuccess(message) {
    const successContainer = document.createElement("div");
    successContainer.className = "global-success";
    successContainer.textContent = message;

    const form = document.getElementById("authForm");
    form.parentNode.insertBefore(successContainer, form);

    setTimeout(() => {
        successContainer.remove();
    }, 3000);
}
