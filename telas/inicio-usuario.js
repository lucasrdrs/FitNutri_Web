(function () {
    "use strict";

    const F = window.FitNutri;
    const el = (id) => document.getElementById(id);
    const estadoVazio = el("estadoVazio");
    const estadoOutroTipo = el("estadoOutroTipo");
    const conteudoPerfil = el("conteudoPerfil");
    const conteudoPagina = el("conteudo");

    async function carregarPerfilDaApi() {
        try {
            const perfil = await F.obterPerfilDaApi();

            if (perfil?.tipo !== "usuario") {
                estadoOutroTipo.hidden = false;
                return;
            }

            el("primeiroNome").textContent = F.primeiroNome(perfil.nome);
            el("dObjetivo").textContent = perfil.objetivo || "Não informado";
            el("dRotina").textContent = perfil.rotina || "Não informado";

            const restricoes = [
                ...(Array.isArray(perfil.restricoes) ? perfil.restricoes : []),
                perfil.outrasRestricoes
            ].filter(Boolean);

            el("dRestricoes").textContent = restricoes.length
                ? restricoes.join(", ")
                : "Nenhuma informada";

            conteudoPerfil.hidden = false;
        } catch (erro) {
            if (erro.status === 404) {
                // A API informa 404 quando a conta ainda não tem perfil detalhado.
                estadoVazio.hidden = false;
                return;
            }

            const aviso = document.createElement("p");
            aviso.className = "mensagem mensagem--erro";
            aviso.setAttribute("role", "alert");
            aviso.textContent = erro.message || "Não foi possível carregar seu perfil.";

            if (erro.status === 401) {
                F.anexarLink(aviso, "Ir para o login", F.PAGINAS.login);
            }

            conteudoPagina.prepend(aviso);
        }
    }

    carregarPerfilDaApi();
})();
