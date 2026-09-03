// PRD §5.2, §7.1 étape 6 — vignette JPEG 400px de large, qualité 0.8.
// Le passage par canvas dépouille naturellement les métadonnées EXIF (§9.1).
//
// Reels/stories (Lot 5) sont des vidéos : createImageBitmap() ne les décode
// pas (il attend une image, jamais un flux vidéo), d'où l'absence totale de
// vignette sur ces formats malgré la liste blanche autorisant le .mp4.
// Chemin séparé : décodage via <video> hors DOM, on avance à la première
// image utile (0 s peut être un cadre noir de transition) puis on dessine
// l'image courante sur le même canvas que pour les photos.
//
// DORMANT depuis le 2026-09-03 : les exports désormais déposés ne
// contiennent plus jamais media/**/*.{jpg,png,mp4} (régime permanent, pas
// une anomalie ponctuelle) — makeThumbnail() n'est donc plus jamais
// exercé en pratique (aucun mediaFiles n'atteint uploadOneMediaFile dans
// upload-import.ts). Conservé tel quel, pas supprimé : c'est la spec
// correcte le jour où un export complet (avec media/) arrive à nouveau.

async function makeImageThumbnail(bytes: Uint8Array, mimeType: string): Promise<Blob> {
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

  return canvasToJpeg(canvas);
}

async function makeVideoThumbnail(bytes: Uint8Array, mimeType: string): Promise<Blob> {
  const blob = new Blob([bytes as unknown as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Vidéo illisible"));
    });
    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve();
      video.onerror = () => reject(new Error("Vidéo illisible"));
      // 0.1 s plutôt que 0 : évite un premier cadre parfois noir/transitoire.
      video.currentTime = Math.min(0.1, (video.duration || 1) / 2);
    });

    const targetWidth = 400;
    const scale = Math.min(1, targetWidth / video.videoWidth);
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D non disponible");
    ctx.drawImage(video, 0, 0, width, height);

    return await canvasToJpeg(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (out) => (out ? resolve(out) : reject(new Error("Échec de génération de la vignette"))),
      "image/jpeg",
      0.8,
    );
  });
}

export async function makeThumbnail(bytes: Uint8Array, mimeType: string): Promise<Blob> {
  return mimeType.startsWith("video/") ? makeVideoThumbnail(bytes, mimeType) : makeImageThumbnail(bytes, mimeType);
}
