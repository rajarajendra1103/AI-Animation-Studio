import React, { useState } from 'react';
import { Project, Asset, Scene } from '../types';
import { GoogleGenAI } from '@google/genai';

interface AnimateTabProps {
    project: Project;
    onProjectUpdate: (updates: Partial<Project>) => void;
    onSceneCreated: (sceneId: string) => void;
}

const AnimateTab: React.FC<AnimateTabProps> = ({ project, onProjectUpdate, onSceneCreated }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [sourceImage, setSourceImage] = useState<{b64: string, mime: string, url: string} | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setSourceImage({ b64: dataUrl.split(',')[1], mime: file.type, url: dataUrl });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleGenerateScene = async () => {
        if (!sourceImage) return;
        setIsLoading(true);
        setError(null);
        try {
            if (!(await window.aistudio.hasSelectedApiKey())) {
                await window.aistudio.openSelectKey();
            }
            setLoadingMessage('Initializing...');
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt || 'Subtly animate this image.',
                image: { imageBytes: sourceImage.b64, mimeType: sourceImage.mime },
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
            });
            setLoadingMessage('Generating video...');
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation });
            }
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) throw new Error('Generation failed.');
            setLoadingMessage('Downloading...');
            const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            const videoBlob = await videoResponse.blob();
            const videoUrl = URL.createObjectURL(videoBlob);
            
            const videoElement = document.createElement('video');
            videoElement.src = videoUrl;
            videoElement.onloadedmetadata = () => {
                 const newAsset: Asset = {
                    id: `asset_${new Date().getTime()}`,
                    name: `Animated Scene BG: ${prompt.slice(0, 20) || 'Image'}`,
                    type: 'video',
                    url: videoUrl,
                    tags: ['animated', 'video', 'background'],
                    duration: videoElement.duration || 4,
                    aiMetadata: {
                        description: `Animated background from prompt: ${prompt}`,
                        artStyle: project.currentStyleReference?.name || 'AI Animated',
                        detectedObjects: [], sceneContext: '', mood: '', dominantColors: [], composition: '', suggestedUsage: '', colorPaletteDescription: '', lighting: '', lineQuality: '', artisticTone: '', searchKeywords: [prompt]
                    }
                };

                const newScene: Scene = {
                    id: `scene_${new Date().getTime()}`,
                    number: project.scenes.length + 1,
                    script: `Animated scene: ${prompt}`,
                    duration: Math.round(videoElement.duration || 4),
                    cameraMovement: 'none',
                    cameraAngle: 'eye-level',
                    characters: [],
                    dialogue: [],
                    backgroundAssetId: newAsset.id,
                    storyboardPanels: [],
                    backgroundMusicAssetId: null,
                    soundEffects: [],
                };
                
                onProjectUpdate({ 
                    assets: [...project.assets, newAsset],
                    scenes: [...project.scenes, newScene]
                });
                onSceneCreated(newScene.id);
                
                // Reset form
                setPrompt('');
                setSourceImage(null);
                setIsLoading(false);
            };
        } catch (e: unknown) {
            console.error(e);
            let msg = 'Failed to generate animation.';
            if (e instanceof Error && e.message?.includes('not found')) msg = 'Invalid API Key.';
            setError(msg);
            setIsLoading(false);
        }
    };

    return (
         <div className="p-4 flex flex-col h-full text-gray-800">
            <h3 className="text-lg font-bold mb-4">Animate Scene</h3>
            <div className="space-y-4">
                <p className="text-sm text-gray-600">Upload a background image and describe an animation to create a new scene.</p>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-800 hover:file:bg-gray-300"/>
                {sourceImage && <img src={sourceImage.url} alt="upload preview" className="max-h-32 mx-auto rounded-md" />}
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g., A gentle breeze rustles the leaves, rain falls softly..." className="w-full h-24 bg-white p-2 rounded-md text-sm border border-gray-300 outline-none focus:ring-1 focus:ring-blue-500" />
                <button onClick={handleGenerateScene} disabled={isLoading || !sourceImage} className="w-full py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-500 disabled:bg-gray-400">
                    {isLoading ? loadingMessage : 'Generate Scene'}
                </button>
                 <p className="text-xs text-gray-500 text-center">Video generation may require billing.</p>
                 {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
            </div>
        </div>
    );
};

export default AnimateTab;