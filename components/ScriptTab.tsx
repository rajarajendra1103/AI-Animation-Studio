import React, { useState, useEffect, useMemo } from 'react';
import { Project } from '../types';

interface ScriptTabProps {
    project: Project;
    onProjectUpdate: (updates: Partial<Project>) => void;
}

const ScriptTab: React.FC<ScriptTabProps> = ({ project, onProjectUpdate }) => {
    const [scriptContent, setScriptContent] = useState(project.script || '');
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

    useEffect(() => {
        setScriptContent(project.script || '');
    }, [project.script]);

    useEffect(() => {
        if (scriptContent === (project.script || '')) {
            // If content matches project, it's saved.
             if (saveStatus !== 'saved') setSaveStatus('saved');
            return;
        }

        // If content differs, it's unsaved.
        setSaveStatus('unsaved');
        
        // Debounce saving
        const handler = setTimeout(() => {
            setSaveStatus('saving');
            onProjectUpdate({ script: scriptContent });
        }, 1500);

        return () => {
            clearTimeout(handler);
        };
    }, [scriptContent, onProjectUpdate, project.script]);

    // Effect to update status from saving to saved after project update
    useEffect(() => {
        if (saveStatus === 'saving' && scriptContent === project.script) {
             const timer = setTimeout(() => setSaveStatus('saved'), 500);
             return () => clearTimeout(timer);
        }
    }, [project.script, saveStatus, scriptContent]);
    
    const { words, lines } = useMemo(() => {
        if (!scriptContent) return { words: 0, lines: 1 };
        const trimmedContent = scriptContent.trim();
        const words = trimmedContent ? trimmedContent.split(/\s+/).length : 0;
        const lines = scriptContent.split('\n').length;
        return { words, lines };
    }, [scriptContent]);

    return (
        <div className="p-4 flex flex-col h-full text-gray-800">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Script Editor</h3>
            <div className="flex-grow flex flex-col">
                <textarea 
                    value={scriptContent}
                    onChange={e => setScriptContent(e.target.value)}
                    placeholder="SCENE 1 - INT. COFFEE SHOP - DAY..."
                    className="w-full h-full flex-grow bg-gray-50 p-2 rounded-md text-sm border border-gray-300 outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
                />
            </div>
            <div className="flex-shrink-0 text-xs text-gray-500 mt-2 flex justify-between items-center">
                <span>{words} words, {lines} lines</span>
                <span className="capitalize italic">
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus}
                </span>
            </div>
        </div>
    );
};

export default ScriptTab;