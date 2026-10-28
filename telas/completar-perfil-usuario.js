(function () {
    "use strict";

    const F = window.FitNutri;

    const form = document.getElementById("formPerfilUsuario");
    const mensagem = document.getElementById("mensagem");

    form.elements.nascimento.max = F.hojeISO();
    F.observarCampos(form);

    // Se a pessoa voltar a esta tela, os dados já salvos reaparecem.
    const existente = F.carregarPerfil();
    if (existente && existente.tipo === "usuario") {
        F.preencherFormulario(form, existente);
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
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

        const aba = F.abrirAbaVazia();

        if (!F.salvarPerfil(perfil)) {
            F.fecharAba(aba);
            F.mostrarMensagem(
                mensagem,
                "Não foi possível salvar o perfil neste navegador. Libere o armazenamento do site e tente de novo.",
                "erro"
            );
            return;
        }

        if (F.enviarAba(aba, F.PAGINAS.inicioUsuario)) {
            F.mostrarMensagem(mensagem, "Perfil salvo. Abrimos sua página inicial em outra aba.", "sucesso");
        } else {
            F.mostrarMensagem(mensagem, "Perfil salvo.", "sucesso");
        }

        F.anexarLink(mensagem, "Abrir minha página inicial", F.PAGINAS.inicioUsuario);
    });
})();
