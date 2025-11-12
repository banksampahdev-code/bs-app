import imageCompression from 'browser-image-compression';

/**
 * Interface untuk ukuran gambar yang berbeda
 */
export interface ImageSizes {
  desktop: string;  // URL untuk desktop (1200x630)
  tablet: string;   // URL untuk tablet (768x403)
  mobile: string;   // URL untuk mobile (480x252)
}

/**
 * Compress dan resize gambar di browser
 * Target: < 100KB per gambar
 */
export async function compressAndResizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<File> {
  const options = {
    maxSizeMB: 0.1, // 100KB
    maxWidthOrHeight: Math.max(maxWidth, maxHeight),
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.8,
  };

  try {
    const compressedFile = await imageCompression(file, options);

    // Jika masih lebih dari 100KB, compress lagi dengan quality lebih rendah
    if (compressedFile.size > 100 * 1024) {
      const options2 = {
        ...options,
        initialQuality: 0.6,
        maxSizeMB: 0.09,
      };
      return await imageCompression(compressedFile, options2);
    }

    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Gagal mengkompress gambar');
  }
}

/**
 * Crop gambar ke aspect ratio 1.91:1 (standar untuk thumbnail artikel)
 */
export async function cropToAspectRatio(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      const targetAspectRatio = 1.91; // 1200:630
      const imgAspectRatio = img.width / img.height;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;

      // Crop dari tengah untuk mendapatkan aspect ratio yang diinginkan
      if (imgAspectRatio > targetAspectRatio) {
        // Gambar terlalu lebar, crop kiri-kanan
        sourceWidth = img.height * targetAspectRatio;
        sourceX = (img.width - sourceWidth) / 2;
      } else if (imgAspectRatio < targetAspectRatio) {
        // Gambar terlalu tinggi, crop atas-bawah
        sourceHeight = img.width / targetAspectRatio;
        sourceY = (img.height - sourceHeight) / 2;
      }

      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      ctx?.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(croppedFile);
          } else {
            reject(new Error('Gagal crop gambar'));
          }
        },
        'image/jpeg',
        0.9
      );
    };

    img.onerror = () => reject(new Error('Gagal load gambar'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate multiple sizes dari satu gambar
 */
export async function generateImageSizes(file: File): Promise<{
  desktop: File;
  tablet: File;
  mobile: File;
}> {
  // Crop dulu ke aspect ratio yang benar
  const croppedFile = await cropToAspectRatio(file);

  // Generate 3 ukuran berbeda
  const [desktop, tablet, mobile] = await Promise.all([
    compressAndResizeImage(croppedFile, 1200, 630),  // Desktop
    compressAndResizeImage(croppedFile, 768, 403),   // Tablet
    compressAndResizeImage(croppedFile, 480, 252),   // Mobile
  ]);

  return { desktop, tablet, mobile };
}

/**
 * Upload gambar ke Supabase Storage
 */
export async function uploadImagesToStorage(
  files: { desktop: File; tablet: File; mobile: File },
  token: string
): Promise<ImageSizes> {
  const formData = new FormData();
  formData.append('desktop', files.desktop);
  formData.append('tablet', files.tablet);
  formData.append('mobile', files.mobile);

  const response = await fetch('/api/artikel/upload-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Gagal upload gambar');
  }

  const data = await response.json();
  return data.urls;
}

/**
 * Fungsi utama untuk process dan upload gambar artikel
 */
export async function processAndUploadArticleImage(
  file: File,
  token: string
): Promise<ImageSizes> {
  try {
    // Generate berbagai ukuran
    const resizedImages = await generateImageSizes(file);

    // Upload ke storage
    const urls = await uploadImagesToStorage(resizedImages, token);

    return urls;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}
