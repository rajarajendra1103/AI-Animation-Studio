import React, { useState } from 'react';
import { Project, Asset, AiAssetMetadata } from '../types';
import { GoogleGenAI } from '@google/genai';

interface CharacterTabProps {
    project: Project;
    onProjectUpdate: (updates: Partial<Project>) => void;
}

type Mode = 'ai' | 'manual';
type ArtStyle = 'Cartoon' | 'Anime' | 'Realistic' | 'Pixel Art';
const artStyles: ArtStyle[] = ['Cartoon', 'Anime', 'Realistic', 'Pixel Art'];
const emotions = ['happy', 'sad', 'angry', 'surprised', 'worried', 'excited'];

type GeneratedImages = {
    [key: string]: string; // neutral, happy, sad etc.
};

const CharacterTab: React.FC<CharacterTabProps> = ({ project, onProjectUpdate }) => {
    const [mode, setMode] = useState<Mode>('ai');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    // AI Mode State
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiArtStyle, setAiArtStyle] = useState<ArtStyle>('Cartoon');
    
    // Manual Mode State
    const [manualForm, setManualForm] = useState({
        bodyType: 'Average',
        skinTone: '#E0AC69',
        hairColor: '#4A3731',
        eyeColor: '#6A4F3B',
        clothingPrimary: '#3B82F6',
        clothingSecondary: '#F3F4F6',
        personality: '',
        specialFeatures: '',
        tags: '',
    });

    const [generatedImages, setGeneratedImages] = useState<GeneratedImages | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedImages(null);
        
        let finalPrompt: string;
        let finalArtStyle: ArtStyle;

        if (mode === 'ai') {
            if (!aiPrompt.trim()) {
                setError("Please provide a character description.");
                setIsLoading(false);
                return;
            }
            finalPrompt = aiPrompt;
            finalArtStyle = aiArtStyle;
        } else {
            // Construct prompt from manual builder
            finalPrompt = `A character with an ${manualForm.bodyType.toLowerCase()} build. 
            Skin tone is ${manualForm.skinTone}, hair color is ${manualForm.hairColor}, eye color is ${manualForm.eyeColor}. 
            They are wearing clothing that is primarily ${manualForm.clothingPrimary} with ${manualForm.clothingSecondary} accents. 
            Personality: ${manualForm.personality || 'Not specified'}. 
            Special features: ${manualForm.specialFeatures || 'None'}.`;
            finalArtStyle = 'Realistic'; // Default for manual, could be an option
        }
        
        const fullPrompt = `${finalPrompt}. The art style should be a high-quality ${finalArtStyle.toLowerCase()}.`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const newImages: GeneratedImages = {};

            // Generate neutral expression first
            setLoadingMessage('Generating base character...');
            const neutralResponse = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `Full body character sheet, neutral expression. ${fullPrompt}`,
            });
            newImages['neutral'] = `data:image/jpeg;base64,${neutralResponse.generatedImages[0].image.imageBytes}`;
            setGeneratedImages({...newImages});

            // Generate emotional expressions
            for (const emotion of emotions) {
                setLoadingMessage(`Generating '${emotion}' expression...`);
                 const emotionResponse = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: `A portrait of the same character, showing a ${emotion} expression. ${fullPrompt}`,
                });
                newImages[emotion] = `data:image/jpeg;base64,${emotionResponse.generatedImages[0].image.imageBytes}`;
                setGeneratedImages({...newImages});
            }

        } catch (e: unknown) {
            console.error(e);
            let msg = 'Failed to generate character.';
            if (e instanceof Error) msg = e.message;
            setError(msg);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleSaveToAssets = async () => {
        if (!generatedImages || !generatedImages.neutral) return;
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const namePrompt = `Create a short, cool, descriptive name for a character described as: ${aiPrompt || manualForm.personality}.`;
        const nameResponse = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: namePrompt});
        const characterName = nameResponse.text.replace(/["']/g, "").trim(); // Clean up quotes

        const metadata: AiAssetMetadata = {
            description: aiPrompt || `A character with these traits: ${manualForm.personality}`,
            artStyle: aiArtStyle,
            detectedObjects: ['person', 'character'],
            sceneContext: '', mood: '', dominantColors: [], composition: '', suggestedUsage: '', colorPaletteDescription: '', lighting: '', lineQuality: '', artisticTone: '',
            searchKeywords: characterName.split(' ')
        };

        const newAsset: Asset = {
            id: `asset_char_${new Date().getTime()}`,
            name: characterName,
            type: 'character',
            url: generatedImages.neutral,
            tags: mode === 'manual' ? manualForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            aiMetadata: metadata,
        };
        
        onProjectUpdate({ assets: [...project.assets, newAsset] });
        alert(`Character "${characterName}" saved to assets!`);
    };

    return (
        <div className="p-4 flex flex-col h-full text-gray-800 overflow-y-auto">
            <h3 className="text-lg font-bold mb-2 border-b pb-2">Character Design Studio</h3>

            <div className="flex justify-center mb-4 p-1 bg-gray-200 rounded-md">
                <button onClick={() => setMode('ai')} className={`w-1/2 py-1 text-sm rounded ${mode === 'ai' ? 'bg-white shadow' : ''}`}>AI Generator</button>
                <button onClick={() => setMode('manual')} className={`w-1/2 py-1 text-sm rounded ${mode === 'manual' ? 'bg-white shadow' : ''}`}>Manual Builder</button>
            </div>

            {mode === 'ai' && (
                <div className="space-y-3">
                    <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g., A brave knight with a glowing sword and a friendly dragon companion..." className="w-full h-24 bg-white p-2 rounded-md text-sm border border-gray-300 outline-none focus:ring-1 focus:ring-blue-500"/>
                    <select value={aiArtStyle} onChange={e => setAiArtStyle(e.target.value as ArtStyle)} className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none">
                        {artStyles.map(style => <option key={style} value={style}>{style}</option>)}
                    </select>
                </div>
            )}
            
            {mode === 'manual' && (
                <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="font-medium">Body Type</label>
                            <select value={manualForm.bodyType} onChange={e => setManualForm(f => ({...f, bodyType: e.target.value}))} className="w-full mt-1 bg-white border border-gray-300 rounded-md p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none">
                                {['Slim', 'Average', 'Muscular', 'Stocky', 'Child'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="font-medium">Personality</label>
                            <input type="text" value={manualForm.personality} onChange={e => setManualForm(f => ({...f, personality: e.target.value}))} className="w-full mt-1 bg-white border border-gray-300 rounded-md p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                     <div className="grid grid-cols-3 gap-2">
                        {Object.entries({ skinTone: 'Skin', hairColor: 'Hair', eyeColor: 'Eyes', clothingPrimary: 'Cloth 1', clothingSecondary: 'Cloth 2'}).map(([key, label]) => (
                            <div key={key}>
                                <label className="font-medium text-xs">{label}</label>
                                <input type="color" value={manualForm[key as keyof typeof manualForm]} onChange={e => setManualForm(f => ({...f, [key]: e.target.value}))} className="w-full mt-1 h-8 border-none rounded-md" />
                            </div>
                        ))}
                    </div>
                     <div>
                        <label className="font-medium">Special Features / Powers</label>
                        <input type="text" value={manualForm.specialFeatures} onChange={e => setManualForm(f => ({...f, specialFeatures: e.target.value}))} className="w-full mt-1 bg-white border border-gray-300 rounded-md p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                </div>
            )}

            <button onClick={handleGenerate} disabled={isLoading} className="w-full mt-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-500 disabled:bg-gray-400">
                {isLoading ? loadingMessage : 'Generate Character'}
            </button>
            {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
            
            {generatedImages && (
                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Generated Character & Expressions</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {Object.entries(generatedImages).map(([emotion, url]) => (
                            <div key={emotion} className="relative aspect-square">
                                <img src={url} alt={emotion} className="w-full h-full object-cover rounded-md bg-gray-200 border" />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5 rounded-b-md capitalize">{emotion}</div>
                            </div>
                        ))}
                    </div>
                     <button onClick={handleSaveToAssets} disabled={isLoading} className="w-full mt-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-500">
                        Save Neutral Pose to Assets
                    </button>
                </div>
            )}
        </div>
    );
};

export default CharacterTab;
