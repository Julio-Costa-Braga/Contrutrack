import { useState, useCallback } from "react";

const ESTADO_INICIAL = {
  tipoRelatorio: "pessoa",

  cliente: {
    nome: "",
    cpfCnpj: "",
    telefone: "",
    ddd: "",
    email: "",
    art: "",
    paisCodigo: "BR",
    dataVistoria: new Date().toISOString().split("T")[0],
    numeroPedido: "",
  },

  imovel: {
    tipo: "",
    campos: {},
  },

  comodos: [],

  resumoVistoria: "",
  condicoesEstruturais: "",
  avaliacaoRiscos: "",
  parecerFinal: "",

  assinatura: "",

  termograficoPdf: { nome: "", base64: "" },

  relatoriosSalvos: [],
};

export function useRelatorio() {
  const [relatorio, setRelatorio] = useState(ESTADO_INICIAL);

  const atualizar = useCallback((bloco, valor) => {
    setRelatorio((prev) => ({
      ...prev,
      [bloco]: typeof valor === "object" && !Array.isArray(valor)
        ? { ...prev[bloco], ...valor }
        : valor,
    }));
  }, []);

  const adicionarComodo = useCallback((nome = "Novo Cômodo") => {
    const novoComodo = {
      id: Date.now().toString(),
      nome,
      elementos: [],
    };
    setRelatorio((prev) => ({
      ...prev,
      comodos: [...prev.comodos, novoComodo],
    }));
  }, []);

  const removerComodo = useCallback((id) => {
    setRelatorio((prev) => ({
      ...prev,
      comodos: prev.comodos.filter((c) => c.id !== id),
    }));
  }, []);

  const atualizarComodo = useCallback((id, novosDados) => {
    setRelatorio((prev) => ({
      ...prev,
      comodos: prev.comodos.map((c) =>
        c.id === id ? { ...c, ...novosDados } : c
      ),
    }));
  }, []);

  const novoRelatorio = useCallback(() => {
    if (window.confirm("Iniciar novo relatório? Os dados não salvos serão perdidos.")) {
      setRelatorio({
        ...ESTADO_INICIAL,
        dataVistoria: new Date().toISOString().split("T")[0],
      });
    }
  }, []);

  const carregarRelatorio = useCallback((dados) => {
    setRelatorio(dados);
  }, []);

  const salvarRelatorioNoHistorico = useCallback((nomeArquivo, tipo) => {
    setRelatorio((prev) => {
      const novoRegistro = {
        id: Date.now().toString(),
        nomeArquivo,
        tipo,
        data: new Date().toISOString(),
      };
      // Máximo 100 registros salvos
      const historico = [novoRegistro, ...(prev.relatoriosSalvos || [])].slice(0, 100);
      try {
        localStorage.setItem("relatorios_gerados", JSON.stringify(historico));
      } catch {}
      return { ...prev, relatoriosSalvos: historico };
    });
  }, []);

  return {
    relatorio,
    atualizar,
    adicionarComodo,
    removerComodo,
    atualizarComodo,
    novoRelatorio,
    carregarRelatorio,
    salvarRelatorioNoHistorico,
  };
}
