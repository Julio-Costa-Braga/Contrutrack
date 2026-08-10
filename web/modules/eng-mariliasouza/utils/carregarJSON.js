/**
 * Abre um seletor de arquivo e carrega um rascunho .json salvo anteriormente.
 * Retorna uma Promise com os dados do relatório.
 */
export function carregarJSON() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
      const arquivo = e.target.files[0];
      if (!arquivo) return reject(new Error("Nenhum arquivo selecionado"));

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const dados = JSON.parse(ev.target.result);
          resolve(dados);
        } catch {
          reject(new Error("Arquivo inválido. Selecione um arquivo de vistoria .json"));
        }
      };
      reader.onerror = () => reject(new Error("Erro ao ler o arquivo"));
      reader.readAsText(arquivo);
    };

    input.click();
  });
}
