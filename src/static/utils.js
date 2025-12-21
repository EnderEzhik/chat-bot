export function handleTokenExpired() {
    localStorage.removeItem("token");

    const chatMessages = document.getElementById("chat-messages");
    if (chatMessages) {
        chatMessages.innerHTML = "";
    }

    showErrorPopup("Сессия истекла. Пожалуйста, войдите снова.");
    showAuthForm();
}

export function NoAccessToSession() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("session_id");

    showErrorPopup("Нет доступа к сессии другого пользователя. Сессия была сброшена.");
    showAuthForm();
}

export function showAuthForm() {
    const authOverlay = document.getElementById("authOverlay");
    if (authOverlay) {
        authOverlay.style.display = "flex";
    }
}

export function showErrorPopup(message) {
    const overlay = document.getElementById("errorPopupOverlay");
    const messageElement = document.getElementById("errorPopupMessage");
    const button = document.getElementById("errorPopupButton");

    if (!overlay || !messageElement || !button) {
        const errorContainer = document.createElement("div");
        errorContainer.className = "global-error";
        errorContainer.textContent = message;
        const form = document.getElementById("authForm");
        if (form) {
            form.parentNode.insertBefore(errorContainer, form);
        }
        return;
    }

    messageElement.textContent = message;

    overlay.classList.add("show");

    const closePopup = () => {
        overlay.classList.remove("show");
        setTimeout(() => {
            messageElement.textContent = "";
        }, 300);
    };

    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener("click", closePopup);

    const overlayClickHandler = (e) => {
        if (e.target === overlay) {
            closePopup();
            overlay.removeEventListener("click", overlayClickHandler);
        }
    };
    overlay.addEventListener("click", overlayClickHandler);
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
