import React, { useState } from 'react';
import { Project, GeneratedShot, Asset, Scene, StoryboardPanel } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

interface SequenceTabProps {
    project: Project;
    onSequenceGenerated: (scenes: Scene[], assets: Asset[]) => void;
}

type FullGeneratedShot = GeneratedShot & { storyboardUrl: string; backgroundUrl: string; };

const SequenceTab: React.FC<SequenceTabProps> = ({ project, onSequenceGenerated }) => {
    const [script, setScript] = useState(project.script || '');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [generatedSequence, setGeneratedSequence] = useState<FullGeneratedShot[] | null>(null);

    const handleGenerateSequence = async () => {
        if (!script.trim()) return;
        setIsLoading(true);
        setError(null);
        setGeneratedSequence(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            // Step 1: Generate Shot Breakdown
            setLoadingMessage('Analyzing script and breaking down shots...');
            const breakdownPrompt = `Analyze the following script and generate a detailed shot-by-shot sequence. Create 3-8 shots. For each shot, provide a JSON object with: shotNumber, shotType (e.g., 'Establishing Shot', 'Medium Shot'), shotDescription, cameraMovement, cameraAngle, duration (in seconds), backgroundDescription, storyboardDescription (a visual summary for an image generator), characters (name, position, action, emotion), and dialogue (character, line). Return a JSON array of these objects. SCRIPT: ${script}`;
            
            const breakdownResponse = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: breakdownPrompt,
                config: { responseMimeType: 'application/json' }
            });

            const shots: GeneratedShot[] = JSON.parse(breakdownResponse.text);
            const fullShots: FullGeneratedShot[] = [];

            // Step 2 & 3: Generate images for each shot
            for (let i = 0; i < shots.length; i++) {
                const shot = shots[i];
                setLoadingMessage(`Generating storyboard for shot ${i + 1}/${shots.length}...`);
                const storyboardResponse = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: `A charcoal sketch style storyboard panel illustrating: ${shot.storyboardDescription}`,
                });
                const storyboardUrl = `data:image/jpeg;base64,${storyboardResponse.generatedImages[0].image.imageBytes}`;

                setLoadingMessage(`Generating background for shot ${i + 1}/${shots.length}...`);
                const backgroundResponse = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: `A digital painting background for an animation scene. Style: ${project.currentStyleReference?.name || 'Vibrant Cartoon'}. Description: ${shot.backgroundDescription}`,
                });
                const backgroundUrl = `data:image/jpeg;base64,${backgroundResponse.generatedImages[0].image.imageBytes}`;
                
                fullShots.push({ ...shot, storyboardUrl, backgroundUrl });
            }

            setGeneratedSequence(fullShots);

        } catch (e: unknown) {
            console.error(e);
            let msg = 'Failed to generate sequence.';
            if (e instanceof Error) msg = e.message;
            setError(msg);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleSaveChanges = () => {
        if (!generatedSequence) return;
        const newAssets: Asset[] = [];
        const newScenes: Scene[] = [];

        generatedSequence.forEach((shot, index) => {
            const backgroundAsset: Asset = {
                id: `asset_bg_${new Date().getTime() + index}`,
                name: `Shot ${shot.shotNumber} Background`,
                type: 'background',
                url: shot.backgroundUrl,
                tags: ['background', `shot-${shot.shotNumber}`],
                aiMetadata: {
                    description: shot.backgroundDescription,
                    artStyle: project.currentStyleReference?.name || 'AI Generated',
                    detectedObjects: [], sceneContext: '', mood: '', dominantColors: [], composition: '', suggestedUsage: '', colorPaletteDescription: '', lighting: '', lineQuality: '', artisticTone: '', searchKeywords: [shot.backgroundDescription]
                }
            };
            newAssets.push(backgroundAsset);

            const storyboardPanel: StoryboardPanel = {
                id: `panel_${new Date().getTime() + index}`,
                panelNumber: 1,
                timing: `0s - ${shot.duration}s`,
                shotType: shot.shotType,
                cameraAngle: shot.cameraAngle,
                cameraMovement: shot.cameraMovement,
                visualDescription: shot.shotDescription,
                characterPose: shot.characters.map(c => `${c.name}: ${c.action}`).join(', '),
                keyVisualElements: '',
                lightingAndMood: '',
                backgroundDetails: shot.backgroundDescription,
                transition: 'cut',
                directorsNotes: 'Auto-generated from sequence.',
                dialogueSnippet: shot.dialogue.map(d => d.line).join(' '),
                imageUrl: shot.storyboardUrl,
            };

            const newScene: Scene = {
                id: `scene_${new Date().getTime() + index}`,
                number: project.scenes.length + index + 1,
                script: shot.shotDescription,
                duration: shot.duration,
                cameraMovement: shot.cameraMovement,
                cameraAngle: shot.cameraAngle,
                backgroundAssetId: backgroundAsset.id,
                storyboardPanels: [storyboardPanel],
                characters: [], 
                dialogue: [], 
                backgroundMusicAssetId: null,
                soundEffects: [],
            };
            newScenes.push(newScene);
        });

        onSequenceGenerated(newScenes, newAssets);
        setGeneratedSequence(null); // Clear after saving
    };

    return (
        <div className="p-4 flex flex-col h-full text-gray-800">
            <h3 className="text-lg font-bold mb-2 border-b pb-2">Script to Sequence</h3>
            <p className="text-sm text-gray-600 mb-4">Automatically generate a full sequence of scenes, complete with storyboards and backgrounds, from your script.</p>

            <div className="flex flex-col flex-grow">
                <textarea 
                    value={script}
                    onChange={e => setScript(e.target.value)}
                    placeholder="Paste your script here..."
                    className="w-full h-40 bg-gray-50 p-2 rounded-md text-sm border border-gray-300 outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
                    disabled={isLoading}
                />
                <button
                    onClick={handleGenerateSequence}
                    disabled={isLoading || !script.trim()}
                    className="w-full mt-2 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-500 disabled:bg-gray-400"
                >
                    {isLoading ? loadingMessage : 'Generate Sequence'}
                </button>
                {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
                
                {generatedSequence && (
                    <div className="mt-4 flex flex-col flex-grow">
                        <h4 className="font-semibold mb-2">Generated Sequence Preview</h4>
                        <div className="flex-grow overflow-y-auto border rounded-md p-2 bg-gray-50 space-y-3">
                            {generatedSequence.map(shot => (
                                <div key={shot.shotNumber} className="p-2 border bg-white rounded-md">
                                    <p className="font-bold text-sm">Shot {shot.shotNumber}: {shot.shotType}</p>
                                    <p className="text-xs text-gray-600">{shot.shotDescription}</p>
                                    <div className="flex gap-2 mt-2">
                                        <div className="w-1/2">
                                            <p className="text-xs font-semibold text-center mb-1">Storyboard</p>
                                            <img src={shot.storyboardUrl} className="w-full rounded border" alt="storyboard" />
                                        </div>
                                        <div className="w-1/2">
                                            <p className="text-xs font-semibold text-center mb-1">Background</p>
                                             <img src={shot.backgroundUrl} className="w-full rounded border" alt="background" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleSaveChanges}
                            className="w-full mt-2 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-500"
                        >
                            Save Sequence to Timeline
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SequenceTab;