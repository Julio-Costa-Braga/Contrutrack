import { useState } from "react";

const NORMA_TEXTO = `Normas e Referências Técnicas:
Eurocódigo 0 — Bases para o Projeto de Estruturas
Eurocódigo 1 — Ações em Estruturas
Eurocódigo 2 — Projeto de Estruturas de Betão
Regulamento Geral das Edificações Urbanas (RGEU)
ETAG/EAD aplicáveis a sistemas de impermeabilização e selagem
Recomendações LNEC aplicáveis a patologias da construção e impermeabilizações`;

const MODELOS = [
  {
    id: "otimo",
    label: "Ótimas condições",
    cor: "#16a34a",
    bg: "#f0fdf4",
    borda: "#86efac",
    texto: `PARECER TÉCNICO — CONDIÇÕES ÓTIMAS

1. OBJETO DA VISTORIA

O presente parecer técnico refere-se à vistoria realizada em ___/___/______, no imóvel situado em ______________________, tendo como objetivo a avaliação das condições gerais de conservação, habitabilidade e segurança.

2. ANÁLISE REALIZADA

2.1. Estrutura
Não foram identificadas patologias estruturais. Paredes, lajes e pilares encontram-se em perfeito estado de conservação, sem fissuras, deformações ou quaisquer sinais de comprometimento.

2.2. Revestimentos
Pisos, paredes e tetos apresentam acabamento íntegro, sem trincas, desplacamentos ou manchas. Os materiais de revestimento encontram-se bem aderidos e em bom estado estético.

2.3. Caixilharias
Portas e janelas apresentam funcionamento adequado, sem folgas, oxidação ou comprometimento da vedação. Os mecanismos de abertura e fecho operam corretamente.

2.4. Instalações Elétricas
Tomadas, interruptores e quadro de disjuntores encontram-se em conformidade, sem sinais de sobrecarga, aquecimento ou danos.

2.5. Instalações Hidráulicas
Não foram identificados vazamentos. Torneiras, ralos e louças sanitárias apresentam bom funcionamento e vedação adequada.

2.6. Impermeabilização
Sem indícios de infiltração ou umidade ascendente em qualquer dos compartimentos vistoriados.

3. CONCLUSÃO

O imóvel encontra-se em plenas condições de habitabilidade, não sendo necessária qualquer intervenção corretiva imediata. Recomenda-se a adoção de um plano de manutenção preventiva periódica, em conformidade com a regulamentação aplicável.

${NORMA_TEXTO}
Responsável Técnica: Eng. Marilia Souza`,
  },
  {
    id: "bom",
    label: "Boas condições — reparos leves",
    cor: "#d97706",
    bg: "#fffbeb",
    borda: "#fcd34d",
    texto: `PARECER TÉCNICO — BOAS CONDIÇÕES COM REPAROS LEVES

1. OBJETO DA VISTORIA

O presente parecer técnico refere-se à vistoria realizada em ___/___/______, no imóvel situado em ______________________, tendo como objetivo a avaliação das condições gerais de conservação, habitabilidade e segurança.

2. ANÁLISE REALIZADA

2.1. Estrutura
Sem patologias estruturais identificadas. Eventuais fissuras observadas são de natureza superficial, circunscritas ao revestimento, sem comprometimento da estabilidade dos elementos portantes.

2.2. Revestimentos
Pequenos sinais de desgaste natural identificados em ____________________, sem comprometimento funcional do ambiente. Recomenda-se reparação localizada.

2.3. Caixilharias
Portas e janelas em bom estado geral. Observadas pequenas irregularidades em ____________________, sem prejuízo da segurança ou estanquidade.

2.4. Instalações Elétricas
Em conformidade geral. Recomenda-se verificação preventiva de ____________________.

2.5. Instalações Hidráulicas
Funcionamento adequado. Assinala-se ____________________, que demanda atenção preventiva.

2.6. Umidade
Sem infiltrações ativas. Manchas residuais identificadas em ____________________, de origem antiga e já estabilizadas, sem evolução aparente.

3. RECOMENDAÇÕES

3.1. Executar reparações nos itens assinalados no prazo recomendado de 60 dias.
3.2. Realizar revisão geral de pintura nas áreas indicadas.
3.3. Efetuar manutenção preventiva das caixilharias e vedações.

4. CONCLUSÃO

O imóvel encontra-se APTO para habitação. As inconformidades identificadas são de baixa complexidade e não impedem o uso imediato do imóvel, devendo, no entanto, ser objeto de intervenção no prazo recomendado.

${NORMA_TEXTO}
Responsável Técnica: Eng. Marilia Souza`,
  },
  {
    id: "regular",
    label: "Condições regulares — reparos necessários",
    cor: "#ea580c",
    bg: "#fff7ed",
    borda: "#fdba74",
    texto: `PARECER TÉCNICO — CONDIÇÕES REGULARES

1. OBJETO DA VISTORIA

O presente parecer técnico refere-se à vistoria realizada em ___/___/______, no imóvel situado em ______________________, tendo como objetivo a avaliação das condições gerais de conservação, habitabilidade e segurança.

2. ANÁLISE REALIZADA

2.1. Estrutura
Identificadas fissuras/trincas em ____________________. Recomenda-se acompanhamento técnico para avaliação da eventual progressão.

2.2. Revestimentos
Desplacamento de revestimento identificado em ____________________. Risco de queda de material — intervenção necessária.

2.3. Caixilharias
Comprometimento de vedação em ____________________, com possibilidade de entrada de umidade e pragas.

2.4. Instalações Elétricas
Irregularidades identificadas em ____________________. Requer adequação à regulamentação em vigor.

2.5. Instalações Hidráulicas
Vazamento/entupimento identificado em ____________________. Recomenda-se intervenção técnica especializada.

2.6. Umidade
Infiltração ativa identificada em ____________________, com origem em ____________________. Gravidade: Moderada.

3. INTERVENÇÕES NECESSÁRIAS

1. ____________________________________________________________
2. ____________________________________________________________
3. ____________________________________________________________
4. ____________________________________________________________

4. CONCLUSÃO

O imóvel apresenta condições REGULARES de habitabilidade. O uso é PERMITIDO com ressalvas, condicionado à execução das intervenções acima listadas no prazo estipulado. Recomenda-se nova vistoria após conclusão das obras.

${NORMA_TEXTO}
Responsável Técnica: Eng. Marilia Souza`,
  },
  {
    id: "critico",
    label: "Irregularidades graves — uso não recomendado",
    cor: "#dc2626",
    bg: "#fef2f2",
    borda: "#fca5a5",
    texto: `PARECER TÉCNICO — IRREGULARIDADES GRAVES

1. OBJETO DA VISTORIA

O presente parecer técnico refere-se à vistoria realizada em ___/___/______, no imóvel situado em ______________________, tendo como objetivo a avaliação das condições gerais de conservação, habitabilidade e segurança.

2. ANÁLISE REALIZADA

2.1. Estrutura
____________________ — Nível de comprometimento: CRÍTICO. Risco de colapso parcial identificado em ____________________. Exige intervenção estrutural urgente.

2.2. Revestimentos
Desplacamento extenso em ____________________, com risco iminente de queda sobre os utilizadores.

2.3. Caixilharias
____________________ com comprometimento total de vedação e segurança, requerendo substituição urgente.

2.4. Instalações Elétricas
Instalação em situação de risco iminente. Identificados: ____________________. Perigo de curto-circuito e incêndio.

2.5. Instalações Hidráulicas
____________________ com comprometimento estrutural adjacente por saturação do substrato.

2.6. Umidade
Infiltração de gravidade CRÍTICA em ____________________, com comprometimento de elementos estruturais e risco para a saúde dos ocupantes.

3. RISCOS IDENTIFICADOS

3.1. Risco estrutural: ____________________________________________________
3.2. Risco elétrico: ______________________________________________________
3.3. Risco à saúde: ______________________________________________________

4. INTERVENÇÕES OBRIGATÓRIAS — CARÁTER URGENTE

4.1. INTERDIÇÃO IMEDIATA das áreas: ____________________
4.2. ____________________________________________________________
4.3. ____________________________________________________________
4.4. ____________________________________________________________
4.5. ____________________________________________________________

5. CONCLUSÃO

O imóvel NÃO se encontra apto para habitação nas condições atuais. Recomenda-se a INTERDIÇÃO IMEDIATA das áreas afetadas e a execução urgente das intervenções acima indicadas. O presente parecer não exime o proprietário das responsabilidades legais perante os ocupantes.

${NORMA_TEXTO}
Responsável Técnica: Eng. Marilia Souza`,
  },
];

