import jsPDF from "jspdf";
import { PAISES } from "../components/Header";

function getPais(codigo) {
  return PAISES.find((p) => p.codigo === codigo) || PAISES[0];
}

const C = {
  escuro:     [15,  23,   42],
  texto:      [51,  65,   85],
  cinza:      [100, 116, 139],
  cinzaClaro: [226, 232, 240],
  cinzaBg:    [241, 245, 249],
  fundo:      [248, 250, 252],
  branco:     [255, 255, 255],
  preto:      [0,    0,    0],
  grafite:    [30,   41,   59],
  verde:      [22,  163,  74],
  vermelho:   [220,  38,  38],
  amarelo:    [217, 119,   6],
};

function limpar(str) {
  return String(str || "")
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[\u2600-\u27BF]/g, "")
    .replace(/[✅❌⚠⚪▸•⚠️✓]/g, "-")
    .trim();
}

function novaPage(doc, y, min = 50) {
  if (y > doc.internal.pageSize.height - min) { doc.addPage(); return 24; }
  return y;
}

function badge(doc, texto, x, y, cor) {
  const t = limpar(texto);
  doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
  const w = doc.getTextWidth(t) + 8;
  doc.setFillColor(...cor);
  doc.roundedRect(x, y - 4.5, w, 6.5, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(t, x + 4, y, { baseline: "middle" });
  return x + w + 4;
}

function statusCor(s) {
  if (s === "conforme")     return C.verde;
  if (s === "nao_conforme") return C.vermelho;
  return C.cinza;
}
function statusLabel(s) {
  if (s === "conforme")      return "CONFORME";
  if (s === "nao_conforme")  return "NÃO CONFORME";
  if (s === "nao_observado") return "NÃO OBSERVADO";
  return s || "";
}
function gravidadeCor(g) {
  if (g === "leve")     return C.verde;
  if (g === "moderada") return C.amarelo;
  if (g === "critica")  return C.vermelho;
  return C.cinza;
}

function secao(doc, num, titulo, y, ml, cw) {
  doc.setFillColor(...C.cinzaBg);
  doc.roundedRect(ml, y, cw, 8, 1, 1, "F");
  doc.setFillColor(...C.grafite);
  doc.roundedRect(ml, y, 14, 8, 1, 1, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.branco);
  doc.text(String(num), ml + 7, y + 4.8, { align: "center" });
  doc.setFontSize(10); doc.setTextColor(...C.grafite);
  doc.text(titulo.toUpperCase(), ml + 18, y + 5.2);
  return y + 13;
}

function par(doc, label, valor, x, y, ll = 40) {
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.cinza);
  doc.text(limpar(label).toUpperCase() + ":", x, y);
  doc.setFont("helvetica", "normal"); doc.setTextColor(...C.escuro);
  doc.text(limpar(valor), x + ll, y);
}

function rodape(doc, nomeCliente) {
  const total = doc.internal.getNumberOfPages();
  const W = doc.internal.pageSize.width;
  const H = doc.internal.pageSize.height;
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFillColor(...C.cinzaBg);
    doc.rect(0, H - 12, W, 12, "F");
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.cinza);
    doc.text(
      `Relatório Técnico de Vistoria — ${limpar(nomeCliente)}   |   Página ${i} de ${total}   |   Eng. Marilia Souza`,
      W / 2, H - 5.5, { align: "center" }
    );
  }
}

