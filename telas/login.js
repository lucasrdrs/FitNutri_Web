const API_URL = "https://localhost:7046";

const form = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const rememberMe = document.querySelector("#rememberMe");
const message = document.querySelector("#loginMessage");
const submitButton = form.querySelector('button[type="submit"]');

const savedEmail = localStorage.getItem("fitnutri.email");
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
        const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const loginData = await loginResponse.json().catch(() => null);

        if (!loginResponse.ok) {
            message.textContent = loginData?.message || "Não foi possível entrar. Confira seus dados.";
            return;
        }

        if (!loginData?.accessToken) {
            message.textContent = "A API não retornou o token de acesso.";
            return;
        }

        if (rememberMe.checked) {
            localStorage.setItem("fitnutri.email", email);
        } else {
            localStorage.removeItem("fitnutri.email");
        }

        // O token fica só nesta aba; não o guarde em localStorage.
        sessionStorage.setItem("fitnutri.accessToken", loginData.accessToken);
        sessionStorage.setItem("fitnutri.expiresAtUtc", loginData.expiresAtUtc || "");

        const profileResponse = await fetch(`${API_URL}/api/auth/profile-type`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${loginData.accessToken}`
            }
        });

        const profileData = await profileResponse.json().catch(() => null);

        if (!profileResponse.ok) {
            message.textContent = profileResponse.status === 404
                ? "O login foi feito, mas a API ainda não tem a rota para consultar seu perfil."
                : "O login foi feito, mas não foi possível consultar seu perfil. Tente novamente.";
            return;
        }

        const profileType = String(profileData?.profileType || "").toLowerCase();
        let destination;

        if (!profileType) {
            // Conta nova ou ainda sem tipo: só então mostra a escolha.
            destination = "./onboarding.html";
        } else if (profileType === "usuario") {
            destination = "./inicio-usuario.html";
        } else if (profileType === "nutricionista") {
            destination = "./inicio-nutricionista.html";
        } else {
            message.textContent = "A API retornou um tipo de perfil desconhecido.";
            return;
        }

        // Mantém a mesma aba para o JWT continuar acessível em sessionStorage.
        window.location.replace(destination);
    } catch (error) {
        console.error(error);
        message.textContent = "Não foi possível conectar à API. Confira se ela está em execução e se a URL está correta.";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Entrar";
    }
});
