import { useEffect, useRef, useState } from "react";

const CHAVE = "vistoria_rascunho";
const DELAY_MS = 1500; // salva 1.5s após a última alteração

export function useAutoSave(dados) {
  const [ultimoSalvo, setUltimoSalvo] = useState(null);
  const timerRef = useRef(null);

  // Salva no localStorage com debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(CHAVE, JSON.stringify(dados));
        setUltimoSalvo(new Date());
      } catch (err) {
        console.warn("Erro ao salvar rascunho:", err);
      }
    }, DELAY_MS);

    return () => clearTimeout(timerRef.current);
  }, [dados]);

  return { ultimoSalvo };
}

// Verifica se existe rascunho salvo
export function temRascunho() {
  return !!localStorage.getItem(CHAVE);
}

// Carrega o rascunho salvo
export function carregarRascunho() {
  try {
    const raw = localStorage.getItem(CHAVE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Apaga o rascunho (após finalizar ou ao criar novo)
export function limparRascunho() {
  localStorage.removeItem(CHAVE);
}
