(function () {
    "use strict";

    const F = window.FitNutri;
    const form = document.getElementById("formPerfilUsuario");
    const mensagem = document.getElementById("mensagem");
    const botao = form.querySelector('button[type="submit"]');

    form.elements.nascimento.max = F.hojeISO();
    F.observarCampos(form);

    function mostrarErro(erro) {
        F.mostrarMensagem(
            mensagem,
            erro.message || "Não foi possível carregar ou salvar o perfil.",
            "erro"
        );

        if (erro.status === 401) {
            F.anexarLink(mensagem, "Ir para o login", F.PAGINAS.login);
        }
    }

    // Carrega o perfil já salvo para permitir que a pessoa continue a edição.
    F.obterPerfilDaApi()
        .then((perfil) => {
            if (perfil?.tipo === "usuario") {
                F.preencherFormulario(form, perfil);
            } else if (perfil?.tipo === "nutricionista") {
                F.mostrarMensagem(
                    mensagem,
                    "Esta conta é de nutricionista. Abra o formulário de perfil de nutricionista.",
                    "erro"
                );
            }
        })
        .catch((erro) => {
            // 404 significa apenas que este usuário ainda não criou o perfil.
            if (erro.status !== 404) {
                mostrarErro(erro);
            }
        });

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        F.mostrarMensagem(mensagem, "");

        if (!F.validarFormulario(form)) {
            F.mostrarMensagem(mensagem, "Revise os campos destacados.", "erro");
            return;
        }

        const dados = F.lerFormulario(form);
        const perfil = {
            tipo: "usuario",
            nome: dados.nome,
            nascimento: dados.nascimento,
            objetivo: dados.objetivo,
            rotina: dados.rotina,
            restricoes: dados.restricoes || [],
            outrasRestricoes: dados.outrasRestricoes || ""
        };

        // Abre a aba durante o clique, antes da chamada assíncrona à API.
        const aba = F.abrirAbaVazia();
        botao.disabled = true;
        botao.textContent = "Salvando...";

        try {
            await F.salvarPerfilUsuarioNaApi(perfil);

            const abriu = F.enviarAba(aba, F.PAGINAS.inicioUsuario);
            if (!abriu) {
                F.fecharAba(aba);
            }

            F.mostrarMensagem(
                mensagem,
                abriu
                    ? "Perfil salvo no banco. Abrimos sua página inicial em outra aba."
                    : "Perfil salvo no banco.",
                "sucesso"
            );
            F.anexarLink(mensagem, "Abrir minha página inicial", F.PAGINAS.inicioUsuario);
        } catch (erro) {
            F.fecharAba(aba);
            mostrarErro(erro);
        } finally {
            botao.disabled = false;
            botao.textContent = "Salvar perfil";
        }
    });
})();
