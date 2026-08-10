const NOME_PATOLOGIAS = {
  infiltracao: "Infiltração / Umidade",
  fissura: "Fissura / Trinca / Rachadura",
  desplacamento: "Desplacamento de Revestimento",
  mofo: "Mofo / Bolor",
  oxidacao: "Oxidação / Corrosão",
  caimento: "Caimento inadequado",
  prumo: "Fora de Prumo / Nível",
  eflorescencia: "Eflorescência",
  pintura: "Pintura danificada",
  vidro: "Vidro riscado / quebrado",
};

const GRAV_LABEL = { leve: "LEVE", moderada: "MODERADA", critica: "CRÍTICA" };
const STATUS_LABEL = { conforme: "CONFORME", nao_conforme: "NÃO CONFORME", nao_observado: "NÃO OBSERVADO" };

function patologiasTexto(ids) {
  return ids.map((id) => NOME_PATOLOGIAS[id] || id).join(", ");
}

export function gerarResumoVistoria(relatorio) {
  const { cliente, imovel, comodos } = relatorio;
  if (!comodos || comodos.length === 0) return "";

  let totalEls = 0;
  const naoConformes = [];
  const patologiasSet = new Set();

  for (const comodo of comodos) {
    for (const el of comodo.elementos || []) {
      totalEls++;
      if (el.status === "nao_conforme") {
        naoConformes.push({ comodo: comodo.nome, el });
        for (const pid of el.patologias || []) {
          patologiasSet.add(NOME_PATOLOGIAS[pid] || pid);
        }
      }
    }
  }

  const linhas = [];
  const data = cliente?.dataVistoria || "N/I";
  const tipoImovel = imovel?.tipo ? ` ${imovel.tipo}` : "";
  const nomeCliente = cliente?.nome || "N/I";

  linhas.push(`Foi realizada vistoria técnica${tipoImovel} do(a) ${nomeCliente} em ${data}, abrangendo ${comodos.length} cômodo(s).`);
  linhas.push("");

  if (totalEls > 0) {
    const conformes = totalEls - naoConformes.length;
    linhas.push(`No total, foram vistoriados ${totalEls} elemento(s), dos quais ${conformes} em conformidade e ${naoConformes.length} com não conformidades.`);
  }

  if (patologiasSet.size > 0) {
    linhas.push("");
    linhas.push(`As principais patologias observadas foram: ${[...patologiasSet].join(", ")}.`);
  }

  if (naoConformes.length > 0) {
    linhas.push("");
    linhas.push("Os itens mais relevantes incluem:");
    for (const item of naoConformes) {
      const pats = patologiasTexto(item.el.patologias || []);
      const grav = GRAV_LABEL[item.el.gravidade] || "";
      linhas.push(`- ${item.comodo} / ${item.el.nome}${pats ? `: ${pats}` : ""}${grav ? ` (${grav})` : ""}`);
    }
  }

  linhas.push("");
  linhas.push("O presente relatório detalha as condições observadas, as patologias identificadas e as recomendações técnicas cabíveis para cada situação.");

  return linhas.join("\n");
}

export function gerarCondicoesEstruturais(comodos) {
  if (!comodos || comodos.length === 0) return "";
  const partes = [];
  for (const comodo of comodos) {
    const els = comodo.elementos || [];
    const estruturais = els.filter((e) =>
      ["teto", "parede", "piso", "forro", "rodape"].includes(e.tipo)
    );
    if (estruturais.length === 0) continue;
    const sub = [`Cômodo: ${comodo.nome}.`];
    for (const el of estruturais) {
      const pats = el.patologias || [];
      const status = STATUS_LABEL[el.status] || el.status;
      const grav = GRAV_LABEL[el.gravidade] || "";
      let linha = `${el.nome}: status ${status}.`;
      if (pats.length > 0) linha += ` Patologias identificadas: ${patologiasTexto(pats)}.`;
      if (grav) linha += ` Gravidade: ${grav}.`;
      if (el.observacoes) linha += ` Obs.: ${el.observacoes}.`;
      sub.push(linha);
    }
    partes.push(sub.join("\n"));
  }
  if (partes.length === 0) return "";
  return (
    "Durante a vistoria, foram analisadas as condições estruturais dos seguintes ambientes:\n\n" +
    partes.join("\n\n") +
    "\n\nRecomenda-se a adoção das medidas corretivas apontadas para cada não conformidade identificada, priorizando os itens de gravidade crítica e moderada."
  );
}

