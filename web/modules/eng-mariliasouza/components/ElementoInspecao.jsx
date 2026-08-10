import { useState, useEffect } from "react";
import FotoUpload from "./FotoUpload";

const PATOLOGIAS = [
  { id: "infiltracao",   label: "Infiltração / Umidade" },
  { id: "fissura",       label: "Fissura / Trinca / Rachadura" },
  { id: "desplacamento", label: "Desplacamento de Revestimento" },
  { id: "mofo",          label: "Mofo / Bolor" },
  { id: "oxidacao",      label: "Oxidação / Corrosão" },
  { id: "caimento",      label: "Caimento inadequado" },
  { id: "prumo",         label: "Fora de Prumo / Nível" },
  { id: "eflorescencia", label: "Eflorescência" },
  { id: "pintura",       label: "Pintura danificada" },
  { id: "vidro",         label: "Vidro riscado / quebrado" },
  { id: "outra",         label: "Outra patologia" },
];

const GRAVIDADE = [
  { value: "leve",     label: "Leve",     cor: "#16a34a" },
  { value: "moderada", label: "Moderada", cor: "#d97706" },
  { value: "critica",  label: "Crítica",  cor: "#dc2626" },
];

const STATUS = [
  { value: "conforme",      label: "Conforme" },
  { value: "nao_conforme",  label: "Não Conforme" },
  { value: "nao_observado", label: "Não Observado" },
];

