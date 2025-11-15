import React, { useState, useEffect } from 'react';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (details: { name: string, description: string }) => void;
    initialName?: string;
    initialDescription?: string;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onCreate, initialName = '', initialDescription = '' }) => {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);

    useEffect(() => {
        if (isOpen) {
            setName(initialName || '');
            setDescription(initialDescription || '');
        }
    }, [isOpen, initialName, initialDescription]);
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
           window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    const handleCreate = () => {
        if (name.trim()) {
            onCreate({ name, description });
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-xl p-6 md:p-8 w-full max-w-md shadow-2xl m-4"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6 text-slate-900">Create New Project</h2>
                <div className="space-y-5">
                    <div>
                        <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                        <input
                            id="projectName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome Animation"
                            className="form-input"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="projectDescription" className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                        <textarea
                            id="projectDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="A short description of your project..."
                            className="form-textarea resize-none"
                            rows={3}
                        />
                    </div>
                </div>
                <div className="mt-8 flex justify-end space-x-3">
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button onClick={handleCreate} disabled={!name.trim()} className="btn btn-primary">Create</button>
                </div>
            </div>
        </div>
    );
};

export default NewProjectModal;