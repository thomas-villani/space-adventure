import { POSTCARD_TEMPLATES } from '../data/postcardTemplates.js';

export class PhotoManager {
  constructor(storage) {
    this.storage = storage;
  }

  // Capture the current render as a JPEG data URL
  // Must call renderer.render() right before to ensure buffer is fresh
  capture(renderer, scene, camera) {
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/jpeg', 0.6);
  }

  savePhoto(dataUrl, metadata) {
    this.storage.savePhoto({
      dataUrl,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  savePostcard(dataUrl, metadata) {
    this.storage.savePostcard({
      dataUrl,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  getPhotos() { return this.storage.getPhotos(); }
  getPostcards() { return this.storage.getPostcards(); }
  deletePhoto(index) { return this.storage.deletePhoto(index); }
  deletePostcard(index) { return this.storage.deletePostcard(index); }

  // Get all gallery items (photos + postcards) sorted newest first
  getGallery() {
    const photos = this.getPhotos().map((p, i) => ({ ...p, galleryType: 'photo', index: i }));
    const postcards = this.getPostcards().map((p, i) => ({ ...p, galleryType: 'postcard', index: i }));
    return [...photos, ...postcards].sort((a, b) => b.timestamp - a.timestamp);
  }

  // Compose a postcard on a 2D canvas and return data URL (async due to image loading)
  composePostcard(photoDataUrl, planetData, playerName) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.onload = () => {
        // Draw photo as background, cover the canvas
        ctx.drawImage(img, 0, 0, 800, 600);

        // Planet-themed border
        const colorHex = '#' + (planetData?.color || 0x87CEEB).toString(16).padStart(6, '0');
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 14;
        ctx.strokeRect(7, 7, 786, 586);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(18, 18, 764, 564);

        // Banner at top
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, 800, 65);
        ctx.font = 'bold 34px "Fredoka One", cursive, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`Greetings from ${planetData?.name || 'Space'}!`, 400, 35);

        // Text box at bottom
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 510, 800, 90);
        ctx.font = '20px "Fredoka One", cursive, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'top';

        const templates = POSTCARD_TEMPLATES[planetData?.id] || POSTCARD_TEMPLATES.default;
        const template = templates.messages[Math.floor(Math.random() * templates.messages.length)];
        const fact = planetData?.facts?.[0] || 'Space is amazing!';
        const message = template
          .replace('{name}', planetData?.name || 'Space')
          .replace('{fact}', fact)
          .replace('{player}', playerName);

        this._drawWrappedText(ctx, message, 400, 520, 720, 24);

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      // Fallback if image fails
      img.onerror = () => {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 800, 600);
        ctx.font = 'bold 34px "Fredoka One", cursive, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`Greetings from ${planetData?.name || 'Space'}!`, 400, 300);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = photoDataUrl;
    });
  }

  _drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line.trim(), x, currentY);
        line = word + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
  }

  downloadImage(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename || 'space-adventure-photo.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
