import imageCompression from "browser-image-compression";

/**
 * Comprime um arquivo de imagem para uso no PDF.
 * Retorna uma string base64 pronta para uso.
 */
export async function redimensionarFoto(arquivo, opcoes = {}) {
  const config = {
    maxSizeMB: 0.5,          // máximo 500kb por foto
    maxWidthOrHeight: 1200,  // máximo 1200px
    useWebWorker: true,
    ...opcoes,
  };

  try {
    const comprimido = await imageCompression(arquivo, config);
    return await fileParaBase64(comprimido);
  } catch (err) {
    console.warn("Erro ao comprimir imagem, usando original:", err);
    return await fileParaBase64(arquivo);
  }
}

/**
 * Converte File/Blob para string base64.
 */
export function fileParaBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Erro ao converter imagem"));
    reader.readAsDataURL(file);
  });
}
