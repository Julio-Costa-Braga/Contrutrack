const CHAVE = "eng-mariliasouza";

export function salvarRascunho(dados) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
    return true;
  } catch (err) {
    console.warn("Erro ao salvar rascunho no localStorage:", err);
    return false;
  }
}

export function carregarRascunho() {
  try {
    const raw = localStorage.getItem(CHAVE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function lerRascunho() {
  return carregarRascunho();
}

export function limparRascunho() {
  localStorage.removeItem(CHAVE);
}

export function temRascunho() {
  return !!localStorage.getItem(CHAVE);
}