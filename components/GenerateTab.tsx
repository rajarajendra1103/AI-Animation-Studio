import React, { useState } from 'react';
import { Project, Asset } from '../types';
import { GoogleGenAI } from '@google/genai';

interface GenerateTabProps {
    project: Project;
    onProjectUpdate: (updates: Partial<Project>) => void;
}

const GenerateTab: React.FC<GenerateTabProps> = ({ project, onProjectUpdate }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');

    const handleGenerateAsset = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const generationPrompt = project.currentStyleReference 
                ? `Generate an image of: "${prompt}". Match the following art style: ${project.currentStyleReference.description}`
                : `Generate an image of: "${prompt}"`;

             const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: generationPrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg'
                },
            });

            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

            const newAsset: Asset = {
                id: `asset_${new Date().getTime()}`,
                name: prompt.slice(0, 30),
                type: 'background', // Default type, user can change in assets
                url: imageUrl,
                tags: [prompt.split(' ')[0]],
                aiMetadata: {
                    description: `AI generated: ${prompt}`,
                    artStyle: project.currentStyleReference?.name || 'AI Generated',
                    detectedObjects: [], sceneContext: '', mood: '', dominantColors: [], composition: '', suggestedUsage: '', colorPaletteDescription: '', lighting: '', lineQuality: '', artisticTone: '', searchKeywords: [prompt]
                }
            };
            onProjectUpdate({ assets: [...project.assets, newAsset] });
            setPrompt('');

        } catch (e) {
            console.error(e);
            setError('Failed to generate image.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 flex flex-col h-full text-gray-800">
            <h3 className="text-lg font-bold mb-2 border-b pb-2">Generate Asset</h3>
            <div className="space-y-3">
                <p className="text-sm text-gray-600">
                    Generate an image asset using AI. 
                    {project.currentStyleReference ? (
                        <span> It will use your currently selected style: <strong className="text-blue-600">{project.currentStyleReference.name}</strong>.</span>
                    ) : (
                        <span> Set a style in the 'Drawing' tab for more consistent results.</span>
                    )}
                </p>
                <textarea 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                    placeholder="A cat wearing a tiny top hat..." 
                    className="w-full h-24 bg-white p-2 rounded-md text-sm border border-gray-300 outline-none focus:ring-1 focus:ring-blue-500" 
                />
                <button 
                    onClick={handleGenerateAsset} 
                    disabled={isLoading || !prompt} 
                    className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-500 disabled:bg-gray-400"
                >
                    {isLoading ? 'Generating...' : 'Generate'}
                </button>
                {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
            </div>
        </div>
    );
};

export default GenerateTab;