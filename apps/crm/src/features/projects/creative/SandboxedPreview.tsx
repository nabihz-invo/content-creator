import { useEffect, useRef, useState } from "react";

/**
 * Generated creative code is untrusted (ADR-0004/0007): it is loaded from the
 * separate preview origin into an iframe with `sandbox="allow-scripts"` only —
 * no same-origin access, no navigation of the CRM, no forms, no popups.
 * The creative renders at its true pixel size and is scaled to fit.
 */
export function SandboxedPreview({
  src,
  width,
  height,
  maxHeight = 640,
  title,
}: {
  src: string;
  width: number;
  height: number;
  maxHeight?: number;
  title: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setAvailable(entry!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = available ? Math.min(available / width, maxHeight / height) : 0;

  return (
    <div ref={box} className="w-full">
      <div
        className="mx-auto overflow-hidden rounded-lg border bg-black/5 shadow-sm"
        style={{ width: width * scale, height: height * scale }}
      >
        {scale > 0 && (
          <iframe
            key={src}
            src={src}
            title={title}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            loading="lazy"
            data-testid="creative-iframe"
            style={{
              width,
              height,
              border: 0,
              transform: `scale(${scale})`,
              transformOrigin: "0 0",
            }}
          />
        )}
      </div>
    </div>
  );
}
