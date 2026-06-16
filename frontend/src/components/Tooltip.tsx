import { useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const WIDTH = 288;
const MARGIN = 8;

/**
 * Dica exibida ao passar o mouse ou focar o elemento (teclado e toque).
 * Renderizada no body com posição fixa, para não ser cortada por tabelas com rolagem.
 */
export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
    const id = useId();
    const ref = useRef<HTMLSpanElement>(null);
    const [position, setPosition] = useState<{ left: number; top: number; below: boolean } | null>(null);

    const show = () => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const half = WIDTH / 2;
        const left = Math.min(Math.max(rect.left + rect.width / 2, half + MARGIN), window.innerWidth - half - MARGIN);
        const below = rect.top < 140;
        setPosition({ left, top: below ? rect.bottom + MARGIN : rect.top - MARGIN, below });
    };
    const hide = () => setPosition(null);

    return (
        <span
            ref={ref}
            tabIndex={0}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
            onClick={e => e.stopPropagation()}
            aria-describedby={position ? id : undefined}
            className="inline-flex cursor-help rounded-full"
        >
            {children}
            {position &&
                createPortal(
                    <div
                        id={id}
                        role="tooltip"
                        style={{ left: position.left, top: position.top, width: WIDTH }}
                        className={`pointer-events-none fixed z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg ${
                            position.below ? '' : '-translate-y-full'
                        }`}
                    >
                        {content}
                    </div>,
                    document.body,
                )}
        </span>
    );
}
