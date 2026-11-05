(function () {
    "use strict";

    const API_URL = "https://localhost:7046";
    const F = window.FitNutri;
    const form = document.getElementById("formTipo");
    const mensagem = document.getElementById("mensagem");
    const botao = form.querySelector('button[type="submit"]');

    const destinos = {
        usuario: F.PAGINAS.perfilUsuario,
        nutricionista: F.PAGINAS.perfilNutricionista
    };

    // Mantém marcada a escolha local apenas para conveniência visual.
    // A escolha válida e as permissões são controladas pela API.
    const tipoSalvo = F.obterTipo();
    if (tipoSalvo) {
        const opcao = form.querySelector(`input[name="tipo"][value="${tipoSalvo}"]`);
        if (opcao) {
            opcao.checked = true;
        }
    }

    F.observarCampos(form);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        F.mostrarMensagem(mensagem, "");

        if (!F.validarFormulario(form)) {
            return;
        }

        const tipo = form.elements.tipo.value;
        const destino = destinos[tipo];
        const token = sessionStorage.getItem("fitnutri.accessToken");

        if (!token) {
            F.mostrarMensagem(mensagem, "Sua sessão não foi encontrada. Entre novamente para continuar.", "erro");
            F.anexarLink(mensagem, "Ir para o login", F.PAGINAS.login);
            return;
        }

        // Abre a aba enquanto ainda há um clique do usuário, para reduzir bloqueios.
        const aba = F.abrirAbaVazia();
        botao.disabled = true;
        botao.textContent = "Salvando escolha...";

        try {
            const response = await fetch(`${API_URL}/api/auth/profile-type`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ profileType: tipo })
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                F.fecharAba(aba);

                const texto = response.status === 401
                    ? "Sua sessão expirou. Entre novamente para continuar."
                    : data?.message || "Não foi possível salvar o tipo de perfil.";

                F.mostrarMensagem(mensagem, texto, "erro");
                if (response.status === 401) {
                    F.anexarLink(mensagem, "Ir para o login", F.PAGINAS.login);
                }
                return;
            }

            // Mantém o tipo no navegador apenas para a navegação provisória das telas.
            // O valor oficial já foi salvo pela API autenticada.
            F.definirTipo(tipo);

            if (F.enviarAba(aba, destino)) {
                F.mostrarMensagem(mensagem, "Tipo salvo. Abrimos o próximo passo em outra aba.", "sucesso");
            } else {
                F.mostrarMensagem(mensagem, "Tipo salvo. O navegador bloqueou a nova aba.", "sucesso");
            }

            F.anexarLink(mensagem, "Ir para o próximo passo", destino);
        } catch (error) {
            console.error(error);
            F.fecharAba(aba);
            F.mostrarMensagem(
                mensagem,
                "Não foi possível conectar à API. Confirme se está em execução e se a URL está correta.",
                "erro"
            );
        } finally {
            botao.disabled = false;
            botao.textContent = "Continuar";
        }
    });
})();
