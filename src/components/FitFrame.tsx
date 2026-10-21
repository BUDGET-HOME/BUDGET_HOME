"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

export default function FitFrame({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;

    const apply = () => {
      const width = host.clientWidth;
      const available = host.clientHeight;
      if (width <= 0 || available <= 0) return;
      inner.style.transform = "none";
      inner.style.minWidth = "0px";
      let layoutWidth = width;
      let scale = 1;
      for (let pass = 0; pass < 4; pass += 1) {
        inner.style.maxWidth = `${layoutWidth}px`;
        inner.style.width = `${layoutWidth}px`;
        const needed = inner.scrollHeight;
        scale = Math.min(1, available / Math.max(needed, 1));
        const nextWidth = scale >= 0.999 ? width : width / scale;
        if (Math.abs(nextWidth - layoutWidth) < 1) break;
        layoutWidth = nextWidth;
      }
      inner.style.transformOrigin = "top left";
      inner.style.transform = scale < 0.999 ? `scale(${scale})` : "none";
      const visual = inner.getBoundingClientRect().width;
      if (visual > width + 1) {
        const fitted = scale * (width / visual);
        inner.style.transform = fitted < 0.999 ? `scale(${fitted})` : "none";
      }
    };

    apply();
    const raf = requestAnimationFrame(apply);
    const resize = new ResizeObserver(apply);
    resize.observe(host);
    const mutations = new MutationObserver(apply);
    mutations.observe(inner, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", apply);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      style={{ contain: "inline-size" }}
      className="fit-frame-host relative min-h-0 h-full w-full min-w-0 flex-1 overflow-hidden"
    >
      <div ref={innerRef} className="fit-frame-inner absolute left-0 top-0 min-w-0">
        {children}
      </div>
    </div>
  );
}
