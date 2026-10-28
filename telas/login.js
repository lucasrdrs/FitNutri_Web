const API_URL = "https://localhost:7046";

const form = document.querySelector("#loginForm" );
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const rememberMe = document.querySelector("#rememberMe");
const message = document.querySelector("#loginMessage");
const submitButton = form.querySelector('button[type="submit"]');

// O e-mail fica apenas nesta aba, não entre sessões do navegador.
const savedEmail = sessionStorage.getItem("fitnutri.email");

if (savedEmail) {
    emailInput.value = savedEmail;
    rememberMe.checked = true;
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "";
    submitButton.disabled = true;
    submitButton.textContent = "Verificando...";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            message.textContent =
                data?.message ?? "Não foi possível entrar. Confira seus dados.";
            return;
        }

        if (!data?.accessToken) {
            message.textContent = "A API não retornou o token de acesso.";
            return;
        }

        if (rememberMe.checked) {
            sessionStorage.setItem("fitnutri.email", email);
        } else {
            sessionStorage.removeItem("fitnutri.email");
        }

        sessionStorage.setItem("fitnutri.accessToken", data.accessToken);
        sessionStorage.setItem("fitnutri.expiresAtUtc", data.expiresAtUtc);

        // Mantém a mesma aba para preservar o JWT no sessionStorage.
        // Até existir GET /api/perfil/me, o fluxo inicia pela escolha de perfil.
        window.location.replace("./onboarding.html");
    } catch (error) {
        console.error(error);
        message.textContent =
            "Não foi possível conectar à API. Confira se ela está em execução e se a URL está correta.";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Entrar";
    }
});
