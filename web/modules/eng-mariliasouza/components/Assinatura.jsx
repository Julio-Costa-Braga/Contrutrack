import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function Assinatura({ assinatura, onChange, dadosCliente, onUpdateCliente, pais }) {
  const canvasRef = useRef(null);
  const inputRef  = useRef(null);
  const [aba, setAba] = useState("desenhar");

  function confirmarDesenho() {
    if (!canvasRef.current || canvasRef.current.isEmpty()) {
      alert("Por favor, assine no campo antes de confirmar.");
      return;
    }
    const base64 = canvasRef.current.getTrimmedCanvas().toDataURL("image/png");
    onChange?.(base64);
  }

  function limparDesenho() {
    canvasRef.current?.clear();
    onChange?.("");
  }

  function handleUpload(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange?.(ev.target.result);
    reader.readAsDataURL(arquivo);
    e.target.value = "";
  }

  function remover() {
    canvasRef.current?.clear();
    onChange?.("");
  }

  return (
    <section className="secao">
      <h2 className="secao-titulo">✍️ Assinatura e ART / Ordem dos Engenheiros</h2>

      {pais && (
        <div className="campo" style={{ marginBottom: 16 }}>
          <label>🔖 {pais.artLabel}</label>
          <input type="text" placeholder="Número de registro profissional"
            value={dadosCliente?.art || ""}
            onChange={(e) => onUpdateCliente?.("art", e.target.value)}
            style={{ background: "#f8fafc" }} />
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, padding: "4px 8px", background: "#f8fafc", borderRadius: 4 }}>
            Registro profissional exigido para emissão de laudos com responsabilidade técnica.
          </p>
        </div>
      )}

      {assinatura ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            background: "#f0fdf4", border: "1.5px solid #86efac",
            borderRadius: 10, padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>---</span>
            <span style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>
              Assinatura confirmada — Eng. Marilia Souza
            </span>
          </div>

          <img src={assinatura} alt="Assinatura"
            style={{ maxWidth: 320, border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, background: "#fff" }} />

          <div>
            <button type="button" className="btn-limpar-assinatura" onClick={remover}>
              Refazer assinatura
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "2px solid #e2e8f0" }}>
            <button type="button" onClick={() => setAba("desenhar")}
              style={{
                padding: "8px 18px", border: "none",
                borderBottom: aba === "desenhar" ? "2px solid #2563eb" : "2px solid transparent",
                background: "none", color: aba === "desenhar" ? "#2563eb" : "#64748b",
                fontWeight: aba === "desenhar" ? 600 : 400, fontSize: 14, cursor: "pointer",
                marginBottom: -2, transition: "all 0.15s",
              }}>
              Desenhar
            </button>
            <button type="button" onClick={() => setAba("upload")}
              style={{
                padding: "8px 18px", border: "none",
                borderBottom: aba === "upload" ? "2px solid #2563eb" : "2px solid transparent",
                background: "none", color: aba === "upload" ? "#2563eb" : "#64748b",
                fontWeight: aba === "upload" ? 600 : 400, fontSize: 14, cursor: "pointer",
                marginBottom: -2, transition: "all 0.15s",
              }}>
              Carregar imagem
            </button>
          </div>

          {aba === "desenhar" && (
            <div className="fade-in">
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>
                Assine abaixo com o mouse (ou dedo no tablet):
              </p>
              <SignatureCanvas ref={canvasRef} penColor="#1e293b"
                canvasProps={{
                  className: "assinatura-canvas",
                  style: { width: "100%", height: 160, maxWidth: 600 },
                }} />
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="button" className="btn-limpar-assinatura" onClick={limparDesenho}>
                  Limpar
                </button>
                <button type="button" className="btn-salvar-assinatura" onClick={confirmarDesenho}>
                  Confirmar assinatura
                </button>
              </div>
            </div>
          )}

          {aba === "upload" && (
            <div className="fade-in">
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                Envie uma imagem da sua assinatura (PNG ou JPG com fundo branco):
              </p>
              <button type="button" onClick={() => inputRef.current?.click()}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 8, width: "100%", maxWidth: 400,
                  padding: "28px 20px", border: "2px dashed #cbd5e1", borderRadius: 10,
                  background: "#f8fafc", color: "#64748b", fontSize: 14, cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.color = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "#f8fafc"; }}>
                <span>Clique para selecionar a imagem</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>PNG, JPG, JPEG — até 2MB</span>
              </button>
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/jpg"
                style={{ display: "none" }} onChange={handleUpload} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
