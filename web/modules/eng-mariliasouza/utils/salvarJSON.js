export function salvarJSON(relatorio) {
  const nomeCliente = relatorio?.cliente?.nome?.trim() || "sem-nome";
  const agora = new Date();
  const data = agora.toISOString().split("T")[0];
  const hora = agora.toTimeString().split(":").slice(0, 2).join("h");
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const ano = agora.getFullYear();
  const nomeArquivo = `Relatorio_${nomeCliente.replace(/\s+/g, "_")}_${data}_${hora}.json`;

  const blob = new Blob(
    [JSON.stringify(relatorio, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}