export default function ElementoInspecao({ elemento = {}, onChange, onRemover, simplificado }) {
  const [expandido, setExpandido] = useState(true);
  const [editandoNome, setEditandoNome] = useState(false);
  const [compLocal, setCompLocal] = useState(elemento.comprimento || "");
  const [largLocal, setLargLocal] = useState(elemento.largura || "");
  const [outraPatologia, setOutraPatologia] = useState("");

  function iniciarEdicaoNome() {
    setEditandoNome(true);
  }

  function confirmarNome(e) {
    const val = e.target.value.trim();
    if (val) atualizar("nome", val);
    setEditandoNome(false);
  }

  useEffect(() => {
    setCompLocal(elemento.comprimento || "");
    setLargLocal(elemento.largura || "");
  }, [elemento.comprimento, elemento.largura, elemento.id]);

  function atualizar(campo, valor) {
    onChange?.({ ...elemento, [campo]: valor });
  }

  function togglePatologia(id) {
    const atual = elemento.patologias || [];
    const novas = atual.includes(id) ? atual.filter((p) => p !== id) : [...atual, id];
    atualizar("patologias", novas);
  }

  function handleBlurComprimento() {
    const comp = compLocal.replace(",", ".");
    const c = parseFloat(comp) || 0;
    const l = parseFloat(elemento.largura || largLocal) || 0;
    const updates = { comprimento: comp };
    if (c > 0 && l > 0) updates.area = (c * l).toFixed(2);
    onChange?.({ ...elemento, ...updates });
  }

  function handleBlurLargura() {
    const larg = largLocal.replace(",", ".");
    const c = parseFloat(elemento.comprimento || compLocal) || 0;
    const l = parseFloat(larg) || 0;
    const updates = { largura: larg };
    if (c > 0 && l > 0) updates.area = (c * l).toFixed(2);
    onChange?.({ ...elemento, ...updates });
  }

  function adicionarOutraPatologia() {
    const nome = outraPatologia.trim();
    if (!nome) return;
    const atual = elemento.patologias || [];
    if (!atual.includes(nome)) {
      atualizar("patologias", [...atual, nome]);
    }
    setOutraPatologia("");
  }

  const temPatologia = (id) => (elemento.patologias || []).includes(id);

  return (
    <div className="elemento-card">
      <div className="elemento-header">
        <button type="button" className="elemento-toggle" onClick={() => setExpandido((v) => !v)}>
          {editandoNome ? (
            <input className="comodo-nome-input" defaultValue={elemento.nome} autoFocus
              style={{ fontSize: 13, fontWeight: 600, padding: "2px 6px", maxWidth: 200 }}
              onBlur={confirmarNome}
              onKeyDown={(e) => { if (e.key === "Enter") confirmarNome(e); if (e.key === "Escape") setEditandoNome(false); }} />
          ) : (
            <span className="elemento-nome">{elemento.nome || "Elemento"}</span>
          )}
          {!editandoNome && (
            <button type="button" onClick={(e) => { e.stopPropagation(); iniciarEdicaoNome(); }}
              style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 11, cursor: "pointer", padding: "0 4px", textDecoration: "underline" }}>
              editar
            </button>
          )}
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{expandido ? "▲" : "▼"}</span>
        </button>
        <button type="button" className="btn-remover-elemento" onClick={onRemover} title="Remover">x</button>
      </div>

      {expandido && (
        <div className="elemento-corpo fade-in">
          <div className="grid-3" style={{ marginBottom: 14 }}>
            <div className="campo">
              <label>📐 Comprimento (m)</label>
              <input type="text" inputMode="decimal" placeholder="Ex: 3.20"
                value={compLocal}
                onChange={(e) => setCompLocal(e.target.value)}
                onBlur={handleBlurComprimento} />
            </div>
            <div className="campo">
              <label>📐 Largura (m)</label>
              <input type="text" inputMode="decimal" placeholder="Ex: 2.50"
                value={largLocal}
                onChange={(e) => setLargLocal(e.target.value)}
                onBlur={handleBlurLargura} />
            </div>
            <div className="campo">
              <label>📐 Área (m²) <span style={{ color: "#16a34a", fontSize: 11 }}>(automático)</span></label>
              <input type="text" readOnly
                value={elemento.area ? `${elemento.area} m²` : ""}
                placeholder="Calculado automaticamente"
                style={{ background: "#f0fdf4", fontWeight: 600, color: "#15803d" }} />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 14 }}>
            <div className="campo">
              <label>Status <span className="obrigatorio">*</span></label>
              <select value={elemento.status || ""} onChange={(e) => atualizar("status", e.target.value)}>
                <option value="">Selecione...</option>
                {STATUS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
              Patologias identificadas
            </label>
            <div className="patologias-grid">
              {PATOLOGIAS.map((p) => {
                if (p.id === "outra") {
                  return (
                    <div key="outra" style={{ display: "flex", gap: 4, alignItems: "center", gridColumn: "1 / -1" }}>
                      <input type="text"
                        placeholder="Digite outra patologia..."
                        value={outraPatologia}
                        onChange={(e) => setOutraPatologia(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") adicionarOutraPatologia(); }}
                        style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: 12 }} />
                      <button type="button" onClick={adicionarOutraPatologia}
                        style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                        + Adicionar
                      </button>
                    </div>
                  );
                }
                return (
                  <button key={p.id} type="button"
                    className={`btn-patologia ${temPatologia(p.id) ? "ativo" : ""}`}
                    onClick={() => togglePatologia(p.id)}>
                    {temPatologia(p.id) ? "✓ " : ""}{p.label}
                  </button>
                );
              })}
            </div>
            {(elemento.patologias || []).filter((p) => !PATOLOGIAS.map(x=>x.id).includes(p)).length > 0 && (
              <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {(elemento.patologias || []).filter((p) => !PATOLOGIAS.map(x=>x.id).includes(p)).map((p) => (
                  <span key={p} style={{ padding: "2px 10px", borderRadius: 12, background: "#dbeafe", color: "#1d4ed8", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    {p}
                    <button type="button" onClick={() => togglePatologia(p)}
                      style={{ background: "none", border: "none", color: "#1d4ed8", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>x</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {(elemento.patologias || []).length > 0 && (
            <div className="campo" style={{ marginBottom: 14 }}>
              <label>Gravidade <span className="obrigatorio">*</span></label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {GRAVIDADE.map((g) => (
                  <button key={g.value} type="button"
                    style={{
                      padding: "6px 14px", borderRadius: 6,
                      border: `2px solid ${elemento.gravidade === g.value ? g.cor : "#e2e8f0"}`,
                      background: elemento.gravidade === g.value ? g.cor + "18" : "#f8fafc",
                      color: elemento.gravidade === g.value ? g.cor : "#64748b",
                      fontWeight: elemento.gravidade === g.value ? 600 : 400,
                      fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                    }}
                    onClick={() => atualizar("gravidade", g.value)}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!simplificado && (
            <div className="bloco-campos" style={{ marginBottom: 14 }}>
              <div className="bloco-titulo">Histórico de Manutenção</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={elemento.historicoManutencao || false}
                    onChange={(e) => atualizar("historicoManutencao", e.target.checked)} />
                  Já houve reparação/manutenção
                </label>
                {elemento.historicoManutencao && (
                  <div className="campo" style={{ flex: 1, minWidth: 200 }}>
                    <label>Há quanto tempo?</label>
                    <input type="text" placeholder="Ex: 6 meses, 2 anos..."
                      value={elemento.historicoTempo || ""}
                      onChange={(e) => atualizar("historicoTempo", e.target.value)} />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="campo" style={{ marginBottom: 14 }}>
            <label>Observações técnicas</label>
            <textarea rows={3}
              placeholder="Ex: Fissura mapeada em revestimento cerâmico, orientação vertical, extensão 60cm."
              value={elemento.observacoes || ""}
              onChange={(e) => atualizar("observacoes", e.target.value)}
              style={{ resize: "vertical" }} />
          </div>

          <FotoUpload
            fotos={elemento.fotos || {}}
            onChange={(f) => atualizar("fotos", f)}
            simplificado={simplificado}
          />
        </div>
      )}
    </div>
  );
}
