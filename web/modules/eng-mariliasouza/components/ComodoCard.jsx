import { useState } from "react";
import ElementoInspecao from "./ElementoInspecao";

const ELEMENTOS_RAPIDOS = [
  { id: "teto",            label: "Teto" },
  { id: "piso",            label: "Piso / Chão" },
  { id: "parede",          label: "Parede" },
  { id: "porta",           label: "Porta" },
  { id: "janela",          label: "Janela" },
  { id: "tomadas",         label: "Tomadas / Elétrica" },
  { id: "hidraulica",      label: "Hidráulica / Louças" },
  { id: "ar_condicionado", label: "Ar-condicionado" },
  { id: "forro",           label: "Forro / Gesso" },
  { id: "rodape",          label: "Rodapé / Soleira" },
];

export default function ComodoCard({ comodo = {}, onChange, onRemover, simplificado }) {
  const [editandoNome, setEditandoNome] = useState(false);
  const [novoElemento, setNovoElemento] = useState("");
  const elementos = comodo.elementos || [];

  function atualizarNome(nome) {
    onChange?.({ ...comodo, nome });
    setEditandoNome(false);
  }

  function adicionarElementoRapido(item) {
    const novoEl = {
      id: Date.now().toString(),
      tipo: item.id,
      nome: item.label,
      patologias: [], status: "",
      historicoManutencao: false, historicoTempo: "",
      fotos: { situacao: [], termografica: [], legenda: "" },
    };
    onChange?.({ ...comodo, elementos: [...elementos, novoEl] });
  }

  function adicionarElementoCustom() {
    const nome = novoElemento.trim();
    if (!nome) return;
    const novoEl = {
      id: Date.now().toString(),
      tipo: "custom",
      nome,
      patologias: [], status: "",
      historicoManutencao: false, historicoTempo: "",
      fotos: { situacao: [], termografica: [], legenda: "" },
    };
    onChange?.({ ...comodo, elementos: [...elementos, novoEl] });
    setNovoElemento("");
  }

  function atualizarElemento(id, dados) {
    onChange?.({ ...comodo, elementos: elementos.map((e) => (e.id === id ? dados : e)) });
  }

  function removerElemento(id) {
    onChange?.({ ...comodo, elementos: elementos.filter((e) => e.id !== id) });
  }

  return (
    <div className="comodo-card">
      <div className="comodo-header">
        <div className="comodo-nome-area">
          {editandoNome ? (
            <input className="comodo-nome-input" defaultValue={comodo.nome} autoFocus
              onBlur={(e) => atualizarNome(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") atualizarNome(e.target.value); if (e.key === "Escape") setEditandoNome(false); }} />
          ) : (
            <button type="button" className="comodo-nome-btn" onClick={() => setEditandoNome(true)}>
              {comodo.nome || "Novo Cômodo"}
              <span className="comodo-editar-icone">editar</span>
            </button>
          )}
        </div>
        <button type="button" className="btn-remover-comodo" onClick={onRemover}>
          Remover cômodo
        </button>
      </div>

      <div className="elementos-rapidos-area">
        <span className="elementos-titulo">Adicionar elemento:</span>
        <div className="elementos-rapidos-lista">
          {ELEMENTOS_RAPIDOS.map((item) => (
            <button key={item.id} type="button" className="btn-elemento-rapido"
              onClick={() => adicionarElementoRapido(item)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="elemento-custom">
          <input type="text"
            placeholder="+ Outro elemento (ex: Varanda, Box, Armário embutido...)"
            value={novoElemento}
            onChange={(e) => setNovoElemento(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && adicionarElementoCustom()} />
          <button type="button" className="btn-adicionar-custom" onClick={adicionarElementoCustom}>
            Adicionar
          </button>
        </div>
      </div>

      {elementos.length > 0 ? (
        <div className="elementos-lista">
          {elementos.map((el) => (
            <ElementoInspecao key={el.id} elemento={el} simplificado={simplificado}
              onChange={(dados) => atualizarElemento(el.id, dados)}
              onRemover={() => removerElemento(el.id)} />
          ))}
        </div>
      ) : (
        <div className="estado-vazio" style={{ margin: 16 }}>
          Nenhum elemento adicionado. Selecione acima para começar.
        </div>
      )}
    </div>
  );
}
