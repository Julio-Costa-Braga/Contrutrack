import { useState } from "react";

const PAISES = [
  { codigo: "BR", nome: "Brasil",       ddi: "+55",  docLabel: "CPF / CNPJ",   cepLabel: "CEP",           bairroLabel: "Bairro",     cidadeLabel: "Cidade / UF",  logLabel: "Logradouro", artLabel: "ART / CREA" },
  { codigo: "PT", nome: "Portugal",     ddi: "+351", docLabel: "NIF",           cepLabel: "Código Postal", bairroLabel: "Freguesia",  cidadeLabel: "Distrito",     logLabel: "Morada",     artLabel: "Ordem dos Engenheiros" },
  { codigo: "US", nome: "EUA",          ddi: "+1",   docLabel: "SSN / EIN",    cepLabel: "ZIP Code",      bairroLabel: "District",   cidadeLabel: "City / State", logLabel: "Address",    artLabel: "License No." },
  { codigo: "DE", nome: "Alemanha",     ddi: "+49",  docLabel: "Steuer-ID",    cepLabel: "PLZ",           bairroLabel: "Stadtteil",  cidadeLabel: "Stadt",        logLabel: "Strasse",    artLabel: "Kammer Nr." },
  { codigo: "FR", nome: "França",       ddi: "+33",  docLabel: "SIRET / NIF",  cepLabel: "Code Postal",   bairroLabel: "Quartier",   cidadeLabel: "Ville",        logLabel: "Adresse",    artLabel: "Ordre No." },
  { codigo: "ES", nome: "Espanha",      ddi: "+34",  docLabel: "NIF / CIF",    cepLabel: "Cód. Postal",   bairroLabel: "Barrio",     cidadeLabel: "Ciudad",       logLabel: "Dirección",  artLabel: "Colegio No." },
  { codigo: "IT", nome: "Itália",       ddi: "+39",  docLabel: "Codice Fisc.", cepLabel: "CAP",           bairroLabel: "Quartiere",  cidadeLabel: "Città",        logLabel: "Via",        artLabel: "Ordine No." },
  { codigo: "UK", nome: "Reino Unido",  ddi: "+44",  docLabel: "NI / UTR",     cepLabel: "Postcode",      bairroLabel: "District",   cidadeLabel: "City",         logLabel: "Address",    artLabel: "Reg. No." },
  { codigo: "AO", nome: "Angola",       ddi: "+244", docLabel: "NIF",           cepLabel: "Cód. Postal",   bairroLabel: "Bairro",     cidadeLabel: "Município",    logLabel: "Morada",     artLabel: "OENGIL No." },
  { codigo: "MZ", nome: "Moçambique",   ddi: "+258", docLabel: "NUIT",          cepLabel: "Cód. Postal",   bairroLabel: "Bairro",     cidadeLabel: "Cidade",       logLabel: "Morada",     artLabel: "OEAM No." },
  { codigo: "AR", nome: "Argentina",    ddi: "+54",  docLabel: "CUIT / DNI",   cepLabel: "Cód. Postal",   bairroLabel: "Barrio",     cidadeLabel: "Província",    logLabel: "Dirección",  artLabel: "CPIC No." },
  { codigo: "ZZ", nome: "Outro país",   ddi: "+",    docLabel: "Documento",     cepLabel: "Cód. Postal",   bairroLabel: "Bairro",     cidadeLabel: "Cidade",       logLabel: "Endereço",   artLabel: "Registro Prof." },
];

export { PAISES };

function gerarPedidoAleatorio() {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  let pedido = "PED-";
  for (let i = 0; i < 3; i++) pedido += letras[Math.floor(Math.random() * letras.length)];
  pedido += "-";
  for (let i = 0; i < 4; i++) pedido += nums[Math.floor(Math.random() * nums.length)];
  return pedido;
}