async function urlParaBase64(url) {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return new Promise((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function gerarNomeArquivo(cliente, tipo) {
  const nomeCliente = limpar(cliente?.nome || "vistoria").replace(/\s+/g, "_");
  const agora = new Date();
  const data = agora.toISOString().split("T")[0];
  const hora = agora.toTimeString().split(":").slice(0, 2).join("h");
  const prefixo = tipo === "empresa" ? "Empresa" : tipo === "condominio" ? "Condominio" : "PessoaFisica";
  return `${prefixo}_${nomeCliente}_${data}_${hora}.pdf`;
}

function renderFotosElemento(doc, el, ml, cw, y) {
  const fotos  = el.fotos || {};
  const sitArr = Array.isArray(fotos.situacao)     ? fotos.situacao.filter(Boolean)     : [];
  const termArr = Array.isArray(fotos.termografica) ? fotos.termografica.filter(Boolean) : [];

  if (!sitArr.length && !termArr.length) return y;

  // ── Modo comparativo: ambas têm fotos, lado a lado ───────────────────
  if (sitArr.length && termArr.length) {
    const lg = 72, alt = 48, gap = 8;
    const pares = Math.max(sitArr.length, termArr.length);

    for (let i = 0; i < pares; i++) {
      y = novaPage(doc, y, alt + 18);

      // — Situação (esquerda) —
      const s = sitArr[i];
      if (s) {
        const x = ml + 3;
        try {
          doc.setFillColor(...C.cinzaClaro);
          doc.roundedRect(x - 1, y - 1, lg + 2, alt + 2, 2, 2, "F");
          const fmt = s.startsWith("data:image/png") ? "PNG" : "JPEG";
          doc.addImage(s, fmt, x, y, lg, alt);
          doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.verde);
          doc.text("Situação", x + lg / 2, y + alt + 4, { align: "center" });
        } catch (e) { console.warn("Erro foto Situação:", e?.message); }
      }

      // — Termográfica (direita) —
      const t = termArr[i];
      if (t) {
        const x = ml + 3 + lg + gap;
        try {
          doc.setFillColor(...C.cinzaClaro);
          doc.roundedRect(x - 1, y - 1, lg + 2, alt + 2, 2, 2, "F");
          const fmt = t.startsWith("data:image/png") ? "PNG" : "JPEG";
          doc.addImage(t, fmt, x, y, lg, alt);
          doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.vermelho);
          doc.text("Termográfica", x + lg / 2, y + alt + 4, { align: "center" });
        } catch (e) { console.warn("Erro foto Termográfica:", e?.message); }
      }

      // Número do par
      doc.setFontSize(5.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.cinza);
      doc.text(`Par ${i + 1}`, ml + cw - 5, y + 2, { align: "right" });

      y += alt + 10;
    }

    // Legenda
    if (fotos.legenda) {
      y = novaPage(doc, y, 14);
      doc.setFillColor(...C.fundo);
      doc.roundedRect(ml + 2, y, cw - 4, 10, 2, 2, "F");
      doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(...C.texto);
      doc.text(`Legenda: ${limpar(fotos.legenda)}`, ml + 6, y + 5.5);
      y += 14;
    }
    return y;
  }

  // ── Modo normal (só um tipo de foto) ────────────────────────────────
  const todas = [
    ...sitArr.map((f)  => ({ src: f, leg: "Situação" })),
    ...termArr.map((f) => ({ src: f, leg: "Termográfica" })),
  ];

  const larg = 50, alt = 36;
  const porLinha = Math.floor((cw - 10) / (larg + 8)) || 1;
  let xf = ml + 5, cl = 0;

  for (const { src, leg } of todas) {
    if (cl > 0 && cl % porLinha === 0) { y += alt + 14; xf = ml + 5; }
    y = novaPage(doc, y, alt + 18);
    try {
      doc.setFillColor(...C.cinzaClaro);
      doc.roundedRect(xf - 1, y - 1, larg + 2, alt + 2, 2, 2, "F");
      const fmt = src?.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(src, fmt, xf, y, larg, alt);
      doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.cinza);
      doc.text(leg, xf + larg / 2, y + alt + 4, { align: "center" });
    } catch (e) { console.warn("Erro ao adicionar foto no PDF:", e?.message); }
    xf += larg + 8; cl++;
  }
  y += alt + 10;

  if (fotos.legenda) {
    y = novaPage(doc, y, 14);
    doc.setFillColor(...C.fundo);
    doc.roundedRect(ml + 2, y, cw - 4, 10, 2, 2, "F");
    doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(...C.texto);
    doc.text(`Legenda: ${limpar(fotos.legenda)}`, ml + 6, y + 5.5);
    y += 14;
  }
  return y;
}

