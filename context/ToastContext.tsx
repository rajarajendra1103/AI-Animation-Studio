import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { Toast } from '../types';

interface ToastContextType {
    addToast: (message: string, type: Toast['type']) => void;
    toasts: Toast[];
    removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: Toast['type']) => {
        const id = new Date().getTime();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            removeToast(id);
        }, 5000); // Auto-remove after 5 seconds
    }, [removeToast]);
    
    const value = useMemo(() => ({ addToast, toasts, removeToast }), [addToast, toasts, removeToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
