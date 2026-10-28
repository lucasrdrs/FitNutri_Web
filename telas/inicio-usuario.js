(function () {
    "use strict";

    const F = window.FitNutri;
    const el = (id) => document.getElementById(id);

    const perfil = F.carregarPerfil();

    if (!perfil) {
        el("estadoVazio").hidden = false;
        return;
    }

    if (perfil.tipo !== "usuario") {
        el("estadoOutroTipo").hidden = false;
        return;
    }

    el("primeiroNome").textContent = F.primeiroNome(perfil.nome);
    el("dObjetivo").textContent = perfil.objetivo || "Não informado";
    el("dRotina").textContent = perfil.rotina || "Não informado";

    const restricoes = [...(perfil.restricoes || []), perfil.outrasRestricoes].filter(Boolean);
    el("dRestricoes").textContent = restricoes.length ? restricoes.join(", ") : "Nenhuma informada";

    el("conteudoPerfil").hidden = false;
})();