function cabecalhoPagina(doc, logoBase64, titulo, subtitulo, cli, ml, W, mr) {
  doc.setFillColor(...C.grafite); doc.rect(0, 0, W, 40, "F");
  doc.setFillColor(...C.cinza); doc.rect(0, 38, W, 2, "F");
  if (logoBase64) {
    try { doc.addImage(logoBase64, "JPEG", ml, 4, 48, 30); } catch {}
  }
  doc.setTextColor(...C.branco);
  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text(titulo, ml + 54, 12);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text(subtitulo, ml + 54, 20);
  doc.setFontSize(8);
  doc.text(`Emitido em ${new Date().toLocaleDateString("pt-BR")}`, ml + 54, 28);
  if (cli.numeroPedido) doc.text(`OS: ${limpar(cli.numeroPedido)}`, W - mr, 28, { align: "right" });
}

function secaoCliente(doc, cli, pais, ml, cw, y) {
  y = secao(doc, "1", "Cliente", y, ml, cw);
  const telCompleto = [pais.ddi, cli.ddd, cli.telefone].filter(Boolean).join(" ");
  const alt = cli.tipoCliente ? 35 : 28;
  doc.setFillColor(...C.fundo); doc.roundedRect(ml, y, cw, alt, 2, 2, "F");
  par(doc, "Nome",          cli.nome,    ml + 4, y + 7,  32);
  par(doc, pais.docLabel,   cli.cpfCnpj, ml + 4 + cw/2, y + 7,  28);
  par(doc, "Telefone",      telCompleto, ml + 4, y + 14, 32);
  par(doc, "Data Vistoria", cli.dataVistoria, ml + 4, y + 21, 32);
  if (cli.tipoCliente) par(doc, "Tipo", { condominio: "Condomínio", pessoa: "Pessoa Física", empresa: "Empresa" }[cli.tipoCliente] || cli.tipoCliente, ml + 4 + cw/2, y + 14, 28);
  return y + alt + 6;
}

function secaoImovel(doc, imo, campos, ml, cw, y) {
  y = secao(doc, "2", "Imóvel", y, ml, cw);
  const tipoLabel = imo.tipo === "casa" ? "Casa / Moradia" : imo.tipo === "apartamento" ? "Apartamento" : imo.tipo || "—";
  const end = [campos.logradouro, campos.numero ? `n.${campos.numero}` : null, campos.bairro, campos.cidade].filter(Boolean).join(", ");
  const linhas = [["Tipo", tipoLabel], ["Endereço", end || "—"]];
  if (campos.condominio) linhas.push(["Condomínio", campos.condominio]);
  const alt = linhas.length * 7 + 6;
  doc.setFillColor(...C.fundo); doc.roundedRect(ml, y, cw, alt, 2, 2, "F");
  linhas.forEach(([lbl, val], i) => par(doc, lbl, val, ml + 4, y + 7 + i * 7, 36));
  return y + alt + 5;
}

function secaoAssinatura(doc, relatorio, cli, pais, ml, cw, y) {
  y = novaPage(doc, y, 55);
  y = secao(doc, "A", "Assinatura do Responsável Técnico", y, ml, cw);
  doc.setFillColor(...C.fundo); doc.setDrawColor(...C.cinzaClaro);
  doc.roundedRect(ml, y, cw / 2, 42, 2, 2, "FD");
  if (relatorio.assinatura) {
    try { doc.addImage(relatorio.assinatura, "PNG", ml + 4, y + 2, cw / 2 - 8, 26); } catch {}
  }
  doc.setDrawColor(...C.cinza); doc.setLineWidth(0.5);
  doc.line(ml + 4, y + 33, ml + cw / 2 - 4, y + 33);
  doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.escuro);
  doc.text("Eng. Marilia Souza", ml + 5, y + 38);
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.cinza);
  doc.text("Engenheira Civil Responsável", ml + 5, y + 44);
  if (cli.art) doc.text(`${limpar(pais.artLabel)}: ${limpar(cli.art)}`, ml + 5, y + 50);
  return y + 48;
}