export function gerarParecerTecnico(relatorio) {
  const { cliente, imovel, comodos, resumoVistoria, condicoesEstruturais, avaliacaoRiscos } = relatorio;
  if (!comodos || comodos.length === 0) return "";

  const criticos = [];
  const moderados = [];
  const leves = [];
  const conformes = [];
  const naoObservados = [];

  for (const comodo of comodos) {
    for (const el of comodo.elementos || []) {
      const item = { comodo: comodo.nome, el };
      if (el.status === "conforme") conformes.push(item);
      else if (el.status === "nao_observado") naoObservados.push(item);
      else if (el.status === "nao_conforme") {
        if (el.gravidade === "critica") criticos.push(item);
        else if (el.gravidade === "moderada") moderados.push(item);
        else leves.push(item);
      }
    }
  }

  const linhas = [];

  linhas.push("PARECER TÉCNICO DE VISTORIA PREDIAL");
  linhas.push("");
  if (cliente?.nome) linhas.push(`Cliente: ${cliente.nome}`);
  linhas.push(`Data da vistoria: ${cliente?.dataVistoria || "N/I"}`);
  if (imovel?.tipo) linhas.push(`Tipo de imóvel: ${imovel.tipo}`);
  linhas.push("");

  if (criticos.length > 0) {
    linhas.push("1. ITENS DE GRAVIDADE CRÍTICA — EXIGEM INTERVENÇÃO IMEDIATA");
    linhas.push("");
    for (const item of criticos) {
      const pats = patologiasTexto(item.el.patologias || []);
      linhas.push(`- ${item.comodo} / ${item.el.nome}: ${pats || "Não conformidade identificada."}`);
      if (item.el.observacoes) linhas.push(`  ${item.el.observacoes}`);
    }
    linhas.push("");
  }

  if (moderados.length > 0) {
    linhas.push("2. ITENS DE GRAVIDADE MODERADA — REQUEREM ACOMPANHAMENTO");
    linhas.push("");
    for (const item of moderados) {
      const pats = patologiasTexto(item.el.patologias || []);
      linhas.push(`- ${item.comodo} / ${item.el.nome}: ${pats || "Não conformidade identificada."}`);
      if (item.el.observacoes) linhas.push(`  ${item.el.observacoes}`);
    }
    linhas.push("");
  }

  if (leves.length > 0) {
    linhas.push("3. ITENS DE GRAVIDADE LEVE — RECOMENDA-SE MONITORAMENTO");
    linhas.push("");
    for (const item of leves) {
      const pats = patologiasTexto(item.el.patologias || []);
      linhas.push(`- ${item.comodo} / ${item.el.nome}: ${pats || "Não conformidade identificada."}`);
    }
    linhas.push("");
  }

  if (conformes.length > 0) {
    linhas.push(`4. ITENS EM CONFORMIDADE — ${conformes.length} elemento(s) vistoriado(s) sem não conformidades.`);
    linhas.push("");
  }

  if (resumoVistoria) {
    linhas.push("5. RESUMO DA VISTORIA");
    linhas.push("");
    linhas.push(resumoVistoria);
    linhas.push("");
  }

  if (condicoesEstruturais) {
    linhas.push("6. CONDIÇÕES ESTRUTURAIS");
    linhas.push("");
    linhas.push(condicoesEstruturais);
    linhas.push("");
  }

  if (avaliacaoRiscos) {
    linhas.push("7. AVALIAÇÃO DE RISCOS E IMPACTOS");
    linhas.push("");
    linhas.push(avaliacaoRiscos);
    linhas.push("");
  }

  const totalNC = criticos.length + moderados.length + leves.length;
  const total = criticos.length + moderados.length + leves.length + conformes.length + naoObservados.length;
  linhas.push("8. CONCLUSÃO");
  linhas.push("");
  linhas.push(
    `Foram vistoriados ${total} elemento(s), dos quais ${conformes.length} em conformidade, ` +
    `${totalNC} com não conformidades (${criticos.length} crítica(s), ${moderados.length} moderada(s), ` +
    `${leves.length} leve(s)) e ${naoObservados.length} não observado(s).`
  );
  if (criticos.length > 0) {
    linhas.push(
      "Recomenda-se intervenção imediata nos itens de gravidade crítica para garantir a segurança e " +
      "a integridade estrutural do imóvel."
    );
  }
  linhas.push("");
  linhas.push("Este parecer técnico foi elaborado com base nas informações coletadas durante a vistoria " +
    "in loco, fotografias e análise documental, refletindo as condições observadas na data da inspeção.");

  return linhas.join("\n");
}
