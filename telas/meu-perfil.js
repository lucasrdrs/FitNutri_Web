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
    const tituloEstado = el("titulo-vazio");
    const descricaoEstado = estadoVazio.querySelector("p");
    const acaoEstado = estadoVazio.querySelector("a");

    const formularios = {
        usuario: el("formUsuario"),
        nutricionista: el("formNutricionista")
    };

    function mostrarEstado(titulo, descricao, textoAcao, destino) {
        conteudo.hidden = true;
        estadoVazio.hidden = false;
        tituloEstado.textContent = titulo;
        descricaoEstado.textContent = descricao;

        if (textoAcao && destino) {
            acaoEstado.hidden = false;
            acaoEstado.href = destino;
            acaoEstado.textContent = textoAcao;
        } else {
            acaoEstado.hidden = true;
        }
    }

    function destinoParaCompletarPerfil(tipo) {
        if (tipo === "usuario") {
            return F.PAGINAS.perfilUsuario;
        }
        if (tipo === "nutricionista") {
            return F.PAGINAS.perfilNutricionista;
        }
        return F.PAGINAS.onboarding;
    }

    function tratarErroAoCarregar(erro) {
        if (erro.status === 401) {
            mostrarEstado(
                "Sua sessão não está disponível",
                "Entre novamente para consultar os dados do perfil da sua conta.",
                "Ir para o login",
                F.PAGINAS.login
            );
            return;
        }

        if (erro.status === 404) {
            const tipo = erro.detalhes?.profileType;
            mostrarEstado(
                "Seu perfil ainda não foi preenchido",
                erro.message,
                "Completar meu perfil",
                destinoParaCompletarPerfil(tipo)
            );
            return;
        }

        mostrarEstado(
            "Não foi possível carregar o perfil",
            erro.message || "Confira se a API está em execução e tente novamente.",
            "Tentar novamente",
            window.location.href
        );
    }

    function inicializarPerfil(perfil) {
        if (!perfil || !formularios[perfil.tipo]) {
            mostrarEstado(
                "Não foi possível identificar o perfil",
                "A API não retornou um tipo de perfil válido. Entre novamente ou tente mais tarde.",
                "Ir para o login",
                F.PAGINAS.login
            );
            return;
        }

        el("linkInicio").href = F.paginaInicial(perfil.tipo);
        conteudo.hidden = false;
        estadoVazio.hidden = true;

        const form = formularios[perfil.tipo];
        const mensagemForm = form.querySelector(".mensagem");
        const botaoSalvar = form.querySelector('button[type="submit"]');
        let atualizadores = [];

        F.observarCampos(form);

        if (perfil.tipo === "nutricionista") {
            F.apenasDigitos(form.elements.crnNumero);

            atualizadores = [
                F.ligarContador(form.elements.apresentacao, el("n-contador")),
                F.ligarOutraEspecialidade(
                    form.elements.especialidade,
                    el("n-blocoOutra"),
                    form.elements.especialidadeOutra
                )
            ];
        } else {
            form.elements.nascimento.max = F.hojeISO();
        }

        function criarLinha(rotulo, valor, longo) {
            const bloco = document.createElement("div");
            const dt = document.createElement("dt");
            const dd = document.createElement("dd");

            dt.textContent = rotulo;
            dd.textContent = valor || "Não informado";
            if (longo) {
                dd.className = "dados__texto";
            }

            bloco.append(dt, dd);
            return bloco;
        }

        function linhasDoPerfil() {
            if (perfil.tipo === "nutricionista") {
                const especialidade = perfil.especialidade === "Outra"
                    ? perfil.especialidadeOutra
                    : perfil.especialidade;

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
                [
                    "Restrições alimentares",
                    restricoes.length ? restricoes.join(", ") : "Nenhuma informada"
                ]
            ];
        }

        function renderizar() {
            el("avatar").textContent = F.iniciais(perfil.nome);
            el("nomeExibido").textContent = perfil.nome;
            el("tipoExibido").textContent = perfil.tipo === "nutricionista"
                ? "Nutricionista"
                : "Usuário";

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

        form.addEventListener("submit", async (event) => {
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
                    especialidadeOutra: dados.especialidade === "Outra"
                        ? dados.especialidadeOutra || ""
                        : "",
                    apresentacao: dados.apresentacao
                };
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

            botaoSalvar.disabled = true;
            botaoSalvar.textContent = "Salvando...";

            try {
                // O perfil é salvo na API e associado à conta autenticada pelo JWT.
                const perfilSalvo = perfil.tipo === "nutricionista"
                    ? await F.salvarPerfilNutricionistaNaApi(novo)
                    : await F.salvarPerfilUsuarioNaApi(novo);

                const verificacaoRefeita =
                    perfil.statusVerificacao === "verificado" &&
                    perfilSalvo.statusVerificacao === "pendente";

                perfil = perfilSalvo;
                renderizar();
                sairEdicao();

                F.mostrarMensagem(
                    mensagemPagina,
                    verificacaoRefeita
                        ? "Alterações salvas. Como o CRN mudou, vamos verificar seu registro de novo."
                        : "Alterações salvas no seu perfil.",
                    "sucesso"
                );
            } catch (erro) {
                F.mostrarMensagem(
                    mensagemForm,
                    erro.message || "Não foi possível salvar as alterações na API.",
                    "erro"
                );
            } finally {
                botaoSalvar.disabled = false;
                botaoSalvar.textContent = "Salvar alterações";
            }
        });

        renderizar();
    }

    async function iniciar() {
        mostrarEstado(
            "Carregando seu perfil",
            "Consultando os dados da sua conta na API...",
            "",
            ""
        );

        try {
            // Não lê fitnutri.perfil do localStorage; obtém o perfil ligado ao JWT actual.
            const perfilDaApi = await F.obterPerfilDaApi();
            inicializarPerfil(perfilDaApi);
        } catch (erro) {
            tratarErroAoCarregar(erro);
        }
    }

    iniciar();
})();