function secaoDisclaimers(doc, ml, cw, y) {
  y = novaPage(doc, y, 40);
  doc.addPage(); y = 24;
  y = secao(doc, "T", "Termos e Limitação de Responsabilidade", y, ml, cw);
  doc.setFillColor(...C.fundo); doc.setDrawColor(...C.cinzaClaro); doc.setLineWidth(0.3);
  doc.roundedRect(ml, y, cw, 50, 2, 2, "FD");
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.texto);
  const termos = [
    "O presente relatório foi elaborado no âmbito de uma inspeção técnica não-invasiva, refletindo as condições visíveis e acessíveis do imóvel à data e hora da vistoria.",
    "Os achados, classificações e recomendações baseiam-se no juízo profissional da engenheira responsável e nas informações recolhidas durante a inspeção.",
    "Este relatório não constitui relatório de engenharia estrutural, análise ambiental nem auditoria de conformidade regulamentar.",
    "Recomenda-se que as intervenções indicadas sejam executadas por profissionais qualificados.",
    "A engenheira responsável não se responsabiliza por defeitos ocultos não detetáveis através de inspeção visual ou instrumental não-invasiva.",
  ];
  let yt = y + 7;
  termos.forEach((t) => {
    const lines = doc.splitTextToSize(t, cw - 12);
    lines.forEach((l) => { doc.text(l, ml + 6, yt); yt += 5; });
    yt += 3;
  });
  yt += 6;
  doc.setFont("helvetica", "bold"); doc.setTextColor(...C.escuro);
  doc.text("Eng. Marilia Souza — Engenheira Civil", ml + 6, yt); yt += 5;
  doc.setFont("helvetica", "normal"); doc.setTextColor(...C.cinza);
  doc.text(`${new Date().toLocaleDateString("pt-BR")}`, ml + 6, yt);
  return yt;
}

