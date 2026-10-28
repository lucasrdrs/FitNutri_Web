(function () {
    "use strict";

    const F = window.FitNutri;
    const el = (id) => document.getElementById(id);

    const estadoVazio = el("estadoVazio");
    const conteudo = el("conteudoPerfil");
    const visualizacao = el("visualizacao");
    const botaoEditar = el("botaoEditar");
    const mensagemPagina = el("mensagemPagina");
    const listaDados = el("listaDados");
    const seloStatus = el("seloStatus");
    const avisoVerificacao = el("avisoVerificacao");

    const formularios = {
        usuario: el("formUsuario"),
        nutricionista: el("formNutricionista")
    };

    let perfil = F.carregarPerfil();

    if (!perfil || !formularios[perfil.tipo]) {
        estadoVazio.hidden = false;
        return;
    }

    el("linkInicio").href = F.paginaInicial(perfil.tipo);
    conteudo.hidden = false;

    const form = formularios[perfil.tipo];
    const mensagemForm = form.querySelector(".mensagem");
    let atualizadores = [];

    F.observarCampos(form);

    if (perfil.tipo === "nutricionista") {
        F.apenasDigitos(form.elements.crnNumero);

        atualizadores = [
            F.ligarContador(form.elements.apresentacao, el("n-contador")),
            F.ligarOutraEspecialidade(form.elements.especialidade, el("n-blocoOutra"), form.elements.especialidadeOutra)
        ];
    } else {
        form.elements.nascimento.max = F.hojeISO();
    }

    /* ---------- Visualização ---------- */

    function criarLinha(rotulo, valor, longo) {
        const bloco = document.createElement("div");

        const dt = document.createElement("dt");
        dt.textContent = rotulo;

        const dd = document.createElement("dd");
        dd.textContent = valor || "Não informado";
        if (longo) {
            dd.className = "dados__texto";
        }

        bloco.append(dt, dd);
        return bloco;
    }

    function linhasDoPerfil() {
        if (perfil.tipo === "nutricionista") {
            const especialidade = perfil.especialidade === "Outra" ? perfil.especialidadeOutra : perfil.especialidade;

            return [
                ["Nome completo", perfil.nome],
                ["Registro profissional", F.formatarCrn(perfil)],
                ["Especialidade", especialidade],
                ["Apresentação", perfil.apresentacao, true]
            ];
        }

        const restricoes = [...(perfil.restricoes || []), perfil.outrasRestricoes].filter(Boolean);

        return [
            ["Nome completo", perfil.nome],
            ["Data de nascimento", F.formatarData(perfil.nascimento)],
            ["Objetivo principal", perfil.objetivo],
            ["Rotina de treino", perfil.rotina],
            ["Restrições alimentares", restricoes.length ? restricoes.join(", ") : "Nenhuma informada"]
        ];
    }

    function renderizar() {
        el("avatar").textContent = F.iniciais(perfil.nome);
        el("nomeExibido").textContent = perfil.nome;
        el("tipoExibido").textContent = perfil.tipo === "nutricionista" ? "Nutricionista" : "Usuário";

        seloStatus.replaceChildren();
        avisoVerificacao.hidden = true;

        if (perfil.tipo === "nutricionista") {
            seloStatus.append(F.criarSelo(perfil.statusVerificacao));
            avisoVerificacao.hidden = perfil.statusVerificacao === "verificado";
        }

        listaDados.replaceChildren(
            ...linhasDoPerfil().map(([rotulo, valor, longo]) => criarLinha(rotulo, valor, longo))
        );
    }

    /* ---------- Edição ---------- */

    function entrarEdicao() {
        F.limparErros(form);
        F.preencherFormulario(form, perfil);
        atualizadores.forEach((atualizar) => atualizar());

        F.mostrarMensagem(mensagemForm, "");
        F.mostrarMensagem(mensagemPagina, "");

        visualizacao.hidden = true;
        botaoEditar.hidden = true;
        form.hidden = false;
        form.elements.nome.focus();
    }

    function sairEdicao() {
        form.hidden = true;
        visualizacao.hidden = false;
        botaoEditar.hidden = false;
        botaoEditar.focus();
    }

    botaoEditar.addEventListener("click", entrarEdicao);
    form.querySelector("[data-cancelar]").addEventListener("click", sairEdicao);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        F.mostrarMensagem(mensagemForm, "");

        if (!F.validarFormulario(form)) {
            F.mostrarMensagem(mensagemForm, "Revise os campos destacados.", "erro");
            return;
        }

        const dados = F.lerFormulario(form);
        let novo;

        if (perfil.tipo === "nutricionista") {
            novo = {
                ...perfil,
                nome: dados.nome,
                crnRegiao: dados.crnRegiao,
                crnNumero: dados.crnNumero,
                especialidade: dados.especialidade,
                especialidadeOutra: dados.especialidade === "Outra" ? dados.especialidadeOutra || "" : "",
                apresentacao: dados.apresentacao
            };
            novo.statusVerificacao = F.calcularStatus(perfil, novo);
        } else {
            novo = {
                ...perfil,
                nome: dados.nome,
                nascimento: dados.nascimento,
                objetivo: dados.objetivo,
                rotina: dados.rotina,
                restricoes: dados.restricoes || [],
                outrasRestricoes: dados.outrasRestricoes || ""
            };
        }

        if (!F.salvarPerfil(novo)) {
            F.mostrarMensagem(
                mensagemForm,
                "Não foi possível salvar neste navegador. Libere o armazenamento do site e tente de novo.",
                "erro"
            );
            return;
        }

        const verificacaoRefeita =
            perfil.statusVerificacao === "verificado" && novo.statusVerificacao === "pendente";

        perfil = novo;
        renderizar();
        sairEdicao();

        F.mostrarMensagem(
            mensagemPagina,
            verificacaoRefeita
                ? "Alterações salvas. Como o CRN mudou, vamos verificar seu registro de novo."
                : "Alterações salvas.",
            "sucesso"
        );
    });

    renderizar();
})();
