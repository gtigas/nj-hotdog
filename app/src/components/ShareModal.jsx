import { useState, useEffect, useRef, useCallback } from 'react';
import './ShareModal.css';

// ── Canvas card dimensions ───────────────────────────────────────────────────
const W = 1080;
const H = 1350;
const BORDER = 24;
const PAD = 56;
const INNER = BORDER + PAD; // 80px from each edge
const INNER_W = W - 2 * INNER; // 920px usable width

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function cf(size, weight = 'normal', italic = false) {
  return (
    `${italic ? 'italic ' : ''}${weight === 'bold' ? 'bold ' : ''}` +
    `${size}px 'Futura', 'Avenir Next', 'Century Gothic', sans-serif`
  );
}

// ── Card renderer (offscreen canvas) ─────────────────────────────────────────
async function renderCard(canvas, dog, category, rating) {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    const color = category?.borderColor || '#888';
    const ratingNum = rating?.rating;

    const draw = (img) => {
      ctx.clearRect(0, 0, W, H);

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Thick border in category color
      ctx.strokeStyle = color;
      ctx.lineWidth = BORDER;
      ctx.strokeRect(BORDER / 2, BORDER / 2, W - BORDER, H - BORDER);

      // ── Top-left: Symbol (huge) ──────────────────────────────────────────
      const symX = INNER;
      const symBaseY = INNER + 188; // baseline ~190px below top pad
      ctx.font = cf(180, 'bold');
      ctx.fillStyle = '#111111';
      ctx.textAlign = 'left';
      ctx.fillText(dog.symbol, symX, symBaseY, 370);

      // Name
      const nameBaseY = symBaseY + 70;
      ctx.font = cf(44, 'bold');
      ctx.fillStyle = '#111111';
      ctx.fillText(dog.name, symX, nameBaseY, INNER_W - 220);

      // Town · Category
      const locLine = [dog.town, category?.title].filter(Boolean).join(' · ');
      const locBaseY = nameBaseY + 52;
      ctx.font = cf(30);
      ctx.fillStyle = '#888888';
      ctx.fillText(locLine, symX, locBaseY, INNER_W - 220);

      // ── Top-right: Rating circle ─────────────────────────────────────────
      if (ratingNum != null) {
        const CR = 85;
        const CX = W - INNER - CR;
        const CY = INNER + CR + 8;

        // Circle fill
        ctx.beginPath();
        ctx.arc(CX, CY, CR, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // "8/10"
        ctx.font = cf(60, 'bold');
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`${ratingNum}/10`, CX, CY + 22);

        // "MY RATING" label beneath circle
        ctx.font = cf(22, 'bold');
        ctx.fillStyle = '#777777';
        ctx.fillText('MY RATING', CX, CY + CR + 36);
        ctx.textAlign = 'left';
      }

      // ── Center: Hot dog photo ────────────────────────────────────────────
      const photoTop = locBaseY + 42;
      const photoAreaH = 630;
      const photoAreaX = INNER;
      const photoAreaY = photoTop;

      if (img) {
        // object-fit: contain math
        const ia = img.naturalWidth / img.naturalHeight;
        const aa = INNER_W / photoAreaH;
        let dw, dh;
        if (ia > aa) { dw = INNER_W; dh = INNER_W / ia; }
        else          { dh = photoAreaH; dw = photoAreaH * ia; }
        const dx = photoAreaX + (INNER_W - dw) / 2;
        const dy = photoAreaY + (photoAreaH - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
      }

      // ── Bottom-right: tile-style info lines ──────────────────────────────
      const infoTopY = photoAreaY + photoAreaH + 32;
      const infoLineH = 36;
      const rightX = W - INNER;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#555555';

      const infoLines = [];
      if (dog.year != null)
        infoLines.push({ text: `c. ${dog.year}`, italic: false });
      const ingParts = [];
      if (dog.franksRatio) ingParts.push(dog.franksRatio);
      if (dog.ingredients?.length) ingParts.push(dog.ingredients.join(', '));
      if (ingParts.length)
        infoLines.push({ text: ingParts.join(' '), italic: false });
      if (dog.toppingCodes?.length)
        infoLines.push({ text: dog.toppingCodes.join(', '), italic: true });
      if (dog.brand)
        infoLines.push({ text: dog.brand, italic: false });

      let ily = infoTopY;
      for (const { text, italic } of infoLines) {
        ctx.font = cf(27, 'normal', italic);
        ctx.fillText(text, rightX, ily);
        ily += infoLineH;
      }

      // ── Bottom-left: footer ──────────────────────────────────────────────
      const footerLineY = H - INNER - 8;
      ctx.textAlign = 'left';
      ctx.font = cf(27, 'bold');
      ctx.fillStyle = '#C0202E';
      ctx.fillText('The New Jersey Hot Dog Index', INNER, footerLineY - 38);

      ctx.font = cf(22);
      ctx.fillStyle = '#888888';
      ctx.fillText('after the poster by Primitive Pines', INNER, footerLineY);

      resolve();
    };

    if (dog.photo) {
      const img = new Image();
      img.onload = () => draw(img);
      img.onerror = () => draw(null); // degrade gracefully
      img.src = dog.photo;
    } else {
      draw(null);
    }
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ShareModal({ dog, category, rating, onClose }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rendering, setRendering] = useState(true);
  const [copyLabel, setCopyLabel] = useState('Copy image');
  const [copyHint, setCopyHint] = useState('');
  const [canShareFile, setCanShareFile] = useState(false);
  const canvasRef = useRef(null);
  const dialogRef = useRef(null);
  const copyTimerRef = useRef(null);

  const color = category?.borderColor || '#888';

  // Esc closes this modal only (capture phase fires before DetailModal's handler)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose]);

  // Focus on mount
  useEffect(() => { dialogRef.current?.focus(); }, []);

  // Render the card whenever props change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);
    setPreviewUrl(null);

    renderCard(canvas, dog, category, rating).then(() => {
      setPreviewUrl(canvas.toDataURL('image/png'));
      setRendering(false);

      // Feature-detect Web Share API with file support
      canvas.toBlob((blob) => {
        if (!blob) return;
        const f = new File([blob], 'test.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [f] })) setCanShareFile(true);
      });
    });
  }, [dog, category, rating]);

  // Clean up copy timer on unmount
  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const filename = `njhdi-${dog.id}-${slugify(dog.name)}.png`;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCopy = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!navigator.clipboard?.write || !window.ClipboardItem) {
      setCopyHint('Copy not supported here — use Save instead');
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopyLabel('Copied!');
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopyLabel('Copy image'), 2000);
      } catch {
        setCopyHint('Copy not supported here — use Save instead');
      }
    });
  }, []);

  const handleSave = useCallback(() => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }, [filename]);

  const handleWebShare = useCallback(() => {
    canvasRef.current?.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], filename, { type: 'image/png' });
      try {
        await navigator.share({
          title: `${dog.name} — ${rating?.rating}/10`,
          text: `I rated ${dog.name} ${rating?.rating}/10 on the New Jersey Hot Dog Index`,
          files: [file],
        });
      } catch { /* user cancelled or browser declined */ }
    });
  }, [dog, rating, filename]);

  return (
    <div
      className="share-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Share your rating"
    >
      <div
        className="share-card"
        ref={dialogRef}
        tabIndex={-1}
      >
        <button className="share-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 className="share-title">Share your rating</h2>

        {/* Offscreen canvas — never displayed directly */}
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        {/* Live preview */}
        <div className="share-preview-wrap">
          {rendering && <div className="share-rendering">Rendering…</div>}
          {previewUrl && (
            <img
              src={previewUrl}
              alt={`Share card for ${dog.name}`}
              className="share-preview-img"
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="share-btn-row">
          <button
            className="share-btn share-btn-primary"
            style={{ backgroundColor: color }}
            onClick={handleCopy}
            disabled={rendering}
          >
            {copyLabel}
          </button>
          <button
            className="share-btn share-btn-secondary"
            onClick={handleSave}
            disabled={rendering}
          >
            Save PNG
          </button>
          {canShareFile && (
            <button
              className="share-btn share-btn-secondary"
              onClick={handleWebShare}
              disabled={rendering}
            >
              Share…
            </button>
          )}
        </div>

        {copyHint && <p className="share-copy-hint">{copyHint}</p>}
      </div>
    </div>
  );
}