// ═══════════════════════════════════════════════════════════════════════════
// GERAR PDF PESSOAL / CONDOMÍNIO
// ═══════════════════════════════════════════════════════════════════════════
async function gerarPDFCondominio(doc, relatorio, tipo) {
  const W   = doc.internal.pageSize.width;
  const ml  = 18, mr = 18, cw = W - ml - mr;
  let y     = 0;

  const cli    = relatorio?.cliente  || {};
  const imo    = relatorio?.imovel   || {};
  const campos = imo.campos          || {};
  const comodos = relatorio?.comodos || [];
  const pais   = getPais(cli.paisCodigo);

  const logoBase64 = await urlParaBase64("/logo.jpg");

  cabecalhoPagina(doc, logoBase64, "RELATÓRIO DE VISTORIA", "Engenharia Civil — Eng. Marilia Souza", cli, ml, W, mr);
  y = 48;

  y = secaoCliente(doc, cli, pais, ml, cw, y);
  y = secaoImovel(doc, imo, campos, ml, cw, y);

  // 3. Resumo geral
  y = secao(doc, "3", "Resumo da Vistoria", y, ml, cw);
  const totalEl = comodos.reduce((a, c) => a + (c.elementos?.length || 0), 0);
  const totalNc = comodos.reduce((a, c) => a + (c.elementos || []).filter((e) => e.status === "nao_conforme").length, 0);
  doc.setFillColor(...C.fundo); doc.roundedRect(ml, y, cw, 22, 2, 2, "F");
  par(doc, "Cômodos Vistoriados", `${comodos.length}`, ml + 4, y + 7, 50);
  par(doc, "Total de Itens", `${totalEl}`, ml + 4, y + 14, 50);
  if (relatorio.resumoVistoria) {
    y += 28;
    y = novaPage(doc, y, 30);
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.texto);
    const linhasResumo = doc.splitTextToSize(limpar(relatorio.resumoVistoria), cw - 8);
    linhasResumo.forEach((l) => { y = novaPage(doc, y, 14); doc.text(l, ml + 5, y); y += 5.2; });
    y += 4;
  } else {
    y += 28;
  }

  // 4. Resultados por cômodo
  y = secao(doc, "4", "Resultados da Vistoria", y, ml, cw);
  let temProblemas = false;

  comodos.forEach((comodo, ci) => {
    const elementos = comodo.elementos || [];
    const naoConformes = elementos.filter((e) => e.status === "nao_conforme");
    if (!elementos.length && !naoConformes.length) return;
    temProblemas = true;
    y = novaPage(doc, y, 40);
    doc.setFillColor(...C.grafite); doc.roundedRect(ml, y, cw, 7.5, 1.5, 1.5, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.branco);
    doc.text(`${ci + 1}.  ${limpar(comodo.nome || "Cômodo")}`, ml + 5, y + 5);
    y += 11;

    elementos.forEach((el) => {
      y = novaPage(doc, y, 20);
      doc.setFillColor(...C.cinzaBg);
      doc.roundedRect(ml + 2, y, cw - 4, 7, 1, 1, "F");
      doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.escuro);
      doc.text(limpar(el.nome || "Elemento"), ml + 6, y + 4.8);

      let xb = ml + cw - 10;
      let lb = true;
      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      if (el.comprimento) { doc.setTextColor(...C.cinza); xb -= 40; doc.text(`C:${el.comprimento}m`, xb - (lb ? 0 : 5), y + 4.8); lb = false; }
      if (el.largura)     { doc.setTextColor(...C.cinza); xb -= 35; doc.text(`L:${el.largura}m`, xb, y + 4.8); }
      y += 10;

      if (el.status) {
        let xb2 = ml + 5;
        xb2 = badge(doc, statusLabel(el.status), xb2, y + 1, statusCor(el.status));
        if (el.gravidade) badge(doc, el.gravidade.toUpperCase(), xb2, y + 1, gravidadeCor(el.gravidade));
        y += 9;
      }

      if ((el.patologias || []).length > 0) {
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.vermelho);
        doc.text(`Patologias: ${el.patologias.join(" | ")}`, ml + 5, y);
        y += 6;
      }

      if (el.observacoes) {
        y = novaPage(doc, y, 14);
        doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.texto);
        const lines = doc.splitTextToSize(`Obs.: ${limpar(el.observacoes)}`, cw - 12);
        lines.forEach((l) => { y = novaPage(doc, y, 12); doc.text(l, ml + 5, y); y += 5; });
      }

      // Fotos do elemento
      y = renderFotosElemento(doc, el, ml, cw, y);
      y += 3;
    });

    if (!naoConformes.length && elementos.length > 0) {
      doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(...C.verde);
      doc.text("Todos os itens em conformidade.", ml + 5, y + 2);
      y += 8;
    }
  });

  if (!temProblemas) {
    doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.setTextColor(...C.verde);
    doc.text("Nenhum item inspecionado ou não conformidade identificada.", ml + 4, y + 6);
    y += 12;
  }

  // 5. Parecer Final
  if (relatorio.parecerFinal) {
    y = novaPage(doc, y, 40);
    y = secao(doc, "5", "Parecer Técnico", y, ml, cw);
    const parecerLimpo = limpar(relatorio.parecerFinal);
    const linhas = doc.splitTextToSize(parecerLimpo, cw - 10);
    doc.setFillColor(...C.fundo); doc.setDrawColor(...C.cinzaClaro); doc.setLineWidth(0.3);
    doc.roundedRect(ml, y, cw, Math.min(linhas.length * 5 + 10, 150), 2, 2, "FD");
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.texto);
    let yp = y + 7;
    linhas.forEach((l) => { if (yp < doc.internal.pageSize.height - 20) { doc.text(l, ml + 6, yp); yp += 5; } });
    y = yp + 8;
  }

  // A. Assinatura
  y = secaoAssinatura(doc, relatorio, cli, pais, ml, cw, y);

  // T. Termos
  secaoDisclaimers(doc, ml, cw, y);

  rodape(doc, cli.nome);
  const nome = gerarNomeArquivo(cli, tipo);
  doc.save(nome);
  return nome;
}

