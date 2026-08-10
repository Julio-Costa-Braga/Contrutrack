import { salvarJSON } from "../utils/salvarJSON";
import { carregarJSON } from "../utils/carregarJSON";

export default function Toolbar({ relatorio, onCarregar, onNovo, onVerRelatorios, ultimoSalvo }) {
  async function handleCarregar() {
    try {
      const dados = await carregarJSON();
      onCarregar?.(dados);
      alert("Rascunho carregado com sucesso!");
    } catch (err) { alert(err.message); }
  }

  return (
    <div className="toolbar">
      <div className="toolbar-status">
        {ultimoSalvo ? (
          <span className="status-salvo">
            Salvo automaticamente às {ultimoSalvo.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : (
          <span className="status-pendente">Aguardando dados...</span>
        )}
      </div>
      <div className="toolbar-acoes">
        <button type="button" className="btn-toolbar btn-secundario" onClick={onNovo}>Novo</button>
        <button type="button" className="btn-toolbar btn-secundario" onClick={handleCarregar}>Abrir rascunho</button>
        <button type="button" className="btn-toolbar btn-secundario" onClick={() => salvarJSON(relatorio)}>Salvar rascunho</button>
        <button type="button" className="btn-toolbar btn-primario" onClick={onVerRelatorios}>Ver relatórios</button>
      </div>
    </div>
  );
}
