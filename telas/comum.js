/*
 * Funções compartilhadas pelas telas de onboarding e perfil.
 *
 * Não há autenticação nem banco de dados: o perfil fica salvo apenas no
 * localStorage do navegador, para que as telas conversem entre si.
 * Quando a API existir, basta trocar carregarPerfil() e salvarPerfil().
 */
(function () {
    "use strict";

    const CHAVE_PERFIL = "fitnutri.perfil";
    const CHAVE_TIPO = "fitnutri.tipo";

    const PAGINAS = {
        apresentacao: "./apresentacao.html",
        login: "./login.html",
        onboarding: "./onboarding.html",
        perfilUsuario: "./completar-perfil-usuario.html",
        perfilNutricionista: "./completar-perfil-nutricionista.html",
        inicioUsuario: "./inicio-usuario.html",
        inicioNutricionista: "./inicio-nutricionista.html",
        meuPerfil: "./meu-perfil.html"
    };

    /* ---------- Armazenamento local ---------- */

    function ler(chave) {
        try {
            return window.localStorage.getItem(chave);
        } catch {
            return null;
        }
    }

    function gravar(chave, valor) {
        try {
            window.localStorage.setItem(chave, valor);
            return true;
        } catch {
            return false;
        }
    }

    function carregarPerfil() {
        const bruto = ler(CHAVE_PERFIL);
        if (!bruto) {
            return null;
        }

        try {
            const perfil = JSON.parse(bruto);
            return perfil && typeof perfil === "object" ? perfil : null;
        } catch {
            return null;
        }
    }

    function salvarPerfil(perfil) {
        const salvo = gravar(CHAVE_PERFIL, JSON.stringify(perfil));
        if (salvo) {
            gravar(CHAVE_TIPO, perfil.tipo);
        }
        return salvo;
    }

    function obterTipo() {
        const tipo = ler(CHAVE_TIPO);
        return tipo === "usuario" || tipo === "nutricionista" ? tipo : null;
    }

    function definirTipo(tipo) {
        return gravar(CHAVE_TIPO, tipo);
    }

    function paginaInicial(tipo) {
        return tipo === "nutricionista" ? PAGINAS.inicioNutricionista : PAGINAS.inicioUsuario;
    }

    /*
     * Status da verificação do CRN. Sem back-end, todo perfil novo fica
     * "pendente". Só continua "verificado" se o CRN não mudou.
     */
    function calcularStatus(anterior, novo) {
        const continuaVerificado =
            anterior &&
            anterior.tipo === "nutricionista" &&
            anterior.statusVerificacao === "verificado" &&
            anterior.crnRegiao === novo.crnRegiao &&
            anterior.crnNumero === novo.crnNumero;

        return continuaVerificado ? "verificado" : "pendente";
    }

    /* ---------- Formatação ---------- */

    function primeiroNome(nome) {
        return String(nome || "").trim().split(/\s+/)[0] || "";
    }

    function iniciais(nome) {
        const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
        if (!partes.length) {
            return "?";
        }

        const primeira = partes[0][0];
        const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
        return (primeira + ultima).toUpperCase();
    }

    function formatarCrn(perfil) {
        return `CRN-${perfil.crnRegiao} ${perfil.crnNumero}`;
    }

    function formatarData(iso) {
        if (!iso) {
            return "";
        }

        const [ano, mes, dia] = iso.split("-");
        return `${dia}/${mes}/${ano}`;
    }

    function hojeISO() {
        const agora = new Date();
        const mes = String(agora.getMonth() + 1).padStart(2, "0");
        const dia = String(agora.getDate()).padStart(2, "0");
        return `${agora.getFullYear()}-${mes}-${dia}`;
    }

    function criarSelo(status) {
        const verificado = status === "verificado";

        const selo = document.createElement("span");
        selo.className = `selo ${verificado ? "selo--verificado" : "selo--pendente"}`;

        const icone = document.createElement("i");
        icone.className = `fa-solid ${verificado ? "fa-circle-check" : "fa-hourglass-half"}`;
        icone.setAttribute("aria-hidden", "true");

        selo.append(icone, verificado ? "Perfil verificado" : "Pendente de verificação");
        return selo;
    }

    /* ---------- Abrir páginas em nova aba ---------- */

    // Abre a aba durante o clique/envio, para reduzir a chance de bloqueio.
    function abrirAbaVazia() {
        return window.open("about:blank", "_blank");
    }

    function enviarAba(aba, url) {
        if (!aba || aba.closed) {
            return false;
        }

        aba.opener = null;
        aba.location.replace(new URL(url, window.location.href).href);
        return true;
    }

    function fecharAba(aba) {
        if (aba && !aba.closed) {
            aba.close();
        }
    }

    /* ---------- Mensagens ---------- */

    function mostrarMensagem(elemento, texto, tipo) {
        elemento.replaceChildren(document.createTextNode(texto));
        elemento.classList.remove("mensagem--erro", "mensagem--sucesso");

        if (tipo) {
            elemento.classList.add(`mensagem--${tipo}`);
        }
    }

    function anexarLink(elemento, texto, url) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = texto;

        const aviso = document.createElement("span");
        aviso.className = "sr-only";
        aviso.textContent = " (abre em nova aba)";
        link.append(aviso);

        elemento.append(" ", link);
    }

    /* ---------- Leitura e preenchimento de formulários ---------- */

    function lerFormulario(form) {
        const dados = {};
        const formData = new FormData(form);

        for (const nome of new Set(formData.keys())) {
            const valores = formData.getAll(nome).map((v) => (typeof v === "string" ? v.trim() : v));
            dados[nome] = valores.length > 1 ? valores : valores[0];
        }

        // Grupos de checkbox sempre viram lista (mesmo com 0 ou 1 marcado).
        form.querySelectorAll('input[type="checkbox"]').forEach((caixa) => {
            const grupo = form.querySelectorAll(`input[type="checkbox"][name="${caixa.name}"]`);
            if (grupo.length > 1) {
                dados[caixa.name] = formData.getAll(caixa.name);
            }
        });

        return dados;
    }

    function preencherFormulario(form, dados) {
        for (const campo of form.elements) {
            if (!campo.name || !(campo.name in dados)) {
                continue;
            }

            const valor = dados[campo.name];

            if (campo.type === "checkbox" || campo.type === "radio") {
                campo.checked = Array.isArray(valor) ? valor.includes(campo.value) : valor === campo.value;
            } else {
                campo.value = valor ?? "";
            }
        }
    }

    /* ---------- Validação com mensagens próprias ---------- */

    const REGRAS = {
        nomeCompleto(campo) {
            return campo.value.trim().split(/\s+/).length < 2 ? "Informe nome e sobrenome." : "";
        },

        dataNascimento(campo) {
            if (!campo.value) {
                return "";
            }

            const data = new Date(`${campo.value}T00:00:00`);
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            if (Number.isNaN(data.getTime())) {
                return "Informe uma data válida.";
            }
            if (data > hoje) {
                return "A data de nascimento não pode ser futura.";
            }
            if (data.getFullYear() < 1900) {
                return "Confira o ano de nascimento.";
            }
            return "";
        }
    };

    function aplicarRegras(campo) {
        campo.setCustomValidity("");

        const ehTexto = campo.tagName === "TEXTAREA" || ["text", "tel", "search"].includes(campo.type);
        const valor = ehTexto ? campo.value.trim() : campo.value;

        if (ehTexto && campo.required && !valor) {
            campo.setCustomValidity(campo.dataset.msgObrigatorio || "Preencha este campo.");
            return;
        }

        if (ehTexto && campo.minLength > 0 && valor && valor.length < campo.minLength) {
            campo.setCustomValidity(campo.dataset.msgInvalido || `Use pelo menos ${campo.minLength} caracteres.`);
            return;
        }

        const regra = REGRAS[campo.dataset.regra];
        if (regra) {
            const mensagem = regra(campo);
            if (mensagem) {
                campo.setCustomValidity(mensagem);
            }
        }
    }

    function mensagemDeErro(campo) {
        if (campo.validity.customError) {
            return campo.validationMessage;
        }
        if (campo.validity.valueMissing) {
            return campo.dataset.msgObrigatorio || "Preencha este campo.";
        }
        return campo.dataset.msgInvalido || "Confira o valor informado.";
    }

    function marcarCampo(campo, invalido) {
        const caixa = campo.closest(".input-box") || campo.closest(".opcoes");

        if (invalido) {
            campo.setAttribute("aria-invalid", "true");
        } else {
            campo.removeAttribute("aria-invalid");
        }

        if (caixa) {
            caixa.classList.toggle("invalido", invalido);
        }
    }

    // Valida os controles e escreve as mensagens. Devolve o primeiro inválido.
    function validarControles(controles) {
        const mensagens = new Map();
        let primeiroInvalido = null;

        controles.forEach((campo) => {
            aplicarRegras(campo);
            const valido = campo.checkValidity();
            marcarCampo(campo, !valido);

            const alvo = campo.dataset.erro ? document.getElementById(campo.dataset.erro) : null;
            if (alvo && !mensagens.get(alvo)) {
                mensagens.set(alvo, valido ? "" : mensagemDeErro(campo));
            }

            if (!valido && !primeiroInvalido) {
                primeiroInvalido = campo;
            }
        });

        mensagens.forEach((texto, alvo) => {
            alvo.textContent = texto;
        });

        return primeiroInvalido;
    }

    function validarFormulario(form) {
        const primeiroInvalido = validarControles(form.querySelectorAll("[data-validar]"));

        if (primeiroInvalido) {
            primeiroInvalido.focus();
        }
        return !primeiroInvalido;
    }

    // Depois que um campo foi marcado com erro, revalida enquanto a pessoa corrige.
    function observarCampos(form) {
        const revalidar = (evento) => {
            const campo = evento.target;

            if (
                !(campo instanceof HTMLElement) ||
                !campo.matches("[data-validar]") ||
                campo.getAttribute("aria-invalid") !== "true"
            ) {
                return;
            }

            const grupo = campo.dataset.erro
                ? form.querySelectorAll(`[data-erro="${campo.dataset.erro}"]`)
                : [campo];

            validarControles(grupo);
        };

        form.addEventListener("input", revalidar);
        form.addEventListener("change", revalidar);
    }

    function limparErros(form) {
        form.querySelectorAll("[data-validar]").forEach((campo) => marcarCampo(campo, false));
        form.querySelectorAll(".campo__erro").forEach((erro) => {
            erro.textContent = "";
        });
    }

    /* ---------- Comportamentos de campos ---------- */

    function ligarContador(textarea, saida) {
        const atualizar = () => {
            saida.textContent = `${textarea.value.length} de ${textarea.maxLength} caracteres`;
        };

        textarea.addEventListener("input", atualizar);
        atualizar();
        return atualizar;
    }

    function ligarOutraEspecialidade(select, bloco, campo) {
        const atualizar = () => {
            const mostrar = select.value === "Outra";

            bloco.hidden = !mostrar;
            campo.disabled = !mostrar;

            if (!mostrar) {
                campo.value = "";
                marcarCampo(campo, false);

                const alvo = document.getElementById(campo.dataset.erro);
                if (alvo) {
                    alvo.textContent = "";
                }
            }
        };

        select.addEventListener("change", atualizar);
        atualizar();
        return atualizar;
    }

    function apenasDigitos(input) {
        input.addEventListener("input", () => {
            const limpo = input.value.replace(/\D/g, "");
            if (limpo !== input.value) {
                input.value = limpo;
            }
        });
    }

    window.FitNutri = {
        PAGINAS,
        carregarPerfil,
        salvarPerfil,
        obterTipo,
        definirTipo,
        paginaInicial,
        calcularStatus,
        primeiroNome,
        iniciais,
        formatarCrn,
        formatarData,
        hojeISO,
        criarSelo,
        abrirAbaVazia,
        enviarAba,
        fecharAba,
        mostrarMensagem,
        anexarLink,
        lerFormulario,
        preencherFormulario,
        validarFormulario,
        observarCampos,
        limparErros,
        ligarContador,
        ligarOutraEspecialidade,
        apenasDigitos
    };
})();
