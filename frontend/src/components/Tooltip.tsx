import { useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const WIDTH = 288;
const MARGIN = 8;

/**
 * Dica exibida ao passar o mouse, focar pelo teclado ou tocar (toque alterna a dica).
 * Renderizada no body com posição fixa para não ser cortada por áreas com rolagem.
 */
export function Tooltip({ content, children, label }: { content: ReactNode; children: ReactNode; label: string }) {
    const id = useId();
    const ref = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState<{ left: number; top: number; below: boolean } | null>(null);
    // Num toque, o navegador dispara "hover" e "click" em sequência; o estado antes do toque decide se abre ou fecha
    const openBeforePress = useRef(false);

    const show = () => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const half = WIDTH / 2;
        const left = Math.min(Math.max(rect.left + rect.width / 2, half + MARGIN), window.innerWidth - half - MARGIN);
        const below = rect.top < 150;
        setPosition({ left, top: below ? rect.bottom + MARGIN : rect.top - MARGIN, below });
    };
    const hide = () => setPosition(null);

    return (
        <button
            ref={ref}
            type="button"
            aria-label={label}
            aria-describedby={position ? id : undefined}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
            onKeyDown={e => e.key === 'Escape' && hide()}
            onPointerDown={() => {
                openBeforePress.current = position !== null;
            }}
            onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                if (openBeforePress.current) hide();
                else show();
                openBeforePress.current = false;
            }}
            className="-m-1.5 inline-flex cursor-help rounded-full p-1.5"
        >
            {children}
            {position &&
                createPortal(
                    <div
                        id={id}
                        role="tooltip"
                        style={{ left: position.left, top: position.top, width: WIDTH }}
                        className={`pointer-events-none fixed z-50 -translate-x-1/2 rounded-lg bg-foreground px-3 py-2 text-left text-xs leading-relaxed font-normal text-white shadow-lg ${
                            position.below ? '' : '-translate-y-full'
                        }`}
                    >
                        {content}
                    </div>,
                    document.body,
                )}
        </button>
    );
}
