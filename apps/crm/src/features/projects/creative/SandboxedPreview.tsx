import { useEffect, useRef, useState } from "react";

/**
 * Generated creative code is untrusted (ADR-0004/0007): it is loaded from the
 * separate preview origin into an iframe with `sandbox="allow-scripts"` only —
 * no same-origin access, no navigation of the CRM, no forms, no popups.
 * The creative renders at its true pixel size and is scaled to fit.
 *
 * `srcDoc` (P5-T25, HTML posts): the page is given inline instead of by URL. The sandbox without
 * `allow-same-origin` gives it an opaque origin, so it still cannot read the CRM, its storage or
 * cookies; the page's own CSP blocks every request except its signed asset URLs.
 * `fill`: scale to fit both the width and the height of the parent (which must have a height).
 */
export function SandboxedPreview({
  src,
  srcDoc,
  width,
  height,
  maxHeight = 640,
  fill = false,
  interactive = true,
  title,
}: {
  src?: string;
  srcDoc?: string;
  width: number;
  height: number;
  maxHeight?: number;
  fill?: boolean;
  interactive?: boolean;
  title: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setAvailable({ w: entry!.contentRect.width, h: entry!.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const limitH = fill ? available.h : maxHeight;
  const scale = available.w && limitH ? Math.min(available.w / width, limitH / height) : 0;

  return (
    <div
      ref={box}
      className={fill ? "flex size-full items-center justify-center" : "w-full"}
      data-testid="sandboxed-preview"
    >
      <div
        className="mx-auto overflow-hidden rounded-lg border bg-black/5 shadow-sm"
        style={{ width: width * scale, height: height * scale }}
      >
        {scale > 0 && (
          <iframe
            key={src}
            src={src}
            srcDoc={srcDoc}
            title={title}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            loading="lazy"
            tabIndex={interactive ? undefined : -1}
            data-testid="creative-iframe"
            style={{
              width,
              height,
              border: 0,
              transform: `scale(${scale})`,
              transformOrigin: "0 0",
              pointerEvents: interactive ? undefined : "none",
            }}
          />
        )}
      </div>
    </div>
  );
}
