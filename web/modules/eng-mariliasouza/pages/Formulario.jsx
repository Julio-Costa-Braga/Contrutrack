import { useState, useRef, useEffect } from "react";
import Header, { PAISES } from "../components/Header";
import ImovelForm   from "../components/ImovelForm";
import ComodoCard   from "../components/ComodoCard";
import ParecerFinal from "../components/ParecerFinal";
import Assinatura   from "../components/Assinatura";
import Toolbar      from "../components/Toolbar";
import RelatoriosGerados from "../components/RelatoriosGerados";
import { useRelatorio }    from "../hooks/useRelatorio";
import { useAutoSave }     from "../hooks/useAutoSave";
import { gerarPDF }        from "../pdf/gerarPDF";
import { gerarCondicoesEstruturais, gerarParecerTecnico, gerarResumoVistoria } from "../utils/gerarTextoAuto";

export default function Formulario() {
  const {
    relatorio,
    atualizar,
    adicionarComodo,
    removerComodo,
    atualizarComodo,
    novoRelatorio,
    carregarRelatorio,
    salvarRelatorioNoHistorico,
  } = useRelatorio();

  const { ultimoSalvo } = useAutoSave(relatorio);
  const [novoNomeComodo, setNovoNomeComodo] = useState("");
  const [tipoRelatorio, setTipoRelatorio] = useState(relatorio.tipoRelatorio || "pessoa");
  const [relatoriosGerados, setRelatoriosGerados] = useState([]);
  const [modalRelatoriosAberto, setModalRelatoriosAberto] = useState(false);
  const inputPdfRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("relatorios_gerados");
      if (saved) setRelatoriosGerados(JSON.parse(saved));
    } catch {}
  }, []);

  const isEmpresa = tipoRelatorio === "empresa";

  function handleAdicionarComodo() {
    const nome = novoNomeComodo.trim() || "Novo Cômodo";
    adicionarComodo(nome);
    setNovoNomeComodo("");
  }

  function trocarTipoRelatorio(tipo) {
    setTipoRelatorio(tipo);
    atualizar("tipoRelatorio", tipo);
  }

  function montarEndereco(imovel) {
    if (!imovel?.campos) return "";
    const c = imovel.campos;
    const partes = [];
    if (c.logradouro) partes.push(c.logradouro);
    if (c.numero) partes.push(`n.${c.numero}`);
    if (c.bairro) partes.push(c.bairro);
    if (c.cidade) partes.push(c.cidade);
    if (c.cep) partes.push(c.cep);
    if (c.complemento) partes.push(c.complemento);
    return partes.join(", ");
  }

  function handleUploadPdf(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      atualizar("termograficoPdf", { nome: file.name, base64: ev.target.result });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function removerPdf() {
    atualizar("termograficoPdf", { nome: "", base64: "" });
  }

  async function handleGerarPDF(tipo) {
    try {
      const nomeArquivo = await gerarPDF(relatorio, tipo || tipoRelatorio);
      if (nomeArquivo) {
        salvarRelatorioNoHistorico(nomeArquivo, tipo || tipoRelatorio);
        try {
          const saved = localStorage.getItem("relatorios_gerados");
          if (saved) setRelatoriosGerados(JSON.parse(saved));
        } catch {}
      }
    } catch (err) {
      alert("Erro ao gerar PDF: " + err.message);
    }
  }

  async function handleDownloadRelatorio(id, tipo) {
    try {
      let dados = relatorio;
      if (id) {
        const snap = localStorage.getItem(`relatorio_${id}`);
        if (snap) {
          const snapshot = JSON.parse(snap);
          // Mescla fotos do formulário atual se o snapshot estiver sem
          if (dados.comodos && snapshot.comodos) {
            snapshot.comodos = snapshot.comodos.map((c, i) => {
              const atual = dados.comodos.find((dc) => dc.id === c.id) || dados.comodos[i];
              if (atual) {
                c.elementos = c.elementos.map((el, j) => {
                  const elAtual = (atual.elementos || []).find((de) => de.id === el.id) || atual.elementos?.[j];
                  const temFotosSnapshot = (el.fotos?.situacao || []).filter(Boolean).length > 0 || (el.fotos?.termografica || []).filter(Boolean).length > 0;
                  if (elAtual?.fotos && !temFotosSnapshot) {
                    el.fotos = elAtual.fotos;
                  }
                  return el;
                });
              }
              return c;
            });
          }
          dados = snapshot;
        }
      }
      await gerarPDF(dados, tipo || tipoRelatorio);
    } catch (err) {
      alert("Erro ao gerar PDF: " + err.message);
    }
  }

  function handleSalvarRelatorio() {
    const tipo = tipoRelatorio;
    const clienteNome = relatorio.cliente?.nome || "Sem nome";
    const agora = new Date();
    const dataStr = agora.toISOString().split("T")[0];
    const horaStr = String(agora.getHours()).padStart(2,'0') + "h" + String(agora.getMinutes()).padStart(2,'0');
    const nomeArquivo = `${tipo === "empresa" ? "Empresa" : tipo === "condominio" ? "Condominio" : "PessoaFisica"}_${clienteNome}_${dataStr}_${horaStr}`;
    const tipoCliente = relatorio.cliente?.tipoCliente || "pessoa";
    const id = Date.now().toString();
    const novoRegistro = { id, nomeArquivo, tipo, data: agora.toISOString(), clienteNome, tipoCliente };

    // Salva snapshot tentando manter as fotos e assinatura; se exceder o limite, salva sem eles
    try {
      const snapshot = JSON.parse(JSON.stringify(relatorio));
      localStorage.setItem(`relatorio_${id}`, JSON.stringify(snapshot));
    } catch (e) {
      // QuotaExceededError — salva sem fotos e assinatura
      try {
        const snapshot = JSON.parse(JSON.stringify(relatorio));
        if (snapshot.comodos) {
          for (const c of snapshot.comodos) {
            for (const el of c.elementos || []) {
              if (el.fotos) {
                if (el.fotos.situacao) el.fotos.situacao = [];
                if (el.fotos.termografica) el.fotos.termografica = [];
              }
            }
          }
        }
        snapshot.termograficoPdf = { nome: "", base64: "" };
        snapshot.assinatura = "";
        localStorage.setItem(`relatorio_${id}`, JSON.stringify(snapshot));
      } catch (e2) { console.warn("Snapshot too large even without photos"); }
    }

    const historico = JSON.parse(localStorage.getItem("relatorios_gerados") || "[]");
    const novoHistorico = [novoRegistro, ...historico].slice(0, 50);
    localStorage.setItem("relatorios_gerados", JSON.stringify(novoHistorico));
    setRelatoriosGerados(novoHistorico);
  }

  return (
    <div className="pagina">
      <Toolbar
        relatorio={relatorio}
        onCarregar={carregarRelatorio}
        onNovo={novoRelatorio}
        onVerRelatorios={() => setModalRelatoriosAberto(true)}
        ultimoSalvo={ultimoSalvo}
      />

      <div className="conteudo">
        <div className="titulo-pagina">
          <h1>Sistema de Relatório Técnico</h1>
          <p>{isEmpresa ? "Relatório técnico completo para empresas." : "Relatório simplificado para pessoa física / condomínio."}</p>
        </div>

        <RelatoriosGerados
          aberto={modalRelatoriosAberto}
          onFechar={() => setModalRelatoriosAberto(false)}
          onEditar={(id) => {
            try {
              const snap = localStorage.getItem(`relatorio_${id}`);
              if (snap) {
                const dados = JSON.parse(snap);
                // Preserva fotos do formulário atual (evita corromper)
                if (relatorio.comodos) {
                  dados.comodos = dados.comodos.map((c, i) => {
                    const atual = relatorio.comodos[i];
                    if (atual) {
                      c.elementos = c.elementos.map((el, j) => {
                        const elAtual = atual.elementos?.[j];
                        if (elAtual?.fotos) el.fotos = elAtual.fotos;
                        return el;
                      });
                    }
                    return c;
                  });
                }
                carregarRelatorio(dados);
              }
            } catch {}
            setModalRelatoriosAberto(false);
          }}
          relatorioAtual={relatorio}
          onDownloadRelatorio={handleDownloadRelatorio}
        />

        {/* 1. Dados do cliente */}
        <Header dados={relatorio.cliente} onChange={(v) => atualizar("cliente", v)} />

        {/* Seletor de tipo abaixo dos dados do cliente */}
        <section className="secao">
          <h2 className="secao-titulo">📄 Tipo de Relatório</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button"
              className={`btn-tipo-relatorio ${tipoRelatorio === "pessoa" ? "ativo" : ""}`}
              onClick={() => trocarTipoRelatorio("pessoa")}>
              👤 Pessoa Física
            </button>
            <button type="button"
              className={`btn-tipo-relatorio ${tipoRelatorio === "condominio" ? "ativo" : ""}`}
              onClick={() => trocarTipoRelatorio("condominio")}>
              🏢 Condomínio
            </button>
            <button type="button"
              className={`btn-tipo-relatorio ${isEmpresa ? "ativo" : ""}`}
              onClick={() => trocarTipoRelatorio("empresa")}>
              💼 Empresa
            </button>
          </div>
          {!isEmpresa && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "#f0f9ff", borderRadius: 8, fontSize: 13, color: "#0369a1" }}>
              Modo simplificado. Apenas campos essenciais para pessoa física / condomínio.
            </div>
          )}
          {isEmpresa && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "#fef2f2", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>
              Modo completo. Todos os campos técnicos disponíveis para empresas e laudos detalhados.
            </div>
          )}
        </section>

        {/* 2. Dados do imóvel */}
        <ImovelForm dados={relatorio.imovel} onChange={(v) => atualizar("imovel", v)}
          paisCodigo={relatorio.cliente?.paisCodigo} />

        {/* 3. Cômodos */}
        <section className="secao">
          <h2 className="secao-titulo">🔍 Vistoria por Cômodo</h2>

          {!isEmpresa && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, fontSize: 13, color: "#64748b" }}>
              Registe apenas os problemas encontrados em cada cômodo. Foque no essencial para o condomínio.
            </div>
          )}

          {relatorio.comodos.length === 0 && (
            <div className="estado-vazio" style={{ marginBottom: 20 }}>
              Nenhum cômodo adicionado. Adicione abaixo para começar a vistoria.
            </div>
          )}

          {relatorio.comodos.map((comodo) => (
            <ComodoCard
              key={comodo.id}
              comodo={comodo}
              onChange={(dados) => atualizarComodo(comodo.id, dados)}
              onRemover={() => removerComodo(comodo.id)}
              simplificado={!isEmpresa}
            />
          ))}

          <div className="adicionar-comodo">
            <input type="text"
              placeholder="Nome do cômodo (ex: Sala de Estar, Suíte Master, Cozinha...)"
              value={novoNomeComodo}
              onChange={(e) => setNovoNomeComodo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdicionarComodo()} />
            <button type="button" className="btn-adicionar-comodo" onClick={handleAdicionarComodo}>
              + Adicionar Cômodo
            </button>
          </div>
        </section>

        {/* 4. Resumo da Vistoria */}
        <section className="secao">
          <h2 className="secao-titulo">📋 Resumo da Vistoria</h2>
          <div className="campo">
            <textarea rows={4}
              placeholder="Descreva um resumo geral da vistoria realizada..."
              value={relatorio.resumoVistoria || ""}
              onChange={(e) => atualizar("resumoVistoria", e.target.value)}
              style={{ resize: "vertical" }} />
            <button type="button" onClick={() => {
              const texto = gerarResumoVistoria(relatorio);
              if (texto) atualizar("resumoVistoria", texto);
            }}>Gerar automaticamente</button>
          </div>
        </section>

        {/* 5. Condições Estruturais (apenas Empresa) */}
        {isEmpresa && (
          <section className="secao">
            <h2 className="secao-titulo">🏗️ Condições Estruturais</h2>
            <div className="campo">
              <textarea rows={4}
                placeholder="Descreva as condições estruturais do imóvel (fundações, pilares, lajes, vigas...)"
                value={relatorio.condicoesEstruturais || ""}
                onChange={(e) => atualizar("condicoesEstruturais", e.target.value)}
                style={{ resize: "vertical" }} />
              <button type="button" onClick={() => {
                const texto = gerarCondicoesEstruturais(relatorio.comodos);
                if (texto) atualizar("condicoesEstruturais", texto);
              }}
                style={{ marginTop: 8, padding: "6px 14px", border: "1px solid #2563eb", borderRadius: 6, background: "#eff6ff", color: "#2563eb", fontSize: 12, cursor: "pointer" }}>
                Gerar automaticamente
              </button>
            </div>
          </section>
        )}

        {/* 6. Avaliação de Riscos (apenas Empresa) */}
        {isEmpresa && (
          <section className="secao">
            <h2 className="secao-titulo">⚠️ Avaliação de Riscos e Impactos</h2>
            <div className="campo">
              <textarea rows={4}
                placeholder="Descreva os riscos e impactos identificados (estruturais, elétricos, à saúde...)"
                value={relatorio.avaliacaoRiscos || ""}
                onChange={(e) => atualizar("avaliacaoRiscos", e.target.value)}
                style={{ resize: "vertical" }} />
            </div>
          </section>
        )}

        {/* 7. Relatório Termográfico */}
        <section className="secao">
          <h2 className="secao-titulo">🌡️ Relatório Termográfico</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
            Anexe o PDF do relatório da câmara termográfica para ser incluído como anexo no relatório final.
          </p>
          {relatorio.termograficoPdf?.base64 ? (
            <div style={{
              background: "#f0fdf4", border: "1.5px solid #86efac",
              borderRadius: 8, padding: "12px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>
                PDF anexado: {relatorio.termograficoPdf.nome}
              </span>
              <button type="button" onClick={removerPdf}
                style={{ padding: "6px 14px", border: "1.5px solid #fca5a5", borderRadius: 6, background: "#fef2f2", color: "#dc2626", fontSize: 12, cursor: "pointer" }}>
                Remover
              </button>
            </div>
          ) : (
            <div>
              <button type="button" onClick={() => inputPdfRef.current?.click()}
                style={{
                  padding: "14px 24px", border: "2px dashed #cbd5e1", borderRadius: 8,
                  background: "#f8fafc", color: "#64748b", fontSize: 13, cursor: "pointer",
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor="#2563eb"; e.currentTarget.style.color="#2563eb"; e.currentTarget.style.background="#eff6ff"; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor="#cbd5e1"; e.currentTarget.style.color="#64748b"; e.currentTarget.style.background="#f8fafc"; }}>
                Selecionar PDF do Relatório Termográfico
              </button>
              <input ref={inputPdfRef} type="file" accept=".pdf,application/pdf"
                style={{ display: "none" }} onChange={handleUploadPdf} />
            </div>
          )}
        </section>

        {/* 8. Parecer final */}
        <ParecerFinal texto={relatorio.parecerFinal} onChange={(v) => atualizar("parecerFinal", v)} dataVistoria={relatorio.cliente?.dataVistoria} enderecoCompleto={montarEndereco(relatorio.imovel)} />
        {isEmpresa && (
          <div style={{ textAlign: "right", marginTop: -12, marginBottom: 12 }}>
            <button type="button" onClick={() => {
              const texto = gerarParecerTecnico(relatorio);
              if (texto) atualizar("parecerFinal", texto);
            }}
              style={{ padding: "6px 14px", border: "1px solid #2563eb", borderRadius: 6, background: "#eff6ff", color: "#2563eb", fontSize: 12, cursor: "pointer" }}>
              Gerar Parecer Técnico automaticamente
            </button>
          </div>
        )}

        {/* 9. Assinatura */}
        <Assinatura
          assinatura={relatorio.assinatura}
          onChange={(v) => atualizar("assinatura", v)}
          dadosCliente={relatorio.cliente}
          onUpdateCliente={(campo, valor) => atualizar("cliente", { ...relatorio.cliente, [campo]: valor })}
          pais={PAISES.find((p) => p.codigo === relatorio.cliente?.paisCodigo)}
        />

        {/* Botões finais */}
        <div style={{ textAlign: "center", padding: "24px 0 48px" }}>
          <button type="button" onClick={() => { handleSalvarRelatorio(); setModalRelatoriosAberto(true); }}
            style={{ padding: "14px 48px", border: "none", borderRadius: 10, background: "#1e293b", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
            Gerar Relatório
          </button>
        </div>
      </div>
    </div>
  );
}
