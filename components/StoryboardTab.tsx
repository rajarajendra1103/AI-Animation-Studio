import React, { useState } from 'react';
import { Scene, StoryboardPanel } from '../types';
import { GoogleGenAI } from '@google/genai';
import { RefreshIcon, MaximizeIcon } from './icons';

interface StoryboardTabProps {
    scene: Scene;
    onUpdateScene: (scene: Scene) => void;
    setSelectedTool: (tool: 'Editor') => void;
}

type ViewMode = 'grid' | 'filmstrip';
type DetailTab = 'details' | 'camera' | 'characters' | 'notes';

const StoryboardTab: React.FC<StoryboardTabProps> = ({ scene, onUpdateScene, setSelectedTool }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [selectedPanelIndex, setSelectedPanelIndex] = useState(0);
    const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('details');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isRegeneratingPanel, setIsRegeneratingPanel] = useState<number | null>(null);

    const handleGenerateStoryboard = async () => {
        if (!scene.script?.trim()) {
            setError("Scene script is empty. Please add a script in the 'Editor' tab first.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            setLoadingMessage('Breaking down script into panels...');
            const panelDataPrompt = `Analyze the following animation scene script and break it down into 3-6 key storyboard panels. For each panel, provide a JSON object with: panelNumber, timing (e.g., "0s-1.5s"), shotType (e.g., 'Medium Shot'), cameraAngle, cameraMovement, visualDescription, characterPose, keyVisualElements, lightingAndMood, backgroundDetails, transition (e.g., 'Cut to'), directorsNotes, and dialogueSnippet. Return a JSON array of these panel objects. SCRIPT: ${scene.script}`;
            
            const panelDataResponse = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: panelDataPrompt,
                config: { responseMimeType: 'application/json' }
            });

            let panels: Omit<StoryboardPanel, 'id' | 'imageUrl'>[] = JSON.parse(panelDataResponse.text);
            const fullPanels: StoryboardPanel[] = [];

            for (let i = 0; i < panels.length; i++) {
                const panel = panels[i];
                setLoadingMessage(`Generating sketch for panel ${i + 1}/${panels.length}...`);
                
                const imageResponse = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: `A professional black and white storyboard sketch with clear annotations, composition guides, and movement arrows. Style: clean, architectural lines. Content: ${panel.visualDescription}`,
                });
                
                fullPanels.push({
                    ...panel,
                    id: `panel_${new Date().getTime() + i}`,
                    imageUrl: `data:image/jpeg;base64,${imageResponse.generatedImages[0].image.imageBytes}`
                });
            }
            onUpdateScene({ ...scene, storyboardPanels: fullPanels });
        } catch (e: unknown) {
            console.error(e);
            let msg = 'Failed to generate storyboard.';
            if (e instanceof Error) msg = e.message;
            setError(msg);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const handleRegeneratePanel = async (panelIndex: number) => {
        const panelToRegen = scene.storyboardPanels[panelIndex];
        if (!panelToRegen) return;

        setIsRegeneratingPanel(panelIndex);
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const imageResponse = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `A professional black and white storyboard sketch with clear annotations, composition guides, and movement arrows. Style: clean, architectural lines. Content: ${panelToRegen.visualDescription}`,
            });

            const newImageUrl = `data:image/jpeg;base64,${imageResponse.generatedImages[0].image.imageBytes}`;
            const updatedPanels = scene.storyboardPanels.map((p, index) => 
                index === panelIndex ? { ...p, imageUrl: newImageUrl } : p
            );
            onUpdateScene({ ...scene, storyboardPanels: updatedPanels });

        } catch (e: unknown) {
            console.error(e);
            setError("Failed to regenerate panel sketch.");
        } finally {
            setIsRegeneratingPanel(null);
        }
    };

    const DetailTabButton: React.FC<{tab: DetailTab, label: string}> = ({ tab, label }) => (
        <button onClick={() => setActiveDetailTab(tab)} className={`px-3 py-1 text-xs font-medium border-b-2 ${activeDetailTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>
            {label}
        </button>
    )

    const selectedPanel = scene.storyboardPanels[selectedPanelIndex];

    return (
        <div className="p-4 flex flex-col h-full text-gray-800">
             {isFullScreen && selectedPanel && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setIsFullScreen(false)}>
                    <img src={selectedPanel.imageUrl} alt="Full screen panel" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
                </div>
            )}

            <div className="flex-shrink-0 border-b pb-2 mb-4">
                <h3 className="text-lg font-bold">Storyboard (Scene {scene.number})</h3>
                <p className="text-sm text-gray-600">Generate a professional storyboard from your scene's script.</p>
            </div>
            
            <div className="flex gap-2 mb-4">
                <button onClick={handleGenerateStoryboard} disabled={isLoading} className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-500 disabled:bg-gray-400">
                    {isLoading ? loadingMessage : (scene.storyboardPanels.length > 0 ? 'Regenerate All' : 'Generate Storyboard')}
                </button>
                 <button onClick={() => setSelectedTool('Editor')} className="w-full py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300">
                    Jump to Scene Editor
                </button>
            </div>
            
            {error && <p className="mb-4 text-red-500 text-sm bg-red-100 p-2 rounded">{error}</p>}
            
            {scene.storyboardPanels.length > 0 && (
                <div className="flex-grow flex flex-col min-h-0">
                    <div className="flex justify-center mb-2 p-1 bg-gray-200 rounded-md">
                        <button onClick={() => setViewMode('grid')} className={`w-1/2 py-1 text-sm rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}>Grid</button>
                        <button onClick={() => setViewMode('filmstrip')} className={`w-1/2 py-1 text-sm rounded ${viewMode === 'filmstrip' ? 'bg-white shadow' : ''}`}>Filmstrip</button>
                    </div>

                    {viewMode === 'grid' && (
                        <div className="flex-grow overflow-y-auto grid grid-cols-2 gap-3 p-1">
                            {scene.storyboardPanels.map((panel, index) => (
                                <div key={panel.id} className="border rounded-md p-1 cursor-pointer hover:border-blue-500" onClick={() => { setSelectedPanelIndex(index); setViewMode('filmstrip'); }}>
                                    <img src={panel.imageUrl} alt={`Panel ${panel.panelNumber}`} className="w-full aspect-video object-cover rounded-sm bg-gray-100" />
                                    <p className="text-xs font-bold mt-1 truncate">#{panel.panelNumber}: {panel.shotType}</p>
                                    <p className="text-xs text-gray-500 truncate">{panel.visualDescription}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {viewMode === 'filmstrip' && selectedPanel && (
                         <div className="flex-grow flex flex-col min-h-0">
                            <div className="relative group p-1 border rounded-md bg-gray-100">
                                <img src={selectedPanel.imageUrl} alt={`Panel ${selectedPanel.panelNumber}`} className="w-full aspect-video object-contain bg-gray-800 rounded-md"/>
                                {isRegeneratingPanel === selectedPanelIndex && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><p className="text-white">Regenerating...</p></div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleRegeneratePanel(selectedPanelIndex)} disabled={isRegeneratingPanel !== null} className="p-1.5 bg-white/80 rounded-md hover:bg-white" title="Regenerate Panel">
                                        <RefreshIcon className="w-4 h-4 text-gray-800"/>
                                    </button>
                                    <button onClick={() => setIsFullScreen(true)} className="p-1.5 bg-white/80 rounded-md hover:bg-white" title="Full Screen">
                                        <MaximizeIcon className="w-4 h-4 text-gray-800"/>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-shrink-0 my-2 overflow-x-auto">
                                <div className="flex gap-2 p-1">
                                {scene.storyboardPanels.map((panel, index) => (
                                    <img key={panel.id} src={panel.imageUrl} onClick={() => setSelectedPanelIndex(index)}
                                        className={`w-20 h-12 object-cover rounded-md cursor-pointer border-2 ${selectedPanelIndex === index ? 'border-blue-500' : 'border-transparent hover:border-blue-300'}`}
                                    />
                                ))}
                                </div>
                            </div>

                            <div className="flex-grow flex flex-col min-h-0 border rounded-md">
                                <div className="flex-shrink-0 flex border-b">
                                    <DetailTabButton tab="details" label="Details"/>
                                    <DetailTabButton tab="camera" label="Camera"/>
                                    <DetailTabButton tab="characters" label="Characters"/>
                                    <DetailTabButton tab="notes" label="Notes"/>
                                </div>
                                <div className="flex-grow overflow-y-auto p-2 text-xs space-y-1">
                                    {activeDetailTab === 'details' && <>
                                        <p><strong>Panel:</strong> {selectedPanel.panelNumber} ({selectedPanel.timing})</p>
                                        <p><strong>Shot:</strong> {selectedPanel.shotType}</p>
                                        <p><strong>Description:</strong> {selectedPanel.visualDescription}</p>
                                        <p><strong>Dialogue:</strong> <em>{selectedPanel.dialogueSnippet || 'N/A'}</em></p>
                                    </>}
                                    {activeDetailTab === 'camera' && <>
                                        <p><strong>Angle:</strong> {selectedPanel.cameraAngle}</p>
                                        <p><strong>Movement:</strong> {selectedPanel.cameraMovement}</p>
                                        <p><strong>Transition:</strong> {selectedPanel.transition}</p>
                                        <p><strong>Lighting:</strong> {selectedPanel.lightingAndMood}</p>
                                    </>}
                                    {activeDetailTab === 'characters' && <>
                                        <p><strong>Pose:</strong> {selectedPanel.characterPose}</p>
                                        <p><strong>Key Elements:</strong> {selectedPanel.keyVisualElements}</p>
                                    </>}
                                    {activeDetailTab === 'notes' && <>
                                        <p><strong>Director's Notes:</strong> {selectedPanel.directorsNotes}</p>
                                        <p><strong>Background:</strong> {selectedPanel.backgroundDetails}</p>
                                    </>}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default StoryboardTab;