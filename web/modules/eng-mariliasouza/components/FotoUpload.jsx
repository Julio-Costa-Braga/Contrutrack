import { useRef, useState, useEffect, useCallback } from "react";
import { redimensionarFoto, fileParaBase64 } from "../utils/redimensionarFoto";

// ─── Ferramentas disponíveis ────────────────────────────────────────────────
const FERRAMENTAS = [
  { id: "tracejada",  label: "Tracejada",  icone: "║" },
  { id: "linha",      label: "Linha",      icone: "╱" },
  { id: "retangulo",  label: "Retângulo",  icone: "▭" },
  { id: "circulo",    label: "Círculo",    icone: "○" },
  { id: "seta",       label: "Seta",       icone: "→" },
  { id: "texto",      label: "Texto",      icone: "T" },
];

// ─── Editor de foto ────────────────────────────────────────────────────────
function EditorFoto({ src, onSalvar, onCancelar }) {
  const canvasRef     = useRef(null);
  const [ferramenta, setFerramenta] = useState("tracejada");
  const [cor, setCor]               = useState("#ff0000");
  const [espessura, setEspessura]   = useState(4);
  const [brilho, setBrilho]         = useState(100);
  const [textoAtivo, setTextoAtivo] = useState("");
  const [mostrarInputTexto, setMostrarInputTexto] = useState(false);
  const inicioPonto    = useRef(null);
  const desenhandoRef  = useRef(false);
  const imgOriginal    = useRef(null);
  const historico      = useRef([]);
  const snapshotImg    = useRef(null);
  const textoPos       = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const img    = new Image();
    img.onload   = () => {
      const maxW = 800, maxH = 600;
      let w = img.width, h = img.height;
      if (w > maxW) { h = (h * maxW) / w; w = maxW; }
      if (h > maxH) { w = (w * maxH) / h; h = maxH; }
      canvas.width  = Math.round(w);
      canvas.height = Math.round(h);
      ctx.filter    = `brightness(${brilho}%)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter    = "none";
      imgOriginal.current = img;
      salvarEstado();
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    if (!imgOriginal.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    ctx.filter   = `brightness(${brilho}%)`;
    ctx.drawImage(imgOriginal.current, 0, 0, canvas.width, canvas.height);
    ctx.filter   = "none";
    salvarEstado();
  }, [brilho]);

  function salvarEstado() {
    if (!canvasRef.current) return;
    historico.current.push(canvasRef.current.toDataURL());
    if (historico.current.length > 30) historico.current.shift();
  }

  function desfazer() {
    if (historico.current.length < 2) return;
    historico.current.pop();
    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = historico.current[historico.current.length - 1];
  }

  function getPonto(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width  / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    };
  }

  function tirarSnapshot() {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    snapshotImg.current = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  function restaurarSnapshot() {
    if (!snapshotImg.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.putImageData(snapshotImg.current, 0, 0);
  }

  function iniciarDesenho(e) {
    e.preventDefault();
    const ponto = getPonto(e);

    if (ferramenta === "texto") {
      textoPos.current = ponto;
      setMostrarInputTexto(true);
      return;
    }

    desenhandoRef.current = true;
    inicioPonto.current = ponto;
    tirarSnapshot();
  }

  function desenhar(e) {
    if (!desenhandoRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const ponto  = getPonto(e);
    const ini    = inicioPonto.current;

    ctx.strokeStyle = cor;
    ctx.lineWidth   = espessura;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.fillStyle   = cor;

    if (ferramenta === "tracejada") {
      restaurarSnapshot();
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(ini.x, ini.y);
      ctx.lineTo(ponto.x, ponto.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (ferramenta === "linha") {
      restaurarSnapshot();
      ctx.beginPath();
      ctx.moveTo(ini.x, ini.y);
      ctx.lineTo(ponto.x, ponto.y);
      ctx.stroke();
    }

    if (ferramenta === "retangulo") {
      restaurarSnapshot();
      ctx.strokeRect(ini.x, ini.y, ponto.x - ini.x, ponto.y - ini.y);
    }

    if (ferramenta === "circulo") {
      restaurarSnapshot();
      const r = Math.hypot(ponto.x - ini.x, ponto.y - ini.y) / 2;
      const cx = (ini.x + ponto.x) / 2;
      const cy = (ini.y + ponto.y) / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (ferramenta === "seta") {
      restaurarSnapshot();
      desenharSeta(ctx, ini.x, ini.y, ponto.x, ponto.y);
    }
  }

  function desenharSeta(ctx, x1, y1, x2, y2) {
    if (Math.hypot(x2 - x1, y2 - y1) < 5) return;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const cabecaTam = 12 + espessura;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - cabecaTam * Math.cos(ang - Math.PI / 6), y2 - cabecaTam * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(x2 - cabecaTam * Math.cos(ang + Math.PI / 6), y2 - cabecaTam * Math.sin(ang + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  function pararDesenho() {
    if (!desenhandoRef.current) return;
    desenhandoRef.current = false;
    salvarEstado();
  }

  function confirmarTexto() {
    if (!textoAtivo.trim() || !textoPos.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.font = `${Math.max(12, espessura * 4)}px sans-serif`;
    ctx.fillStyle = cor;
    ctx.fillText(textoAtivo, textoPos.current.x, textoPos.current.y);
    setTextoAtivo("");
    setMostrarInputTexto(false);
    textoPos.current = null;
    salvarEstado();
  }

  function salvar() {
    const base64 = canvasRef.current.toDataURL("image/jpeg", 0.92);
    onSalvar(base64);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", zIndex: 9999, padding: 12,
    }}>
      {/* Barra de ferramentas — estilo Word */}
      <div style={{
        background: "#1e293b", borderRadius: 10, padding: "8px 12px",
        display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap",
        marginBottom: 10, width: "100%", maxWidth: 820,
      }}>
        {FERRAMENTAS.map((f) => (
          <button key={f.id} type="button" title={f.label}
            onClick={() => setFerramenta(f.id)}
            style={{
              width: 34, height: 34, borderRadius: 6, border: "none", cursor: "pointer",
              background: ferramenta === f.id ? "#2563eb" : "transparent",
              color: "#fff", fontSize: 16, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            {f.icone}
          </button>
        ))}

        <div style={{ width: 1, height: 28, background: "#475569", margin: "0 4px" }} />

        <input type="color" value={cor} onChange={(e) => setCor(e.target.value)}
          title="Cor"
          style={{ width: 28, height: 28, border: "none", borderRadius: 4, cursor: "pointer", background: "none", padding: 0 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#94a3b8", fontSize: 11 }}>{espessura}px</span>
          <input type="range" min={1} max={20} value={espessura}
            onChange={(e) => setEspessura(Number(e.target.value))}
            title="Espessura"
            style={{ width: 60, cursor: "pointer" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#94a3b8", fontSize: 11 }}>{brilho}%</span>
          <input type="range" min={30} max={200} value={brilho}
            onChange={(e) => setBrilho(Number(e.target.value))}
            title="Brilho"
            style={{ width: 60, cursor: "pointer" }} />
        </div>

        <div style={{ width: 1, height: 28, background: "#475569", margin: "0 4px" }} />

        <button type="button" onClick={desfazer} title="Desfazer"
          style={{ width: 34, height: 34, borderRadius: 6, border: "none", background: "transparent", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ↩
        </button>

        <div style={{ flex: 1 }} />

        <button type="button" onClick={onCancelar}
          style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #475569", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>
          Cancelar
        </button>
        <button type="button" onClick={salvar}
          style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "#16a34a", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
          Usar
        </button>
      </div>

      {/* Input de texto */}
      {mostrarInputTexto && (
        <div style={{ background: "#1e293b", borderRadius: 8, padding: "8px 12px", marginBottom: 8, display: "flex", gap: 8, maxWidth: 820, width: "100%" }}>
          <input type="text" value={textoAtivo} autoFocus
            onChange={(e) => setTextoAtivo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") confirmarTexto(); if (e.key === "Escape") setMostrarInputTexto(false); }}
            placeholder="Digite o texto..."
            style={{ flex: 1, padding: "6px 10px", borderRadius: 4, border: "1px solid #475569", background: "#334155", color: "#fff", fontSize: 14, outline: "none" }} />
          <button type="button" onClick={confirmarTexto}
            style={{ padding: "6px 14px", borderRadius: 4, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: 12 }}>
            OK
          </button>
        </div>
      )}

      <canvas ref={canvasRef}
        style={{
          maxWidth: "100%", maxHeight: "70vh", borderRadius: 8,
          cursor: ferramenta === "texto" ? "text" : "crosshair",
          touchAction: "none",
        }}
        onMouseDown={iniciarDesenho}
        onMouseMove={desenhar}
        onMouseUp={pararDesenho}
        onMouseLeave={pararDesenho}
        onTouchStart={iniciarDesenho}
        onTouchMove={desenhar}
        onTouchEnd={pararDesenho}
      />
    </div>
  );
}

// ─── Slot de foto individual ───────────────────────────────────────────────
function SlotFoto({ foto, index, aoEditar, aoRemover, aoMoverCima, aoMoverBaixo, total }) {
  return (
    <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", background: "#e2e8f0" }}>
      <img src={foto} alt={`foto-${index}`}
        style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
      <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 2, padding: 4 }}>
        <button type="button" onClick={() => aoEditar(index)}
          style={{ background: "rgba(37,99,235,0.9)", border: "none", color: "#fff", borderRadius: 5, padding: "3px 7px", fontSize: 11, cursor: "pointer" }}>
          Editar
        </button>
        <button type="button" onClick={() => aoRemover(index)}
          style={{ background: "rgba(220,38,38,0.9)", border: "none", color: "#fff", borderRadius: 5, width: 22, height: 22, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          x
        </button>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4, padding: 4 }}>
        {index > 0 && (
          <button type="button" onClick={() => aoMoverCima(index)}
            style={{ background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>
            ▲
          </button>
        )}
        {index < total - 1 && (
          <button type="button" onClick={() => aoMoverBaixo(index)}
            style={{ background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>
            ▼
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Grupo de fotos ────────────────────────────────────────────────────────
function GrupoFotos({ label, fotos = [], onAdicionar, onEditar, onRemover, onMover, aceitaCamera, tipo }) {
  const inputGaleriaRef = useRef(null);
  const inputCameraRef  = useRef(null);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState("");

  async function processarArquivos(arquivos) {
    const lista = Array.from(arquivos);
    if (lista.length === 0) return;
    setProcessando(true);
    setProgresso(`Processando 1 de ${lista.length}...`);
    const resultados = [];
    for (let i = 0; i < lista.length; i++) {
      setProgresso(`Processando ${i + 1} de ${lista.length}...`);
      try {
        const base64 = await redimensionarFoto(lista[i], { useWebWorker: false, maxSizeMB: 0.3 });
        if (base64) resultados.push(base64);
      } catch (err) {
        console.error("Erro ao processar arquivo:", err);
        try {
          const base64 = await fileParaBase64(lista[i]);
          if (base64) resultados.push(base64);
        } catch {}
      }
    }
    if (resultados.length > 0) onAdicionar(resultados, tipo);
    setProcessando(false);
    setProgresso("");
  }

  function handleInput(e) {
    if (e.target.files?.length > 0) {
      processarArquivos(e.target.files);
    }
    e.target.value = "";
  }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: "#475569",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8,
      }}>
        {label}
      </div>

      {fotos.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
          gap: 6, marginBottom: 8,
        }}>
          {fotos.map((f, i) => (
            <SlotFoto
              key={i} foto={f} index={i} total={fotos.length}
              aoEditar={onEditar}
              aoRemover={onRemover}
              aoMoverCima={(idx) => onMover(idx, idx - 1, tipo)}
              aoMoverBaixo={(idx) => onMover(idx, idx + 1, tipo)}
            />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button type="button" onClick={() => !processando && inputGaleriaRef.current?.click()}
          disabled={processando}
          style={{
            flex: 1, minWidth: 120, padding: "9px 10px", border: "2px dashed #cbd5e1",
            borderRadius: 8, background: processando ? "#e2e8f0" : "#f8fafc",
            color: processando ? "#94a3b8" : "#64748b", fontSize: 12,
            cursor: processando ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all 0.15s",
          }}
          onMouseOver={(e) => { if (!processando) { e.currentTarget.style.borderColor="#2563eb"; e.currentTarget.style.color="#2563eb"; e.currentTarget.style.background="#eff6ff"; }}}
          onMouseOut={(e)  => { if (!processando) { e.currentTarget.style.borderColor="#cbd5e1"; e.currentTarget.style.color="#64748b"; e.currentTarget.style.background="#f8fafc"; }}}>
          {processando ? progresso : "Galeria"}
        </button>

        {aceitaCamera && (
          <button type="button" onClick={() => inputCameraRef.current?.click()}
            style={{
              flex: 1, minWidth: 100, padding: "9px 10px", border: "2px dashed #93c5fd",
              borderRadius: 8, background: "#eff6ff", color: "#2563eb", fontSize: 12,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            Tirar foto
          </button>
        )}
      </div>

      <input ref={inputGaleriaRef} type="file" accept="image/*" multiple
        style={{ display: "none" }} onChange={handleInput} />
      <input ref={inputCameraRef} type="file" accept="image/*" capture="environment"
        style={{ display: "none" }} onChange={handleInput} />
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function FotoUpload({ fotos = {}, onChange, simplificado }) {
  const [editando, setEditando]     = useState(null);
  const [isMobile]                  = useState(() => /Mobi|Android/i.test(navigator.userAgent));

  const fotosSituacao     = fotos.situacao    || [];
  const fotosTermografica = fotos.termografica || [];

  function atualizar(campo, valor) {
    onChange?.({ ...fotos, [campo]: valor });
  }

  function adicionarFoto(grupo, base64OrArray) {
    const atual = fotos[grupo] || [];
    const novas = Array.isArray(base64OrArray) ? base64OrArray : [base64OrArray];
    atualizar(grupo, [...atual, ...novas]);
  }

  function removerFoto(grupo, index) {
    const atual = [...(fotos[grupo] || [])];
    atual.splice(index, 1);
    atualizar(grupo, atual);
  }

  function moverFoto(grupo, de, para) {
    const atual = [...(fotos[grupo] || [])];
    const [item] = atual.splice(de, 1);
    atual.splice(para, 0, item);
    atualizar(grupo, atual);
  }

  function abrirEditor(grupo, index) {
    setEditando({ grupo, index });
  }

  function salvarEdicao(base64Editado) {
    const { grupo, index } = editando;
    const atual = [...(fotos[grupo] || [])];
    atual[index] = base64Editado;
    atualizar(grupo, atual);
    setEditando(null);
  }

  const fotoParaEditar = editando
    ? (fotos[editando.grupo] || [])[editando.index]
    : null;

  return (
    <div className="foto-upload-container">
      {/* Foto Situação (normal) */}
      <GrupoFotos
        label="Fotos da Situação"
        fotos={fotosSituacao}
        onAdicionar={(b64) => adicionarFoto("situacao", b64)}
        onEditar={(i) => abrirEditor("situacao", i)}
        onRemover={(i) => removerFoto("situacao", i)}
        onMover={(de, para) => moverFoto("situacao", de, para)}
        aceitaCamera={isMobile}
        tipo="situacao"
      />

      <div style={{ height: 12 }} />

      {/* Foto Termográfica */}
      <GrupoFotos
        label="Fotos Termográficas"
        fotos={fotosTermografica}
        onAdicionar={(b64) => adicionarFoto("termografica", b64)}
        onEditar={(i) => abrirEditor("termografica", i)}
        onRemover={(i) => removerFoto("termografica", i)}
        onMover={(de, para) => moverFoto("termografica", de, para)}
        aceitaCamera={isMobile}
        tipo="termografica"
      />
      <div style={{ height: 12 }} />

      {/* Legenda (obrigatória) */}
      <div className="campo">
        <label>
          Legenda técnica <span className="obrigatorio">*</span>
        </label>
        <input
          type="text"
          placeholder="Ex: Fissura diagonal em 45° na verga da janela"
          value={fotos.legenda || ""}
          onChange={(e) => atualizar("legenda", e.target.value)}
          required
        />
        {!fotos.legenda && (
          <span style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>
            A legenda é obrigatória
          </span>
        )}
      </div>

      {editando && fotoParaEditar && (
        <EditorFoto
          src={fotoParaEditar}
          onSalvar={salvarEdicao}
          onCancelar={() => setEditando(null)}
        />
      )}
    </div>
  );
}