export default function ParecerFinal({ texto = "", onChange, dataVistoria, enderecoCompleto = "" }) {
  const [modeloAtivo, setModeloAtivo] = useState(null);

  function aplicarModelo(modelo) {
    if (texto && !window.confirm("Isso vai substituir o texto atual. Deseja continuar?")) return;
    let novoTexto = modelo.texto;
    if (dataVistoria) {
      novoTexto = novoTexto.replace("___/___/______", dataVistoria);
    }
    if (enderecoCompleto) {
      novoTexto = novoTexto.replace("______________________", enderecoCompleto);
    }
    onChange?.(novoTexto);
    setModeloAtivo(modelo.id);
  }

  return (
    <section className="secao">
      <h2 className="secao-titulo">📝 Parecer Técnico Final</h2>

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
          Modelos de parecer — clique para preencher automaticamente:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {MODELOS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => aplicarModelo(m)}
              style={{
                padding: "10px 14px",
                border: `2px solid ${modeloAtivo === m.id ? m.cor : "#e2e8f0"}`,
                borderRadius: 8,
                background: modeloAtivo === m.id ? m.bg : "#f8fafc",
                color: modeloAtivo === m.id ? m.cor : "#475569",
                fontWeight: modeloAtivo === m.id ? 600 : 400,
                fontSize: 13,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}
              onMouseOver={(e) => {
                if (modeloAtivo !== m.id) {
                  e.currentTarget.style.borderColor = m.cor;
                  e.currentTarget.style.background = m.bg;
                  e.currentTarget.style.color = m.cor;
                }
              }}
              onMouseOut={(e) => {
                if (modeloAtivo !== m.id) {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.color = "#475569";
                }
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="campo" style={{ marginBottom: 14 }}>
        <label>
          Conclusão técnica
          <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 11, marginLeft: 6 }}>
            (edite livremente o modelo ou escreva do zero)
          </span>
        </label>
        <textarea
          rows={14}
          placeholder="Selecione um modelo acima ou escreva o parecer técnico aqui..."
          value={texto}
          onChange={(e) => {
            onChange?.(e.target.value);
            setModeloAtivo(null);
          }}
          style={{ resize: "vertical", lineHeight: 1.7, fontFamily: "monospace", fontSize: 13 }}
        />
      </div>

      <div style={{
        padding: "10px 14px", background: "#f8fafc",
        border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12, color: "#475569",
      }}>
        {NORMA_TEXTO.split("\n").map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </section>
  );
}
