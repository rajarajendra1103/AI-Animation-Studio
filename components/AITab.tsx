import React, { useState } from 'react';
import { Project, GeneratedScene } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

interface AITabProps {
    project: Project;
    onProjectUpdate: (updates: Partial<Project>) => void;
}

const AITab: React.FC<AITabProps> = ({ project, onProjectUpdate }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [script, setScript] = useState(project.script || '');
    const [generatedScenes, setGeneratedScenes] = useState<GeneratedScene[]>([]);

    const handleSceneGenerate = async () => {
        if (!script.trim()) return;
        setIsLoading(true);
        setError(null);
        setGeneratedScenes([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
             const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Analyze the following script and break it down into scenes. Output a JSON array of scenes with keys: sceneNumber, setting, characters, action, and dialogue (an array of {character, line}).\n\nScript:\n${script}`,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                sceneNumber: { type: Type.INTEGER },
                                setting: { type: Type.STRING },
                                characters: { type: Type.ARRAY, items: { type: Type.STRING } },
                                action: { type: Type.STRING },
                                dialogue: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: { character: { type: Type.STRING }, line: { type: Type.STRING } },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            setGeneratedScenes(JSON.parse(response.text));

        } catch (e) {
            console.error(e);
            setError('Failed to generate scenes.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 flex flex-col h-full text-gray-800">
            <h3 className="text-lg font-bold mb-2 border-b pb-2">Story-to-Scene</h3>
            
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-3">
                 <p className="text-sm text-gray-600">Break down a script into scenes. Uses the content from the main 'Script' tool.</p>
                 <textarea value={script} onChange={e => setScript(e.target.value)} placeholder="SCENE START..." className="w-full h-40 bg-white p-2 rounded-md text-sm border border-gray-300 outline-none focus:ring-1 focus:ring-blue-500" />
                 <button onClick={handleSceneGenerate} disabled={isLoading || !script} className="w-full py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-500 disabled:bg-gray-400">
                    {isLoading ? 'Generating...' : 'Generate Scenes'}
                </button>
                <div className="space-y-2">
                    {generatedScenes.map((scene, i) => (
                        <div key={i} className="p-2 bg-gray-100 border border-gray-200 rounded-md text-xs">
                            <p className="font-bold">Scene {scene.sceneNumber}: {scene.setting}</p>
                            <p className="text-gray-600">Action: {scene.action}</p>
                        </div>
                    ))}
                </div>

                {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
            </div>
        </div>
    );
};

export default AITab;