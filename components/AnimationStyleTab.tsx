import React, { useState } from 'react';
import { Scene, Project, AnimationStyle, AnimationData } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

interface AnimationStyleTabProps {
    scene: Scene;
    project: Project;
    onUpdateScene: (scene: Scene) => void;
}

const animationStyles: { id: AnimationStyle, name: string, description: string }[] = [
    { id: 'realistic', name: 'Realistic', description: 'Natural, lifelike movements.' },
    { id: 'squash-and-stretch', name: 'Squash & Stretch', description: 'Exaggerated, classic cartoon style.' },
    { id: 'limited', name: 'Limited Animation', description: 'Efficient, fewer frames.' },
    { id: 'bouncy', name: 'Bouncy', description: 'Energetic, spring-like motions.' },
    { id: 'robotic', name: 'Stiff/Robotic', description: 'Mechanical, rigid movements.' },
];

export const AnimationStyleTab: React.FC<AnimationStyleTabProps> = ({ scene, project, onUpdateScene }) => {
    const [selectedCharId, setSelectedCharId] = useState<string | null>(scene.characters.length > 0 ? scene.characters[0].id : null);
    const [isLoading, setIsLoading] = useState<string | null>(null); // Use string to track which item is loading
    const [error, setError] = useState<string | null>(null);

    const selectedCharacter = scene.characters.find(c => c.id === selectedCharId);
    const characterAsset = project.assets.find(a => a.id === selectedCharacter?.assetId);
    const characterDialogues = scene.dialogue.filter(d => d.characterId === selectedCharId);

    const handleStyleChange = (style: AnimationStyle) => {
        if (!selectedCharacter) return;
        const updatedCharacters = scene.characters.map(c =>
            c.id === selectedCharId ? { ...c, animationStyle: style } : c
        );
        onUpdateScene({ ...scene, characters: updatedCharacters });
    };

    const handleGenerateAnimation = async (type: 'idle' | 'walking' | 'lip-sync', dialogueId?: string) => {
        if (!selectedCharacter || !characterAsset) {
            setError("Please select a character with a valid asset.");
            return;
        }
        
        const loadingKey = dialogueId ? `lip-sync-${dialogueId}` : type;
        setIsLoading(loadingKey);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const characterDescription = characterAsset.aiMetadata?.description || `a character named ${characterAsset.name}`;
            const styleDescription = animationStyles.find(s => s.id === selectedCharacter.animationStyle)?.description || 'realistic movement';

            let updatedAnimationLayers = { ...selectedCharacter.animationLayers };

            if (type === 'idle') {
                const prompt = `Generate a 4-frame sprite sheet of this character in a standing idle animation with subtle breathing. The animation should be loopable. The character is ${characterDescription}. The style should be ${styleDescription}.`;
                const response = await ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt });
                const imageUrl = `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
                const newAnimationData: AnimationData = { type: 'idle', frames: [imageUrl], duration: 2 };
                updatedAnimationLayers.idle = newAnimationData;
            } else if (type === 'walking') {
                 const prompt = `Generate an 8-frame horizontal sprite sheet of this character in a side-view walking cycle animation. The animation must be seamlessly loopable. The character is ${characterDescription}. The style should be ${styleDescription}.`;
                const response = await ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt });
                const imageUrl = `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
                const newAnimationData: AnimationData = { type: 'walking', frames: [imageUrl], duration: 0.8 };
                updatedAnimationLayers.walking = newAnimationData;
            } else if (type === 'lip-sync' && dialogueId) {
                const dialogueLine = scene.dialogue.find(d => d.id === dialogueId)?.line;
                if (!dialogueLine) {
                    throw new Error("Dialogue line not found.");
                }
                const imagePrompt = `Generate a single horizontal sprite sheet with 6 key mouth shapes for lip-syncing. The shapes are: closed, open, wide, smile, o-shape, ee-shape. The character is ${characterDescription}. The style is ${styleDescription}.`;
                const imageResponse = await ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt: imagePrompt });
                const imageUrl = `data:image/jpeg;base64,${imageResponse.generatedImages[0].image.imageBytes}`;
                
                const phonemePrompt = `Analyze the following dialogue line and map it to a sequence of phonemes with precise timing. For each phoneme, assign one of the following mouth shapes: 'closed', 'open', 'wide', 'smile', 'o-shape', 'ee-shape'. The total duration should match a natural speaking pace for the line. Return a JSON array of objects, where each object has "phoneme", "mouthShape", "start" (in seconds), and "end" (in seconds). Dialogue: "${dialogueLine}"`;
                const phonemeResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: phonemePrompt,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    phoneme: { type: Type.STRING },
                                    mouthShape: { type: Type.STRING },
                                    start: { type: Type.NUMBER },
                                    end: { type: Type.NUMBER },
                                }
                            }
                        }
                    }
                });

                const phonemes = JSON.parse(phonemeResponse.text);
                const totalDuration = phonemes.length > 0 ? Math.max(...phonemes.map((p: any) => p.end)) : 0;
                
                const newAnimationData: AnimationData = { 
                    type: 'talking', 
                    frames: [imageUrl], 
                    duration: totalDuration, 
                    meta: { phonemes } 
                };
                
                if (!updatedAnimationLayers.talking) {
                    updatedAnimationLayers.talking = {};
                }
                updatedAnimationLayers.talking[dialogueId] = newAnimationData;
            }

            const updatedCharacters = scene.characters.map(c =>
                c.id === selectedCharId ? { ...c, animationLayers: updatedAnimationLayers } : c
            );
            onUpdateScene({ ...scene, characters: updatedCharacters });

        } catch (e: unknown) {
            console.error(e);
            let msg = `Failed to generate animation.`;
            if (e instanceof Error) msg = e.message;
            setError(msg);
        } finally {
            setIsLoading(null);
        }
    };

    const handleGenerateAllLipSync = async () => {
        for (const dialogue of characterDialogues) {
            if (!selectedCharacter?.animationLayers?.talking?.[dialogue.id]) {
                await handleGenerateAnimation('lip-sync', dialogue.id);
            }
        }
    };
    
    return (
        <div className="p-4 flex flex-col h-full text-slate-800 overflow-y-auto">
            <h3 className="panel-header">Animation Style Controller</h3>
            <div className="mb-4">
                <label className="text-sm font-medium">Select Character</label>
                <select 
                    value={selectedCharId || ''}
                    onChange={e => setSelectedCharId(e.target.value)}
                    className="form-select mt-1"
                >
                    <option value="" disabled>-- Select a character --</option>
                    {scene.characters.map(c => {
                        const asset = project.assets.find(a => a.id === c.assetId);
                        return <option key={c.id} value={c.id}>{asset?.name || 'Unknown Character'}</option>
                    })}
                </select>
            </div>
            
            {selectedCharacter ? (
                <div className="space-y-4">
                    {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded">{error}</p>}
                    
                    <div className="card">
                        <h4 className="section-header !mb-2">Animation Style</h4>
                        <select
                            value={selectedCharacter.animationStyle}
                            onChange={(e) => handleStyleChange(e.target.value as AnimationStyle)}
                            className="form-select"
                        >
                            {animationStyles.map(style => (
                                <option key={style.id} value={style.id}>{style.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">{animationStyles.find(s => s.id === selectedCharacter.animationStyle)?.description}</p>
                    </div>

                    <div className="card">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Idle Animation</h4>
                            <button onClick={() => handleGenerateAnimation('idle')} disabled={!!isLoading} className="btn btn-secondary !px-2 !py-1 text-xs">
                                {isLoading === 'idle' ? '...' : (selectedCharacter.animationLayers?.idle ? 'Regen' : 'Generate')}
                            </button>
                        </div>
                        {selectedCharacter.animationLayers?.idle ? (
                            <img src={selectedCharacter.animationLayers.idle.frames[0]} alt="Idle animation frames" className="w-full rounded border bg-slate-200 mt-2" />
                        ) : (
                            <p className="text-xs text-center text-slate-400 py-4">Not Generated</p>
                        )}
                    </div>
                    
                    <div className="card">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Walking Animation</h4>
                             <button 
                                onClick={() => handleGenerateAnimation('walking')} 
                                disabled={!!isLoading || selectedCharacter.animation !== 'walking'} 
                                className="btn btn-secondary !px-2 !py-1 text-xs"
                                title={selectedCharacter.animation !== 'walking' ? "Set character animation to 'walking' in Editor" : "Generate walking cycle"}
                            >
                                {isLoading === 'walking' ? '...' : (selectedCharacter.animationLayers?.walking ? 'Regen' : 'Generate')}
                            </button>
                        </div>
                        {selectedCharacter.animationLayers?.walking ? (
                            <img src={selectedCharacter.animationLayers.walking.frames[0]} alt="Walking animation frames" className="w-full rounded border bg-slate-200 mt-2" />
                        ) : (
                            <p className="text-xs text-center text-slate-400 py-4">
                                {selectedCharacter.animation === 'walking' ? 'Not Generated' : "Set character to 'walking' in Editor"}
                            </p>
                        )}
                    </div>

                    <div className="card">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Lip-Sync Generation</h4>
                            <button onClick={handleGenerateAllLipSync} disabled={!!isLoading || characterDialogues.length === 0} className="btn btn-primary !px-2 !py-1 text-xs">
                                {isLoading ? 'Working...' : 'Generate All Missing'}
                            </button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {characterDialogues.length > 0 ? characterDialogues.map(dialogue => {
                                const animationData = selectedCharacter.animationLayers?.talking?.[dialogue.id];
                                const isGenerated = !!animationData;
                                const isThisLoading = isLoading === `lip-sync-${dialogue.id}`;
                                const phonemes = animationData?.meta?.phonemes;
                                return (
                                <div key={dialogue.id} className="text-xs p-2 bg-white rounded border">
                                    <div className="flex items-center justify-between">
                                        <p className="truncate pr-2 italic">"{dialogue.line}"</p>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`px-2 py-0.5 rounded-full text-white text-[10px] ${isGenerated ? 'bg-green-500' : 'bg-slate-400'}`}>
                                                {isGenerated ? 'Ready' : 'Needed'}
                                            </span>
                                            <button onClick={() => handleGenerateAnimation('lip-sync', dialogue.id)} disabled={!!isLoading} className="btn btn-secondary !px-2 !py-1">
                                                 {isThisLoading ? '...' : (isGenerated ? 'Regen' : 'Generate')}
                                            </button>
                                        </div>
                                    </div>
                                    {phonemes && phonemes.length > 0 && (
                                        <div className="mt-2 pt-2 border-t">
                                            <p className="font-semibold text-slate-600">Phoneme Map:</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {phonemes.map((p, i) => (
                                                    <div key={i} className="bg-slate-100 p-1 rounded text-center" title={`Shape: ${p.mouthShape}`}>
                                                        <p className="font-mono font-bold text-[11px]">{p.phoneme}</p>
                                                        <p className="text-[10px] text-slate-500">{`${p.start.toFixed(2)}s`}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}) : (
                                <p className="text-xs text-center text-slate-400 py-4">No dialogue for this character in the scene.</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-500 py-10">
                    <p>No character selected.</p>
                    <p className="text-sm">Add a character in the 'Editor' tab to manage animations.</p>
                </div>
            )}
        </div>
    );
};
