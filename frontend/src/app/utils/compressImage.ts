/**
 * Compresses an image File using the browser canvas API.
 * - Scales down images wider/taller than maxDimension
 * - Reduces JPEG quality in steps until size is under maxSizeMB
 * - Falls back to original file if canvas fails
 */
export const compressImage = (
    file: File,
    maxDimension = 2500,
    maxSizeMB = 10
): Promise<File> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                let { width, height } = img;

                // Scale down if too large
                if (width > maxDimension || height > maxDimension) {
                    const ratio = Math.min(maxDimension / width, maxDimension / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, width, height);

                // Try progressively lower quality until under size limit
                let quality = 0.92;
                const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const ext = file.type === 'image/png' ? 'png' : 'jpeg';

                const tryCompress = () => {
                    canvas.toBlob((blob) => {
                        if (!blob) { resolve(file); return; }
                        if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.6) {
                            quality -= 0.05;
                            tryCompress();
                        } else {
                            const compressed = new File(
                                [blob],
                                file.name.replace(/\.[^.]+$/, `.${ext}`),
                                { type: mimeType }
                            );
                            resolve(compressed);
                        }
                    }, mimeType, quality);
                };

                tryCompress();
            };
            img.onerror = () => resolve(file); // fallback
        };
        reader.onerror = () => resolve(file); // fallback
    });
};
