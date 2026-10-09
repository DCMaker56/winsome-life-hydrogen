/*
 * UploadEditor — crop/zoom + background removal for customer-uploaded art.
 *
 * Flow: pick a file → this modal opens → zoom + drag to frame (e.g. crop to a
 * face) → optional "Remove background" (edge flood-fill: clears the areas
 * connected to the image edges that match the background color — great for
 * solid/simple backgrounds) → Undo steps back → Submit exports the framed
 * square as a PNG data URL for the live preview.
 */
import { useEffect, useRef, useState } from "react";
import { Undo2, Wand2, X } from "lucide-react";

const VIEW = 320; // on-screen crop viewport (square)
const OUT = 1024; // exported resolution

export function UploadEditor({
  src,
  onSubmit,
  onCancel,
}: {
  src: string;
  onSubmit: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  // Edit layers: original first, each background-removal pushes a new frame.
  const [frames, setFrames] = useState<HTMLCanvasElement[]>([]);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Load the image into the base frame.
  useEffect(() => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement("canvas");
      c.width = im.naturalWidth;
      c.height = im.naturalHeight;
      c.getContext("2d")!.drawImage(im, 0, 0);
      setImg(im);
      setFrames([c]);
    };
    im.src = src;
  }, [src]);

  const current = frames[frames.length - 1];

  // Base cover-fit scale so the image always fills the viewport at zoom 1.
  const baseScale = current ? Math.max(VIEW / current.width, VIEW / current.height) : 1;
  const scale = baseScale * zoom;

  // Clamp panning so the image always covers the crop viewport.
  const clampOffset = (o: { x: number; y: number }, z = zoom) => {
    if (!current) return o;
    const s = baseScale * z;
    const maxX = Math.max(0, (current.width * s - VIEW) / 2);
    const maxY = Math.max(0, (current.height * s - VIEW) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, o.x)), y: Math.min(maxY, Math.max(-maxY, o.y)) };
  };

  // Redraw the viewport whenever anything changes.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !current) return;
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, VIEW, VIEW);
    // checkerboard = transparency
    for (let y = 0; y < VIEW; y += 16)
      for (let x = 0; x < VIEW; x += 16) {
        ctx.fillStyle = (x + y) % 32 ? "#f0ece5" : "#ffffff";
        ctx.fillRect(x, y, 16, 16);
      }
    const w = current.width * scale;
    const h = current.height * scale;
    ctx.drawImage(current, VIEW / 2 - w / 2 + offset.x, VIEW / 2 - h / 2 + offset.y, w, h);
  }, [current, scale, offset]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setOffset(
      clampOffset({
        x: drag.current.ox + (e.clientX - drag.current.x),
        y: drag.current.oy + (e.clientY - drag.current.y),
      }),
    );
  };
  const onPointerUp = () => (drag.current = null);

  /** Edge flood-fill background removal: clears everything connected to the
   *  image border that's within tolerance of the border color. */
  const removeBackground = () => {
    if (!current || busy) return;
    setBusy(true);
    // Work at a capped size for speed, then scale the mask back up.
    setTimeout(() => {
      const W = current.width;
      const H = current.height;
      const cap = 700;
      const f = Math.min(1, cap / Math.max(W, H));
      const w = Math.round(W * f);
      const h = Math.round(H * f);
      const small = document.createElement("canvas");
      small.width = w;
      small.height = h;
      const sctx = small.getContext("2d")!;
      sctx.drawImage(current, 0, 0, w, h);
      const id = sctx.getImageData(0, 0, w, h);
      const d = id.data;

      // Background reference = average of the 4 corners.
      const corner = (x: number, y: number) => {
        const i = (y * w + x) * 4;
        return [d[i], d[i + 1], d[i + 2]];
      };
      const refs = [corner(0, 0), corner(w - 1, 0), corner(0, h - 1), corner(w - 1, h - 1)];
      const tol = 42;
      const isBg = (i: number) => {
        for (const [r, g, b] of refs) {
          const dr = d[i] - r, dg = d[i + 1] - g, db = d[i + 2] - b;
          if (Math.sqrt(dr * dr + dg * dg + db * db) < tol) return true;
        }
        return false;
      };

      // BFS from every edge pixel that matches the background.
      const seen = new Uint8Array(w * h);
      const queue: number[] = [];
      for (let x = 0; x < w; x++) {
        queue.push(x, (h - 1) * w + x);
      }
      for (let y = 0; y < h; y++) {
        queue.push(y * w, y * w + w - 1);
      }
      while (queue.length) {
        const p = queue.pop()!;
        if (seen[p]) continue;
        seen[p] = 1;
        if (!isBg(p * 4)) continue;
        d[p * 4 + 3] = 0; // clear
        const x = p % w, y = (p / w) | 0;
        if (x > 0) queue.push(p - 1);
        if (x < w - 1) queue.push(p + 1);
        if (y > 0) queue.push(p - w);
        if (y < h - 1) queue.push(p + w);
      }
      sctx.putImageData(id, 0, 0);

      // Apply the small alpha mask to the full-res frame.
      const next = document.createElement("canvas");
      next.width = W;
      next.height = H;
      const nctx = next.getContext("2d")!;
      nctx.drawImage(current, 0, 0);
      nctx.globalCompositeOperation = "destination-in";
      // draw the small mask scaled up — alpha channel carries the cut
      const mask = document.createElement("canvas");
      mask.width = W;
      mask.height = H;
      const mctx = mask.getContext("2d")!;
      mctx.imageSmoothingEnabled = true;
      mctx.drawImage(small, 0, 0, W, H);
      nctx.drawImage(mask, 0, 0);
      setFrames((fr) => [...fr, next]);
      setBusy(false);
    }, 30);
  };

  const undo = () => setFrames((fr) => (fr.length > 1 ? fr.slice(0, -1) : fr));

  const submit = () => {
    if (!current) return;
    const out = document.createElement("canvas");
    out.width = OUT;
    out.height = OUT;
    const ctx = out.getContext("2d")!;
    const k = OUT / VIEW;
    const w = current.width * scale * k;
    const h = current.height * scale * k;
    ctx.drawImage(current, OUT / 2 - w / 2 + offset.x * k, OUT / 2 - h / 2 + offset.y * k, w, h);
    onSubmit(out.toDataURL("image/png"));
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-[#2D2D2D]/50 flex items-center justify-center p-4"
      role="dialog"
      aria-label="Adjust your image"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white w-full max-w-[400px] p-5 rounded-sm shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg text-[#2D2D2D]">Adjust your image</h3>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-[#2D2D2D]/50 hover:text-[#2D2D2D]">
            <X size={18} />
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={VIEW}
          height={VIEW}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="mx-auto border border-[#C9A96E]/30 cursor-grab active:cursor-grabbing touch-none"
          style={{ width: VIEW, height: VIEW }}
        />

        <div className="flex items-center gap-3 mt-4">
          <span className="font-sans text-[10px] tracking-[0.1em] uppercase text-[#2D2D2D]/50">Zoom</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => {
              const z = Number(e.target.value);
              setZoom(z);
              setOffset((o) => clampOffset(o, z));
            }}
            className="flex-1 accent-[#C9A96E]"
            aria-label="Zoom"
          />
        </div>
        <p className="font-sans text-[11px] text-[#2D2D2D]/45 mt-1">Drag the image to frame it — zoom in on a face, a pet, anything.</p>

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={removeBackground}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-1.5 border border-[#C9A96E]/40 py-2.5 font-sans font-medium text-[11px] tracking-[0.08em] uppercase text-[#2D2D2D] hover:border-[#C9A96E] disabled:opacity-50"
          >
            <Wand2 size={13} /> {busy ? "Working…" : "Remove background"}
          </button>
          <button
            type="button"
            onClick={undo}
            disabled={frames.length < 2}
            className="inline-flex items-center justify-center gap-1.5 border border-[#C9A96E]/40 px-4 py-2.5 font-sans font-medium text-[11px] tracking-[0.08em] uppercase text-[#2D2D2D] hover:border-[#C9A96E] disabled:opacity-40"
          >
            <Undo2 size={13} /> Undo
          </button>
        </div>

        <button
          type="button"
          onClick={submit}
          className="w-full mt-2 bg-[#2D2D2D] text-white py-3 font-sans font-medium text-[12px] tracking-[0.12em] uppercase hover:bg-[#C9A96E] transition-colors"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
