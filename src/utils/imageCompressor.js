// src/utils/imageCompressor.js

/**
 * Compress an image File or Data URL to a lightweight JPEG Data URL (~30KB-60KB).
 * Fits inside Firestore / Realtime Database document limits with zero Firebase Storage dependency.
 */
export const compressImage = (fileOrDataUrl, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    if (!fileOrDataUrl) return resolve(null);

    const processImageSrc = (src) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => resolve(src);
    };

    if (fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => processImageSrc(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(fileOrDataUrl);
    } else if (typeof fileOrDataUrl === 'string') {
      processImageSrc(fileOrDataUrl);
    } else {
      resolve(null);
    }
  });
};
