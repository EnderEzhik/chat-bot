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

    messageElement.textContent = message;
    overlay.classList.add("show");
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
