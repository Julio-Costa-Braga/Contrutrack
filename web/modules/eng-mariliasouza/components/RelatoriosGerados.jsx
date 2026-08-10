import { useState, useEffect } from "react";

const STORAGE_KEY = "relatorios_gerados";
const PASTAS_KEY = "relatorios_pastas";

function formatarData(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-PT") + " " + d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function obterMesAno(iso) {
  const d = new Date(iso);
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${meses[d.getMonth()]} ${d.getFullYear()}`;
}

function carregarHistorico() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function carregarPastas() {
  try {
    const raw = localStorage.getItem(PASTAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function salvarPastas(pastas) {
  localStorage.setItem(PASTAS_KEY, JSON.stringify(pastas));
}

export default function RelatoriosGerados({ aberto, onFechar, onEditar, relatorioAtual, onDownloadRelatorio }) {
  const [relatorios, setRelatorios] = useState([]);
  const [pastas, setPastas] = useState([]);
  const [pastaAtiva, setPastaAtiva] = useState(null);
  const [novaPasta, setNovaPasta] = useState("");
  const [excluindo, setExcluindo] = useState(null);

  useEffect(() => {
    if (aberto) {
      setRelatorios(carregarHistorico());
      setPastas(carregarPastas());
    }
  }, [aberto]);

  function criarPasta() {
    const nome = novaPasta.trim();
    if (!nome || pastas.find((p) => p.nome === nome)) return;
    const nova = { id: Date.now().toString(), nome, criadoEm: new Date().toISOString() };
    const atualizadas = [...pastas, nova];
    setPastas(atualizadas);
    salvarPastas(atualizadas);
    setNovaPasta("");
  }

  function removerPasta(id) {
    const atualizadas = pastas.filter((p) => p.id !== id);
    setPastas(atualizadas);
    salvarPastas(atualizadas);
    if (pastaAtiva === id) setPastaAtiva(null);
  }

  function associarPasta(relatorioId, pastaId) {
    const atualizados = relatorios.map((r) =>
      r.id === relatorioId ? { ...r, pasta: pastaId } : r
    );
    setRelatorios(atualizados);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
  }

  function excluirRelatorio(id) {
    if (excluindo === id) {
      const atualizados = relatorios.filter((r) => r.id !== id);
      setRelatorios(atualizados);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
      try { localStorage.removeItem(`relatorio_${id}`); } catch {}
      setExcluindo(null);
    } else {
      setExcluindo(id);
    }
  }

  function filtrarPorPasta() {
    if (!pastaAtiva) return relatorios;
    return relatorios.filter((r) => r.pasta === pastaAtiva);
  }

  function agruparPorMes(lista) {
    const grupos = {};
    lista.forEach((r) => {
      const chave = obterMesAno(r.data);
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(r);
    });
    return Object.entries(grupos).sort((a, b) => {
      const [mA, aA] = a[0].split(" ");
      const [mB, aB] = b[0].split(" ");
      return aB.localeCompare(aA);
    });
  }

  if (!aberto) return null;

  const listaFiltrada = filtrarPorPasta();
  const grupos = agruparPorMes(listaFiltrada);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, width: "100%", maxWidth: 780,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Relatórios Gerados</h2>
          <button onClick={onFechar} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8" }}>X</button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Sidebar: Pastas */}
          <div style={{
            width: 200, borderRight: "1px solid #e2e8f0", padding: 16,
            display: "flex", flexDirection: "column", gap: 8, flexShrink: 0,
            background: "#f8fafc",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pastas</div>

            <button onClick={() => setPastaAtiva(null)}
              style={{
                textAlign: "left", padding: "8px 10px", borderRadius: 6,
                border: "none", cursor: "pointer",
                background: !pastaAtiva ? "#1e293b" : "transparent",
                color: !pastaAtiva ? "#fff" : "#475569",
                fontSize: 13, fontWeight: !pastaAtiva ? 600 : 400,
              }}>
              Todos os relatórios
            </button>

            {pastas.map((p) => (
              <div key={p.id} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button onClick={() => setPastaAtiva(p.id)}
                  style={{
                    flex: 1, textAlign: "left", padding: "8px 10px", borderRadius: 6,
                    border: "none", cursor: "pointer",
                    background: pastaAtiva === p.id ? "#1e293b" : "transparent",
                    color: pastaAtiva === p.id ? "#fff" : "#475569",
                    fontSize: 13, fontWeight: pastaAtiva === p.id ? 600 : 400,
                  }}>
                  {p.nome}
                </button>
                <button onClick={() => removerPasta(p.id)}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, padding: 4 }}>
                  x
                </button>
              </div>
            ))}

            <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
              <input type="text" value={novaPasta}
                onChange={(e) => setNovaPasta(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && criarPasta()}
                placeholder="Nova pasta..."
                style={{
                  flex: 1, padding: "6px 8px", border: "1.5px solid #e2e8f0",
                  borderRadius: 6, fontSize: 12, outline: "none",
                }} />
              <button onClick={criarPasta}
                style={{
                  padding: "6px 10px", border: "none", borderRadius: 6,
                  background: "#1e293b", color: "#fff", fontSize: 12, cursor: "pointer",
                }}>
                +
              </button>
            </div>
          </div>

          {/* Lista de relatórios */}
          <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
            {grupos.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 }}>
                Nenhum relatório encontrado.
              </div>
            ) : (
              grupos.map(([mes, lista]) => (
                <div key={mes} style={{ marginBottom: 20 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: "#64748b",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    marginBottom: 8, padding: "4px 8px", background: "#f1f5f9",
                    borderRadius: 4,
                  }}>
                    {mes} <span style={{ fontWeight: 400, color: "#94a3b8" }}>({lista.length})</span>
                  </div>
                  {lista.map((r) => (
                    <div key={r.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 12px", borderRadius: 8,
                      border: "1px solid #e2e8f0", marginBottom: 4,
                      background: "#fff",
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                          {r.clienteNome || r.nomeArquivo}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{formatarData(r.data)}</span>
                          <span style={{
                            padding: "1px 6px", borderRadius: 3,
                            background: r.tipo === "empresa" ? "#1e293b" : "#2563eb",
                            color: "#fff", fontSize: 10, fontWeight: 600,
                          }}>
                            {{ condominio: "Condomínio", pessoa: "Pessoa Física", empresa: "Empresa" }[r.tipoCliente || r.tipo] || "—"}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0, marginLeft: 12 }}>
                        <select value={r.pasta || ""} onChange={(e) => associarPasta(r.id, e.target.value)}
                          style={{
                            padding: "4px 6px", border: "1.5px solid #e2e8f0",
                            borderRadius: 4, fontSize: 11, background: "#fff",
                            cursor: "pointer", maxWidth: 90,
                          }}>
                          <option value="">Pasta</option>
                          {pastas.map((p) => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                          ))}
                        </select>

                        <button onClick={() => onEditar?.(r.id)}
                          style={{
                            padding: "5px 10px", border: "1.5px solid #cbd5e1", borderRadius: 5,
                            background: "#fff", color: "#475569", fontSize: 11,
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}>
                          Editar
                        </button>

                        <button onClick={() => onDownloadRelatorio?.(r.id, r.tipo)}
                          style={{
                            padding: "5px 10px", border: "none", borderRadius: 5,
                            background: "#2563eb", color: "#fff", fontSize: 11,
                            cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap",
                          }}>
                          Descarregar
                        </button>

                        <button onClick={() => excluirRelatorio(r.id)}
                          style={{
                            padding: "5px 8px", border: "none", borderRadius: 5,
                            background: excluindo === r.id ? "#dc2626" : "#fef2f2",
                            color: excluindo === r.id ? "#fff" : "#dc2626",
                            fontSize: 11, cursor: "pointer", whiteSpace: "nowrap",
                          }}>
                          {excluindo === r.id ? "Confirmar" : "Excluir"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
