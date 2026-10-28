(function () {
    "use strict";

    const F = window.FitNutri;

    const form = document.getElementById("formPerfilNutricionista");
    const mensagem = document.getElementById("mensagem");

    F.observarCampos(form);
    F.apenasDigitos(form.elements.crnNumero);

    const atualizarContador = F.ligarContador(
        form.elements.apresentacao,
        document.getElementById("contador")
    );

    const atualizarOutra = F.ligarOutraEspecialidade(
        form.elements.especialidade,
        document.getElementById("blocoOutraEspecialidade"),
        form.elements.especialidadeOutra
    );

    // Se a pessoa voltar a esta tela, os dados já enviados reaparecem.
    const existente = F.carregarPerfil();
    if (existente && existente.tipo === "nutricionista") {
        F.preencherFormulario(form, existente);
        atualizarContador();
        atualizarOutra();
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
            tipo: "nutricionista",
            nome: dados.nome,
            crnRegiao: dados.crnRegiao,
            crnNumero: dados.crnNumero,
            especialidade: dados.especialidade,
            especialidadeOutra: dados.especialidade === "Outra" ? dados.especialidadeOutra || "" : "",
            apresentacao: dados.apresentacao
        };

        perfil.statusVerificacao = F.calcularStatus(existente, perfil);

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

        if (F.enviarAba(aba, F.PAGINAS.inicioNutricionista)) {
            F.mostrarMensagem(
                mensagem,
                "Perfil enviado para verificação. Abrimos sua página inicial em outra aba.",
                "sucesso"
            );
        } else {
            F.mostrarMensagem(mensagem, "Perfil enviado para verificação.", "sucesso");
        }

        F.anexarLink(mensagem, "Abrir minha página inicial", F.PAGINAS.inicioNutricionista);
    });
})();
