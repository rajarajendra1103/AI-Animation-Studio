import React, { useState } from 'react';
import { Scene, Project, SceneAnalysis, CameraMovement } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

interface DirectorTabProps {
    scene: Scene;
    project: Project;
    onUpdateScene: (scene: Scene) => void;
}

export const DirectorTab: React.FC<DirectorTabProps> = ({ scene, project, onUpdateScene }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<SceneAnalysis | null>(null);
    
    const handleAnalyzeScene = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            // Simplified scene data for the prompt
            const sceneContext = {
                script: scene.script,
                duration: scene.duration,
                characters: scene.characters.map(c => {
                    const asset = project.assets.find(a => a.id === c.assetId);
                    return { name: asset?.name || 'Unknown', position: c.position, animation: c.animation };
                }),
                dialogue: scene.dialogue.map(d => {
                     const charInstance = scene.characters.find(c => c.id === d.characterId);
                     const asset = project.assets.find(a => a.id === charInstance?.assetId);
                     return `${asset?.name || 'Unknown'}: "${d.line}" (${d.emotion})`
                }).join('\n')
            };
            
            const prompt = `Analyze this animation scene and provide feedback as a professional director. Return a JSON object with the specified structure.
            Scene Context:
            - Script: "${sceneContext.script}"
            - Duration: ${sceneContext.duration} seconds
            - Characters: ${JSON.stringify(sceneContext.characters)}
            - Dialogue:\n${sceneContext.dialogue}
            
            Provide specific, actionable advice for each section. The quality score should be from 0-100. Be critical but constructive.
            For characterChoreography, provide blocking for at least one character.
            For cameraWork, choose from these angles: 'eye-level', 'high-angle', 'low-angle', 'birds-eye', 'worms-eye' and these movements: 'static', 'pan-left', 'pan-right', 'zoom-in', 'zoom-out', 'dolly', 'truck'.
            For character positions, use stage directions like 'upstage', 'downstage', 'stage-left', 'stage-right', 'center'.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            overallAssessment: { type: Type.OBJECT, properties: {
                                score: { type: Type.INTEGER },
                                strengths: { type: Type.STRING },
                                weaknesses: { type: Type.STRING },
                                priorities: { type: Type.ARRAY, items: { type: Type.STRING } },
                            }},
                            composition: { type: Type.OBJECT, properties: {
                                arrangement: { type: Type.STRING },
                                focalPoint: { type: Type.STRING },
                                balance: { type: Type.STRING },
                            }},
                            cameraWork: { type: Type.OBJECT, properties: {
                                recommendedAngle: { type: Type.STRING },
                                recommendedMovement: { type: Type.STRING },
                                reasoning: { type: Type.STRING },
                            }},
                            pacing: { type: Type.OBJECT, properties: {
                                currentDuration: { type: Type.NUMBER },
                                recommendedDuration: { type: Type.NUMBER },
                                rationale: { type: Type.STRING },
                            }},
                            emotionalImpact: { type: Type.OBJECT, properties: {
                                targetEmotion: { type: Type.STRING },
                                techniqueSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                            }},
                            characterChoreography: { type: Type.OBJECT, properties: {
                                blocking: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                                    character: { type: Type.STRING },
                                    startPosition: { type: Type.STRING },
                                    movementPath: { type: Type.STRING },
                                    keyPoses: { type: Type.STRING },
                                }}},
                            }},
                             visualFlow: { type: Type.OBJECT, properties: {
                                continuityNotes: { type: Type.STRING },
                                lighting: { type: Type.STRING },
                                mood: { type: Type.STRING },
                            }},
                        }
                    }
                }
            });

            setAnalysis(JSON.parse(response.text));

        } catch (e: unknown) {
            console.error(e);
            let msg = 'Failed to get analysis.';
            if (e instanceof Error) msg = e.message;
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplySuggestion = (key: 'cameraMovement' | 'duration', value: any) => {
        onUpdateScene({ ...scene, [key]: value });
    };

    return (
        <div className="p-4 flex flex-col h-full text-gray-800 overflow-y-auto">
            <h3 className="text-lg font-bold mb-2 border-b pb-2">AI Scene Director</h3>
            <p className="text-sm text-gray-600 mb-4">Get professional feedback on Scene {scene.number} to improve its quality and impact.</p>
            <button
                onClick={handleAnalyzeScene}
                disabled={isLoading}
                className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-500 disabled:bg-gray-400"
            >
                {isLoading ? 'Analyzing...' : 'Analyze Scene'}
            </button>

            {error && <p className="mt-4 text-red-500 text-sm bg-red-100 p-2 rounded">{error}</p>}

            {analysis && (
                <div className="mt-4 space-y-4 text-sm">
                    {/* Overall Assessment */}
                    <div className="p-3 bg-gray-50 rounded-md border">
                        <h4 className="font-bold mb-2">Overall Assessment</h4>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="text-3xl font-bold text-blue-600">{analysis.overallAssessment.score}<span className="text-lg">/100</span></div>
                            <div>
                                <p><strong className="text-green-600">Strengths:</strong> {analysis.overallAssessment.strengths}</p>
                                <p><strong className="text-red-600">Weaknesses:</strong> {analysis.overallAssessment.weaknesses}</p>
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold">Improvement Priorities:</p>
                            <ul className="list-disc list-inside text-gray-700">
                                {analysis.overallAssessment.priorities.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                        </div>
                    </div>
                    
                    {/* Camera & Pacing */}
                    <div className="grid grid-cols-2 gap-4">
                         <div className="p-3 bg-gray-50 rounded-md border">
                            <h4 className="font-bold mb-2">Camera Work</h4>
                             <p><strong>Angle:</strong> <span className="capitalize">{analysis.cameraWork.recommendedAngle.replace('-',' ')}</span></p>
                             <p><strong>Movement:</strong> <span className="capitalize">{analysis.cameraWork.recommendedMovement.replace('-',' ')}</span></p>
                             <p className="text-xs text-gray-600 mt-1">{analysis.cameraWork.reasoning}</p>
                             <button onClick={() => handleApplySuggestion('cameraMovement', analysis.cameraWork.recommendedMovement as CameraMovement)} className="mt-2 w-full text-xs py-1 bg-gray-200 rounded hover:bg-gray-300">Apply Movement</button>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-md border">
                            <h4 className="font-bold mb-2">Pacing</h4>
                             <p><strong>Current:</strong> {analysis.pacing.currentDuration}s</p>
                             <p><strong>Recommended:</strong> {analysis.pacing.recommendedDuration}s</p>
                             <p className="text-xs text-gray-600 mt-1">{analysis.pacing.rationale}</p>
                             <button onClick={() => handleApplySuggestion('duration', analysis.pacing.recommendedDuration)} className="mt-2 w-full text-xs py-1 bg-gray-200 rounded hover:bg-gray-300">Apply Duration</button>
                        </div>
                    </div>
                    
                     {/* Character Choreography */}
                    <div className="p-3 bg-gray-50 rounded-md border">
                        <h4 className="font-bold mb-2">Character Choreography & Blocking</h4>
                        {analysis.characterChoreography.blocking.map((b, i) => (
                            <div key={i} className="mb-2 last:mb-0">
                                <p className="font-semibold">{b.character}</p>
                                <ul className="list-disc list-inside text-xs text-gray-700">
                                    <li><strong>Start:</strong> {b.startPosition}</li>
                                    <li><strong>Path:</strong> {b.movementPath}</li>
                                    <li><strong>Key Poses:</strong> {b.keyPoses}</li>
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Other sections */}
                    <div className="p-3 bg-gray-50 rounded-md border">
                        <h4 className="font-bold mb-2">Lighting, Mood & Flow</h4>
                        <p><strong>Mood:</strong> {analysis.visualFlow.mood}</p>
                        <p><strong>Lighting:</strong> {analysis.visualFlow.lighting}</p>
                        <p className="text-xs text-gray-600 mt-1"><strong>Continuity:</strong> {analysis.visualFlow.continuityNotes}</p>
                    </div>

                </div>
            )}
        </div>
    );
};