// ═══════════════════════════════════════════════════════════════════════════
// GERAR PDF BUSINESS — COMPLETO, TÉCNICO
// ═══════════════════════════════════════════════════════════════════════════
async function gerarPDFBusiness(doc, relatorio, tipo) {
  const W   = doc.internal.pageSize.width;
  const ml  = 18, mr = 18, cw = W - ml - mr;
  let y     = 0;

  const cli    = relatorio?.cliente  || {};
  const imo    = relatorio?.imovel   || {};
  const campos = imo.campos          || {};
  const comodos = relatorio?.comodos || [];
  const pais   = getPais(cli.paisCodigo);

  const logoBase64 = await urlParaBase64("/logo.jpg");

  doc.setFillColor(0, 0, 0); doc.rect(0, 0, W, 44, "F");
  doc.setFillColor(...C.cinza); doc.rect(0, 42, W, 2, "F");
  if (logoBase64) {
    try { doc.addImage(logoBase64, "JPEG", ml, 4, 50, 34); } catch {}
  }
  doc.setTextColor(...C.branco);
  doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO TÉCNICO DE VISTORIA", ml + 56, 14);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text("ENGENHARIA CIVIL — LAUDO TÉCNICO COMPLETO", ml + 56, 22);
  doc.setFontSize(8);
  doc.text("Eng. Marilia Souza", ml + 56, 30);
  const dataFmt = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Emitido em ${dataFmt}`, ml + 56, 37);
  if (cli.numeroPedido) doc.text(`OS: ${limpar(cli.numeroPedido)}`, W - mr, 37, { align: "right" });

  y = 52;

  // 1. Cliente
  y = secao(doc, "1", "Identificação do Cliente", y, ml, cw);
  const telCompleto = [pais.ddi, cli.ddd, cli.telefone].filter(Boolean).join(" ");
  const altCli = (cli.tipoCliente ? 35 : 28) + (cli.numeroPedido ? 7 : 0);
  doc.setFillColor(...C.fundo); doc.roundedRect(ml, y, cw, altCli, 2, 2, "F");
  par(doc, "Nome",          cli.nome,         ml + 4, y + 7,  32);
  par(doc, pais.docLabel,   cli.cpfCnpj,      ml + 4 + cw/2, y + 7,  28);
  par(doc, "Telefone",      telCompleto,      ml + 4, y + 14, 32);
  par(doc, "E-mail",        cli.email,        ml + 4 + cw/2, y + 14, 28);
  par(doc, "Data Vistoria", cli.dataVistoria, ml + 4, y + 21, 32);
  if (cli.tipoCliente) par(doc, "Tipo", { condominio: "Condomínio", pessoa: "Pessoa Física", empresa: "Empresa" }[cli.tipoCliente] || cli.tipoCliente, ml + 4 + cw/2, y + 21, 28);
  if (cli.numeroPedido) par(doc, "OS / Pedido", cli.numeroPedido, ml + 4, y + 28, 32);
  y += altCli + 6;

  // 2. Imóvel
  y = secao(doc, "2", "Identificação do Imóvel", y, ml, cw);
  const tipoLabel = imo.tipo === "casa" ? "Casa / Moradia" : imo.tipo === "apartamento" ? "Apartamento" : imo.tipo || "—";
  const linhasImo = [];
  linhasImo.push(["Tipo", tipoLabel]);
  if (imo.tipo === "apartamento") {
    linhasImo.push(["Condomínio", campos.condominio || "—"]);
    linhasImo.push(["Unidade / Andar", `${campos.unidade || "—"} / ${campos.andar || "—"}`]);
    if (campos.bloco) linhasImo.push(["Bloco", campos.bloco]);
    if (campos.vaga)  linhasImo.push(["Garagem", campos.vaga]);
  }
  if (campos.descricao) linhasImo.push(["Descrição", campos.descricao]);
  const end = [campos.logradouro, campos.numero ? `n.${campos.numero}` : null, campos.bairro, campos.cidade].filter(Boolean).join(", ");
  linhasImo.push(["Endereço", end || "—"]);
  if (campos.cep) linhasImo.push([pais.cepLabel, campos.cep]);
  if (campos.complemento) linhasImo.push(["Complemento", campos.complemento]);
  if (campos.loteQuadra) linhasImo.push(["Lote / Quadra", campos.loteQuadra]);
  const altImo = linhasImo.length * 7 + 6;
  doc.setFillColor(...C.fundo); doc.roundedRect(ml, y, cw, altImo, 2, 2, "F");
  linhasImo.forEach(([lbl, val], i) => par(doc, lbl, val, ml + 4, y + 7 + i * 7, 36));
  y += altImo + 5;

  // 3. Vistoria por Cômodo
  y = secao(doc, "3", "Vistoria por Cômodo", y, ml, cw);

  comodos.forEach((comodo, ci) => {
    y = novaPage(doc, y, 40);
    doc.setFillColor(...C.grafite); doc.roundedRect(ml, y, cw, 7.5, 1.5, 1.5, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.branco);
    doc.text(`${ci + 1}.  ${limpar(comodo.nome || "Cômodo")}`, ml + 5, y + 5);
    y += 11;

    const elementos = comodo.elementos || [];
    if (!elementos.length) {
      doc.setFontSize(8.5); doc.setFont("helvetica", "italic"); doc.setTextColor(...C.cinza);
      doc.text("Nenhum elemento inspecionado.", ml + 5, y + 4);
      y += 10; return;
    }

    elementos.forEach((el, ei) => {
      y = novaPage(doc, y, 48);
      doc.setFillColor(...C.cinzaBg);
      doc.roundedRect(ml + 2, y, cw - 4, 7, 1, 1, "F");
      doc.setDrawColor(...C.cinzaClaro); doc.setLineWidth(0.3);
      doc.roundedRect(ml + 2, y, cw - 4, 7, 1, 1, "S");
      doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.escuro);
      doc.text(limpar(el.nome || "Elemento"), ml + 6, y + 4.8);
      y += 10;

      let xb = ml + 5;
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.cinza);
      if (el.comprimento) { doc.text(`Comp.: ${el.comprimento} m`, xb, y); xb += doc.getTextWidth(`Comp.: ${el.comprimento} m`) + 8; }
      if (el.largura)     { doc.text(`Larg.: ${el.largura} m`, xb, y); xb += doc.getTextWidth(`Larg.: ${el.largura} m`) + 8; }
      if (el.area)        { doc.text(`Área: ${el.area} m²`, xb, y); xb += doc.getTextWidth(`Área: ${el.area} m²`) + 8; }
      if (el.status)    xb = badge(doc, statusLabel(el.status),  xb, y + 1, statusCor(el.status));
      if (el.gravidade) badge(doc, el.gravidade.toUpperCase(),    xb, y + 1, gravidadeCor(el.gravidade));
      y += 7;

      if ((el.patologias || []).length > 0) {
        y = novaPage(doc, y, 12);
        doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.vermelho);
        doc.text(`Patologias: ${el.patologias.join(" | ")}`, ml + 5, y);
        y += 6;
      }

      if (el.historicoManutencao) {
        y = novaPage(doc, y, 12);
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.grafite);
        doc.text(`Manutenção anterior: ${limpar(el.historicoTempo || "há tempo não informado")}`, ml + 5, y);
        y += 6;
      }

      if (el.observacoes) {
        y = novaPage(doc, y, 14);
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.texto);
        const linhas = doc.splitTextToSize(`Obs.: ${limpar(el.observacoes)}`, cw - 12);
        linhas.forEach((l) => { y = novaPage(doc, y, 12); doc.text(l, ml + 5, y); y += 5; });
      }

      // Fotos
      y = renderFotosElemento(doc, el, ml, cw, y);

      if (ei < elementos.length - 1) {
        doc.setDrawColor(...C.cinzaClaro); doc.setLineWidth(0.3);
        doc.line(ml + 5, y, ml + cw - 5, y); y += 5;
      } else { y += 4; }
    });
    y += 3;
  });

  // 4. Resumo
  if (relatorio.resumoVistoria) {
    y = novaPage(doc, y, 60);
    y = secao(doc, "4", "Resumo da Vistoria", y, ml, cw);
    const linhasResumo = doc.splitTextToSize(limpar(relatorio.resumoVistoria), cw - 8);
    doc.setFillColor(...C.fundo); doc.setDrawColor(...C.cinzaClaro); doc.setLineWidth(0.3);
    doc.roundedRect(ml, y, cw, Math.min(linhasResumo.length * 5.2 + 10, 120), 2, 2, "FD");
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.texto);
    let yr = y + 7;
    linhasResumo.forEach((l) => { yr = novaPage(doc, yr, 14); doc.text(l, ml + 5, yr); yr += 5.2; });
    y = yr + 8;
  }

  // 5. Condições Estruturais
  if (relatorio.condicoesEstruturais) {
    y = novaPage(doc, y, 60);
    y = secao(doc, "5", "Condições Estruturais", y, ml, cw);
    const linhasCond = doc.splitTextToSize(limpar(relatorio.condicoesEstruturais), cw - 8);
    doc.setFillColor(...C.fundo); doc.setDrawColor(...C.cinzaClaro); doc.setLineWidth(0.3);
    doc.roundedRect(ml, y, cw, Math.min(linhasCond.length * 5.2 + 10, 120), 2, 2, "FD");
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.texto);
    let yc = y + 7;
    linhasCond.forEach((l) => { yc = novaPage(doc, yc, 14); doc.text(l, ml + 5, yc); yc += 5.2; });
    y = yc + 8;
  }

  // 6. Avaliação de Riscos
  if (relatorio.avaliacaoRiscos) {
    y = novaPage(doc, y, 60);
    y = secao(doc, "6", "Avaliação de Riscos e Impactos", y, ml, cw);
    const linhasRisco = doc.splitTextToSize(limpar(relatorio.avaliacaoRiscos), cw - 8);
    doc.setFillColor(...C.fundo); doc.setDrawColor(...C.cinzaClaro); doc.setLineWidth(0.3);
    doc.roundedRect(ml, y, cw, Math.min(linhasRisco.length * 5.2 + 10, 120), 2, 2, "FD");
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.texto);
    let yri = y + 7;
    linhasRisco.forEach((l) => { yri = novaPage(doc, yri, 14); doc.text(l, ml + 5, yri); yri += 5.2; });
    y = yri + 8;
  }

  // 7. Parecer Final
  if (relatorio.parecerFinal) {
    y = novaPage(doc, y, 60);
    y = secao(doc, "7", "Parecer Técnico Final", y, ml, cw);
    const parecerLimpo = limpar(relatorio.parecerFinal);
    const linhasParecer = doc.splitTextToSize(parecerLimpo, cw - 8);
    doc.setFillColor(...C.fundo); doc.setDrawColor(...C.cinzaClaro); doc.setLineWidth(0.3);
    doc.roundedRect(ml, y, cw, Math.min(linhasParecer.length * 5.2 + 10, 140), 2, 2, "FD");
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.texto);
    let yp = y + 7;
    linhasParecer.forEach((l) => { yp = novaPage(doc, yp, 14); doc.text(l, ml + 5, yp); yp += 5.2; });
    y = yp + 8;
  }

  // 8. Anexo Termográfico
  if (relatorio.termograficoPdf?.base64) {
    doc.addPage(); y = 24;
    y = secao(doc, "8", "Relatório Termográfico — Anexo", y, ml, cw);
    doc.setFillColor(...C.fundo); doc.roundedRect(ml, y, cw, 20, 2, 2, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.texto);
    doc.text(`O relatório termográfico "${limpar(relatorio.termograficoPdf.nome)}" foi anexado digitalmente a este documento.`, ml + 4, y + 8);
    doc.text("Consulte o arquivo PDF completo para visualizar as imagens termográficas.", ml + 4, y + 15);
    y += 28;
  }

  // A. Assinatura
  y = secaoAssinatura(doc, relatorio, cli, pais, ml, cw, y);

  // T. Termos
  secaoDisclaimers(doc, ml, cw, y);

  rodape(doc, cli.nome);
  const nome = gerarNomeArquivo(cli, tipo);
  doc.save(nome);
  return nome;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export async function gerarPDF(relatorio, tipo = "pessoa") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  if (tipo === "empresa") {
    return await gerarPDFBusiness(doc, relatorio, tipo);
  }
  return await gerarPDFCondominio(doc, relatorio, tipo);
}