export default function Header({ dados = {}, onChange }) {
  const [aberto, setAberto] = useState(true);
  const [paisCodigo, setPaisCodigo] = useState(dados.paisCodigo || "BR");

  const pais = PAISES.find((p) => p.codigo === paisCodigo) || PAISES[0];

  function atualizar(campo, valor) {
    onChange?.({ ...dados, [campo]: valor });
  }

  function trocarPais(codigo) {
    setPaisCodigo(codigo);
    onChange?.({ ...dados, paisCodigo: codigo });
  }

  function gerarPedido() {
    const pedido = gerarPedidoAleatorio();
    atualizar("numeroPedido", pedido);
  }

  return (
    <>
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 24,
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(37,99,235,0.2)",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, background: "rgba(255,255,255,0.1)",
        }}>
          <img src="/logo_circular.ico" alt="Logo Eng. Marilia Souza"
            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
            onError={(e) => { e.target.style.display = "none"; e.target.parentElement.textContent = "🏗️"; }} />
        </div>
        <div>
          <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: "0.01em" }}>
            Eng. Marília Souza
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 }}>
            Sistema de Relatório Técnico de Vistoria — Engenharia Civil
          </div>
        </div>
      </div>

      <section className="secao">
        <button className="secao-titulo"
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center" }}
          onClick={() => setAberto((v) => !v)} type="button">
          📋 Identificação e Dados do Cliente
          <span style={{ marginLeft: "auto", fontSize: 18, color: "#94a3b8" }}>
            {aberto ? "▲" : "▼"}
          </span>
        </button>

        {aberto && (
          <div className="fade-in">
            <div className="campo" style={{ marginBottom: 16 }}>
              <label>🌍 País <span className="obrigatorio">*</span></label>
              <select value={paisCodigo} onChange={(e) => trocarPais(e.target.value)}>
                {PAISES.map((p) => (
                  <option key={p.codigo} value={p.codigo}>{p.nome} ({p.ddi})</option>
                ))}
              </select>
            </div>

            <div className="campo" style={{ marginBottom: 14 }}>
              <label>👤 Tipo de Cliente <span className="obrigatorio">*</span></label>
              <select value={dados.tipoCliente || "pessoa"} onChange={(e) => atualizar("tipoCliente", e.target.value)}>
                <option value="condominio">Condomínio</option>
                <option value="pessoa">Pessoa Física</option>
                <option value="empresa">Empresa</option>
              </select>
            </div>

            <div className="grid-2" style={{ marginBottom: 14 }}>
              <div className="campo campo-grow">
                <label>👤 Nome completo do cliente <span className="obrigatorio">*</span></label>
                <input type="text" placeholder="Nome completo"
                  value={dados.nome || ""}
                  onChange={(e) => atualizar("nome", e.target.value)} />
              </div>
              <div className="campo">
                <label>🆔 {pais.docLabel} <span className="obrigatorio">*</span></label>
                <input type="text" placeholder={pais.docLabel}
                  value={dados.cpfCnpj || ""}
                  onChange={(e) => atualizar("cpfCnpj", e.target.value)} />
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 14 }}>
              <div className="campo">
                <label>📱 Telefone / WhatsApp <span className="obrigatorio">*</span></label>
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{
                    width: 72, padding: "9px 8px", border: "1.5px solid #d1d5db",
                    borderRadius: 7, fontSize: 13, background: "#f1f5f9",
                    color: "#475569", textAlign: "center", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{pais.ddi}</div>
                  <input type="text" placeholder="DDD" maxLength={4}
                    value={dados.ddd || ""}
                    onChange={(e) => atualizar("ddd", e.target.value.replace(/\D/g, ""))}
                    style={{ width: 60, flexShrink: 0 }} />
                  <input type="text" placeholder="Número"
                    value={dados.telefone || ""}
                    onChange={(e) => atualizar("telefone", e.target.value)}
                    style={{ flex: 1 }} />
                </div>
              </div>
              <div className="campo">
                <label>✉️ E-mail</label>
                <input type="email" placeholder="email@exemplo.com"
                  value={dados.email || ""}
                  onChange={(e) => atualizar("email", e.target.value)} />
              </div>
            </div>

            <div className="grid-3">
              <div className="campo">
                <label>📅 Data da Vistoria <span className="obrigatorio">*</span></label>
                <input type="date"
                  value={dados.dataVistoria || new Date().toISOString().split("T")[0]}
                  onChange={(e) => atualizar("dataVistoria", e.target.value)} />
              </div>
              <div className="campo">
                <label>📋 Pedido / OS</label>
                <div style={{ display: "flex", gap: 4 }}>
                  <input type="text" placeholder="Clique em Gerar"
                    value={dados.numeroPedido || ""}
                    onChange={(e) => atualizar("numeroPedido", e.target.value)}
                    style={{ flex: 1 }} />
                  <button type="button" onClick={gerarPedido}
                    style={{ padding: "6px 10px", border: "1.5px solid #cbd5e1", borderRadius: 6, background: "#f8fafc", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>
                    Gerar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
