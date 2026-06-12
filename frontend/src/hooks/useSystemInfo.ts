import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { SystemInfo } from '../api/types';

let cached: Promise<SystemInfo | null> | null = null;

/** Indica se a IA está ativa no backend. Consultado uma vez por carregamento da página. */
export function useSystemInfo(): SystemInfo | null {
    const [info, setInfo] = useState<SystemInfo | null>(null);

    useEffect(() => {
        cached ??= api.systemInfo().catch(() => {
            cached = null;
            return null;
        });
        let active = true;
        cached.then(result => {
            if (active) setInfo(result);
        });
        return () => {
            active = false;
        };
    }, []);

    return info;
}
