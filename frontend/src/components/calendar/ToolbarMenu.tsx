import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/** Native disclosure with outside-click and Escape dismissal; no menu-role trap. */
export default function ToolbarMenu({ label, className = '', children }: {
  label: ReactNode; className?: string; children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (ref.current?.open && event.target instanceof Node && !ref.current.contains(event.target)) ref.current.open = false;
    }
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);
  return <details ref={ref} className={`toolbar-menu ${className}`} onKeyDown={event => {
    if (event.key === 'Escape' && ref.current?.open) {
      ref.current.open = false;
      ref.current.querySelector('summary')?.focus();
      event.stopPropagation();
    }
  }}><summary>{label}</summary><div className="toolbar-menu-content">{children}</div></details>;
}
