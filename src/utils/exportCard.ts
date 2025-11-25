import html2canvas from 'html2canvas-pro';

const triggerDownload = (uri: string, filename: string) => {
  console.log("Iniciando download do arquivo:", filename);
  const link = document.createElement("a");
  link.href = uri;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportHighQualityCard = async (
  containerId: string,
  fileName: string,
  backgroundColor = "#1f1f1f"
) => {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Elemento com ID '${containerId}' não encontrado.`);
  }

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: backgroundColor,
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
    });

    const pngUrl = canvas.toDataURL("image/png");
    triggerDownload(pngUrl, `${fileName}.png`);
  } catch (error) {
    console.error("Erro ao gerar o PNG:", error);
    throw new Error("Erro ao gerar a imagem PNG.");
  }
};
