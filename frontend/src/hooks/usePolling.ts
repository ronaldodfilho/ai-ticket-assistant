import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/client';

interface PollingState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
    setData: (data: T) => void;
}

interface Snapshot<T> {
    key: string;
    data: T | null;
    error: string | null;
}

const NOT_LOADED = Symbol('not-loaded').toString();

/**
 * Carrega dados assíncronos e os recarrega a cada `intervalMs` enquanto a aba estiver visível.
 * `key` identifica o recurso (ex.: id do chamado): ao mudar, os dados antigos são descartados
 * e respostas atrasadas do recurso anterior são ignoradas.
 */
export function usePolling<T>(loader: () => Promise<T>, intervalMs: number, key = ''): PollingState<T> {
    const [snapshot, setSnapshot] = useState<Snapshot<T>>({ key: NOT_LOADED, data: null, error: null });
    const loaderRef = useRef(loader);
    const keyRef = useRef(key);

    useEffect(() => {
        loaderRef.current = loader;
        keyRef.current = key;
    });

    const reload = useCallback(async () => {
        try {
            const data = await loaderRef.current();
            if (keyRef.current === key) setSnapshot({ key, data, error: null });
        } catch (err) {
            const error = getErrorMessage(err, 'Não foi possível carregar os dados.');
            if (keyRef.current === key) setSnapshot(prev => ({ key, data: prev.key === key ? prev.data : null, error }));
        }
    }, [key]);

    useEffect(() => {
        reload();
        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') reload();
        }, intervalMs);
        return () => window.clearInterval(timer);
    }, [reload, intervalMs]);

    const current = snapshot.key === key;
    const setData = useCallback((data: T) => setSnapshot({ key, data, error: null }), [key]);

    return {
        data: current ? snapshot.data : null,
        error: current ? snapshot.error : null,
        loading: !current,
        reload,
        setData,
    };
}
