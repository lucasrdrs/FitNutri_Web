(function () {
    "use strict";

    const F = window.FitNutri;

    const form = document.getElementById("formTipo");
    const mensagem = document.getElementById("mensagem");

    const destinos = {
        usuario: F.PAGINAS.perfilUsuario,
        nutricionista: F.PAGINAS.perfilNutricionista
    };

    // Se a pessoa já escolheu antes, mantém a escolha marcada.
    const tipoSalvo = F.obterTipo();
    if (tipoSalvo) {
        const opcao = form.querySelector(`input[name="tipo"][value="${tipoSalvo}"]`);
        if (opcao) {
            opcao.checked = true;
        }
    }

    F.observarCampos(form);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        F.mostrarMensagem(mensagem, "");

        if (!F.validarFormulario(form)) {
            return;
        }

        const tipo = form.elements.tipo.value;
        const destino = destinos[tipo];

        const aba = F.abrirAbaVazia();
        F.definirTipo(tipo);

        if (F.enviarAba(aba, destino)) {
            F.mostrarMensagem(mensagem, "Abrimos a próxima etapa em outra aba.", "sucesso");
        } else {
            F.mostrarMensagem(mensagem, "Seu navegador bloqueou a nova aba.");
        }

        F.anexarLink(mensagem, "Ir para a próxima etapa", destino);
    });
})();
