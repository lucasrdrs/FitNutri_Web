const API_URL = "https://localhost:7046";
const SUCCESS_URL = new URL("./onboarding.html", window.location.href).href;

const form = document.querySelector("#registerForm");
const userNameInput = document.querySelector("#registerUserName");
const emailInput = document.querySelector("#registerEmail");
const phoneNumberInput = document.querySelector("#registerPhoneNumber");
const passwordInput = document.querySelector("#registerPassword");
const confirmPasswordInput = document.querySelector("#confirmPassword");
const message = document.querySelector("#registerMessage");
const submitButton = form.querySelector('button[type="submit"]');

function showMessage(text, type) {
    message.textContent = text;
    message.classList.remove("success", "error");
    message.classList.add(type);
}

function showSuccessMessage(text) {
    message.replaceChildren();
    message.append(document.createTextNode(`${text} `));

    const link = document.createElement("a");
    link.href = SUCCESS_URL;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Abrir o FitNutri";
    message.append(link);

    message.classList.remove("error");
    message.classList.add("success");
}

function getApiError(data) {
    const errors = data?.errors;

    if (Array.isArray(errors)) {
        return errors.join(" ");
    }

    if (errors && typeof errors === "object") {
        return Object.values(errors)
            .flat()
            .filter((error) => typeof error === "string")
            .join(" ");
    }

    return data?.message || data?.title || null;
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    message.classList.remove("success", "error");

    const userName = userNameInput.value.trim();
    const email = emailInput.value.trim();
    const phoneNumber = phoneNumberInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (userName.length < 3) {
        showMessage("O nome de usuário precisa ter pelo menos 3 caracteres.", "error");
        userNameInput.focus();
        return;
    }

    if (password !== confirmPassword) {
        showMessage("As senhas não coincidem.", "error");
        confirmPasswordInput.focus();
        return;
    }

    // Abre a aba durante o clique do usuário para reduzir a chance de bloqueio.
    const destinationTab = window.open("about:blank", "_blank");

    submitButton.disabled = true;
    submitButton.textContent = "Criando conta...";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userName,
                email,
                password,
                phoneNumber: phoneNumber || null
            }),
            signal: controller.signal
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            if (destinationTab && !destinationTab.closed) {
                destinationTab.close();
            }

            showMessage(
                getApiError(data) || "Não foi possível criar a conta. Confira os dados e tente novamente.",
                "error"
            );
            return;
        }

        form.reset();

        if (destinationTab && !destinationTab.closed) {
            destinationTab.location.replace(SUCCESS_URL);
            destinationTab.opener = null;
            showMessage(data?.message || "Conta criada com sucesso. Abrimos o FitNutri em outra aba.", "success");
        } else {
            showSuccessMessage(data?.message || "Conta criada com sucesso.");
        }
    } catch (error) {
        if (destinationTab && !destinationTab.closed) {
            destinationTab.close();
        }

        console.error(error);

        if (error.name === "AbortError") {
            showMessage("A API demorou para responder. Confira se ela está em execução.", "error");
        } else {
            showMessage("Não foi possível conectar à API. Confira a URL, o HTTPS, o CORS e se a API está em execução.", "error");
        }
    } finally {
        clearTimeout(timeoutId);
        submitButton.disabled = false;
        submitButton.textContent = "Criar conta";
    }
});
