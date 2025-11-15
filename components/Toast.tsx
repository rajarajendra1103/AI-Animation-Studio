import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { Toast } from '../types';
import { InfoIcon, SuccessIcon, ErrorIcon } from './icons';

interface ToastMessageProps {
    toast: Toast;
    onDismiss: (id: number) => void;
}

const ToastMessage: React.FC<ToastMessageProps> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 300); // Match animation duration in styles.css
    };

    const typeStyles = {
        success: { icon: <SuccessIcon className="w-6 h-6 text-green-500" />, text: 'text-green-800' },
        error: { icon: <ErrorIcon className="w-6 h-6 text-red-500" />, text: 'text-red-800' },
        info: { icon: <InfoIcon className="w-6 h-6 text-blue-500" />, text: 'text-blue-800' },
    };

    const styles = typeStyles[toast.type];

    return (
        <div 
            className={`toast-message ${isExiting ? 'toast-exit' : 'toast-enter'} w-full max-w-sm overflow-hidden rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 flex items-start p-4 space-x-3 pointer-events-auto`}
        >
            <div className="flex-shrink-0">{styles.icon}</div>
            <div className="flex-1">
                <p className={`text-sm font-medium ${styles.text}`}>{toast.message}</p>
            </div>
            <div className="flex-shrink-0">
                <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                     <span className="sr-only">Close</span>
                     <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};


export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map(toast => (
                    <ToastMessage key={toast.id} toast={toast} onDismiss={removeToast} />
                ))}
            </div>
        </div>
    );
};
