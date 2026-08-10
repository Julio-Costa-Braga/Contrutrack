import { useState } from "react";
import { PAISES } from "./Header";

function getPais(codigo) {
  return PAISES.find((p) => p.codigo === codigo) || PAISES[0];
}

function CamposEndereco({ dados, onChange, pais }) {
  return (
    <div>
      <div className="grid-3">
        <div className="campo">
          <label>{pais.cepLabel}</label>
          <input type="text" placeholder={pais.cepLabel}
            value={dados.cep || ""}
            onChange={(e) => onChange("cep", e.target.value)}
            style={{ flex: 1 }} />
        </div>
        <div className="campo">
          <label>{pais.bairroLabel}</label>
          <input type="text" placeholder={pais.bairroLabel}
            value={dados.bairro || ""}
            onChange={(e) => onChange("bairro", e.target.value)} />
        </div>
        <div className="campo">
          <label>{pais.cidadeLabel}</label>
          <input type="text" placeholder={pais.cidadeLabel}
            value={dados.cidade || ""}
            onChange={(e) => onChange("cidade", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function FormCasa({ dados, onChange, pais }) {
  return (
    <div className="bloco-campos fade-in">
      <div className="bloco-titulo">Casa / Moradia</div>
      <div className="grid-2">
        <div className="campo campo-grow">
          <label>{pais.logLabel} <span className="obrigatorio">*</span></label>
          <input type="text" placeholder={pais.logLabel}
            value={dados.logradouro || ""} onChange={(e) => onChange("logradouro", e.target.value)} />
        </div>
        <div className="campo campo-pequeno">
          <label>Número <span className="obrigatorio">*</span></label>
          <input type="text" placeholder="Ex: 142"
            value={dados.numero || ""} onChange={(e) => onChange("numero", e.target.value)} />
        </div>
      </div>
      <CamposEndereco dados={dados} onChange={onChange} pais={pais} />
      <div className="grid-2">
        <div className="campo">
          <label>Lote / Quadra</label>
          <input type="text" placeholder="Ex: Lote 12"
            value={dados.loteQuadra || ""} onChange={(e) => onChange("loteQuadra", e.target.value)} />
        </div>
        <div className="campo">
          <label>Complemento</label>
          <input type="text" placeholder="Ex: Fundos"
            value={dados.complemento || ""} onChange={(e) => onChange("complemento", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function FormApartamento({ dados, onChange, pais }) {
  return (
    <div className="bloco-campos fade-in">
      <div className="bloco-titulo">Apartamento / Fração</div>
      <div className="grid-2">
        <div className="campo campo-grow">
          <label>Nome do Edifício / Condomínio <span className="obrigatorio">*</span></label>
          <input type="text" placeholder="Ex: Residencial Beira Mar"
            value={dados.condominio || ""} onChange={(e) => onChange("condominio", e.target.value)} />
        </div>
        <div className="campo campo-pequeno">
          <label>Bloco</label>
          <input type="text" placeholder="Ex: A"
            value={dados.bloco || ""} onChange={(e) => onChange("bloco", e.target.value)} />
        </div>
      </div>
      <div className="grid-3">
        <div className="campo">
          <label>Número da Unidade <span className="obrigatorio">*</span></label>
          <input type="text" placeholder="Ex: 304"
            value={dados.unidade || ""} onChange={(e) => onChange("unidade", e.target.value)} />
        </div>
        <div className="campo">
          <label>Pavimento / Andar <span className="obrigatorio">*</span></label>
          <input type="text" placeholder="Ex: 3º andar"
            value={dados.andar || ""} onChange={(e) => onChange("andar", e.target.value)} />
        </div>
        <div className="campo">
          <label>Vaga de Garagem</label>
          <input type="text" placeholder="Ex: Vaga 15"
            value={dados.vaga || ""} onChange={(e) => onChange("vaga", e.target.value)} />
        </div>
      </div>
      <div className="grid-2">
        <div className="campo campo-grow">
          <label>{pais.logLabel} <span className="obrigatorio">*</span></label>
          <input type="text" placeholder={pais.logLabel}
            value={dados.logradouro || ""} onChange={(e) => onChange("logradouro", e.target.value)} />
        </div>
        <div className="campo campo-pequeno">
          <label>Número <span className="obrigatorio">*</span></label>
          <input type="text" placeholder="Ex: 500"
            value={dados.numero || ""} onChange={(e) => onChange("numero", e.target.value)} />
        </div>
      </div>
      <CamposEndereco dados={dados} onChange={onChange} pais={pais} />
      <div className="campo">
        <label>Complemento</label>
        <input type="text" placeholder="Próximo à portaria B"
          value={dados.complemento || ""} onChange={(e) => onChange("complemento", e.target.value)} />
      </div>
    </div>
  );
}

function FormOutro({ dados, onChange, pais }) {
  return (
    <div className="bloco-campos fade-in">
      <div className="bloco-titulo">Outro Imóvel</div>
      <div className="campo" style={{ marginBottom: 14 }}>
        <label>Tipo / Descrição <span className="obrigatorio">*</span></label>
        <input type="text" placeholder="Ex: Galpão, Sala comercial, Terreno..."
          value={dados.descricao || ""} onChange={(e) => onChange("descricao", e.target.value)} />
      </div>
      <div className="grid-2">
        <div className="campo campo-grow">
          <label>{pais.logLabel} <span className="obrigatorio">*</span></label>
          <input type="text" placeholder={pais.logLabel}
            value={dados.logradouro || ""} onChange={(e) => onChange("logradouro", e.target.value)} />
        </div>
        <div className="campo campo-pequeno">
          <label>Número</label>
          <input type="text" placeholder="S/N"
            value={dados.numero || ""} onChange={(e) => onChange("numero", e.target.value)} />
        </div>
      </div>
      <CamposEndereco dados={dados} onChange={onChange} pais={pais} />
      <div className="campo">
        <label>Complemento</label>
        <input type="text" placeholder="Referência ou complemento"
          value={dados.complemento || ""} onChange={(e) => onChange("complemento", e.target.value)} />
      </div>
    </div>
  );
}

export default function ImovelForm({ dados = {}, onChange, paisCodigo = "BR" }) {
  const [tipo, setTipo] = useState(dados.tipo || "");
  const [campos, setCampos] = useState(dados.campos || {});
  const pais = getPais(paisCodigo);

  function selecionarTipo(novoTipo) {
    setTipo(novoTipo);
    setCampos({});
    onChange?.({ tipo: novoTipo, campos: {} });
  }

  function atualizarCampo(chave, valor) {
    const novosCampos = { ...campos, [chave]: valor };
    setCampos(novosCampos);
    onChange?.({ tipo, campos: novosCampos });
  }

  return (
    <section className="secao">
      <h2 className="secao-titulo">🏠 Identificação do Imóvel</h2>
      <div className="seletor-tipo">
        {[
          { id: "casa",        label: "🏠 Casa / Moradia" },
          { id: "apartamento", label: "🏢 Apartamento" },
          { id: "outro",       label: "🏗️ Outro" },
        ].map((t) => (
          <button key={t.id}
            className={`btn-tipo ${tipo === t.id ? "ativo" : ""}`}
            onClick={() => selecionarTipo(t.id)} type="button">
            {t.label}
          </button>
        ))}
      </div>
      {tipo === "casa"        && <FormCasa        dados={campos} onChange={atualizarCampo} pais={pais} />}
      {tipo === "apartamento" && <FormApartamento dados={campos} onChange={atualizarCampo} pais={pais} />}
      {tipo === "outro"       && <FormOutro       dados={campos} onChange={atualizarCampo} pais={pais} />}
      {!tipo && (
        <div className="estado-vazio">
          Selecione o tipo de imóvel acima para preencher o endereço
        </div>
      )}
    </section>
  );
}
