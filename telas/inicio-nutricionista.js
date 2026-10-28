(function () {
    "use strict";

    const F = window.FitNutri;
    const el = (id) => document.getElementById(id);

    const ETAPAS = [
        { titulo: "Perfil enviado", detalhe: "Recebemos seus dados e sua apresentação." },
        { titulo: "Conferência do CRN", detalhe: "Confirmamos seu registro no conselho regional." },
        { titulo: "Perfil publicado", detalhe: "Seu perfil passa a aparecer para os usuários." }
    ];

    const ESTADOS = {
        concluida: { rotulo: "Concluído", icone: "fa-check" },
        andamento: { rotulo: "Em andamento", icone: "fa-hourglass-half" },
        aguardando: { rotulo: "Aguardando", icone: "fa-circle" }
    };

    function estadosPara(status) {
        return status === "verificado"
            ? ["concluida", "concluida", "concluida"]
            : ["concluida", "andamento", "aguardando"];
    }

    function criarEtapa(etapa, estado) {
        const item = document.createElement("li");
        item.className = `etapa etapa--${estado}`;

        const marca = document.createElement("span");
        marca.className = "etapa__marca";
        marca.setAttribute("aria-hidden", "true");

        const icone = document.createElement("i");
        icone.className = `fa-solid ${ESTADOS[estado].icone}`;
        if (estado === "aguardando") {
            icone.style.fontSize = "6px";
        }
        marca.append(icone);

        const texto = document.createElement("div");

        const titulo = document.createElement("span");
        titulo.className = "etapa__titulo";
        titulo.textContent = etapa.titulo;

        const detalhe = document.createElement("span");
        detalhe.className = "etapa__detalhe";
        detalhe.textContent = etapa.detalhe;

        const rotulo = document.createElement("span");
        rotulo.className = "etapa__estado";
        rotulo.textContent = ESTADOS[estado].rotulo;

        texto.append(titulo, detalhe, rotulo);
        item.append(marca, texto);
        return item;
    }

    const perfil = F.carregarPerfil();

    if (!perfil) {
        el("estadoVazio").hidden = false;
        return;
    }

    if (perfil.tipo !== "nutricionista") {
        el("estadoOutroTipo").hidden = false;
        return;
    }

    const verificado = perfil.statusVerificacao === "verificado";
    const crn = F.formatarCrn(perfil);
    const especialidade = perfil.especialidade === "Outra" ? perfil.especialidadeOutra : perfil.especialidade;

    el("primeiroNome").textContent = F.primeiroNome(perfil.nome);

    // Status da verificação
    el("seloStatus").append(F.criarSelo(perfil.statusVerificacao));
    el("cartaoStatus").classList.add(verificado ? "cartao--verificado" : "cartao--pendente");

    el("statusTitulo").textContent = verificado
        ? "Seu registro foi verificado."
        : "Seu perfil está pendente de verificação.";

    el("statusDetalhe").textContent = verificado
        ? `O registro ${crn} foi confirmado. Seu perfil já pode aparecer para os usuários.`
        : `Estamos conferindo o registro ${crn}. Até a conclusão, seu perfil não aparece para os usuários.`;

    const estados = estadosPara(perfil.statusVerificacao);
    el("listaEtapas").replaceChildren(...ETAPAS.map((etapa, i) => criarEtapa(etapa, estados[i])));

    // Resumo do perfil
    el("dCrn").textContent = crn;
    el("dEspecialidade").textContent = especialidade || "Não informada";
    el("dApresentacao").textContent = perfil.apresentacao || "Não informada";

    // Recursos que dependem da verificação
    document.querySelectorAll("[data-etiqueta]").forEach((etiqueta) => {
        etiqueta.textContent = verificado ? "Em breve" : "Disponível após a verificação";
    });

    el("conteudoPerfil").hidden = false;
})();
