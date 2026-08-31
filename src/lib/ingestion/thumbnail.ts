// PRD §5.2, §7.1 étape 6 — vignette JPEG 400px de large, qualité 0.8.
// Le passage par canvas dépouille naturellement les métadonnées EXIF (§9.1).

export async function makeThumbnail(bytes: Uint8Array, mimeType: string): Promise<Blob> {
  const blob = new Blob([bytes as unknown as BlobPart], { type: mimeType });
  const bitmap = await createImageBitmap(blob);

  const targetWidth = 400;
  const scale = Math.min(1, targetWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non disponible");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (out) => (out ? resolve(out) : reject(new Error("Échec de génération de la vignette"))),
      "image/jpeg",
      0.8,
    );
  });
}
