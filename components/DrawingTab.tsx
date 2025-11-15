import React, { useState } from 'react';
import { Project, StyleProfile } from '../types';
import { GoogleGenAI } from '@google/genai';
import { TrashIcon } from './icons';

interface DrawingTabProps {
    project: Project;
    onProjectUpdate: (updates: Partial<Project>) => void;
}

const DrawingTab: React.FC<DrawingTabProps> = ({ project, onProjectUpdate }) => {
    const [analysisImage, setAnalysisImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAnalysisImage(reader.result as string);
                setAnalysisResult('');
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAnalyzeStyle = async () => {
        if (!analysisImage) return;
        setIsAnalyzing(true);
        setAnalysisResult('');

        try {
            const base64String = analysisImage.split(',')[1];
            const mimeType = analysisImage.match(/data:(.*);base64,/)?.[1] || 'image/jpeg';
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType, data: base64String } },
                        { text: 'Describe the art style of this image in a concise phrase (e.g., "Vibrant cel-shaded cartoon", "Photorealistic digital painting", "Minimalist line art").' },
                    ]
                },
            });
            setAnalysisResult(response.text);
            setNewProfileName(response.text);
        } catch (error) {
            console.error("Style analysis failed:", error);
            setAnalysisResult("Could not analyze style.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleSaveProfile = () => {
        if (!newProfileName.trim() || !analysisResult.trim()) return;
        const newProfile: StyleProfile = {
            id: `style_${new Date().getTime()}`,
            name: newProfileName,
            description: analysisResult,
        };
        onProjectUpdate({ styleProfiles: [...project.styleProfiles, newProfile] });
        setNewProfileName('');
    };
    
    const handleDeleteProfile = (id: string) => {
        onProjectUpdate({ styleProfiles: project.styleProfiles.filter(p => p.id !== id) });
    };

    const handleSetReference = (profile: StyleProfile | null) => {
        onProjectUpdate({ currentStyleReference: profile });
    }

    return (
        <div className="p-4 flex flex-col h-full text-gray-800">
            <h3 className="text-lg font-bold mb-4">Drawing Style</h3>
            
            {/* Style Analyzer */}
            <div className="mb-4">
                <h4 className="font-semibold mb-2">Style Analyzer</h4>
                <div className="p-3 bg-gray-100 rounded-md border border-gray-200">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-400"/>
                    {analysisImage && <img src={analysisImage} alt="For analysis" className="mt-3 rounded-md max-h-32 w-auto mx-auto" />}
                    <button onClick={handleAnalyzeStyle} disabled={!analysisImage || isAnalyzing} className="w-full mt-3 py-2 bg-gray-200 rounded-md text-sm font-medium hover:bg-gray-300 disabled:bg-gray-200 disabled:text-gray-400">
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Style'}
                    </button>
                    {analysisResult && (
                        <div className="mt-3 text-sm">
                            <p className="font-semibold">Detected Style:</p>
                            <p className="p-2 bg-white rounded-md mt-1 border border-gray-200">{analysisResult}</p>
                            <div className="mt-2 flex gap-2">
                                <input type="text" value={newProfileName} onChange={e => setNewProfileName(e.target.value)} placeholder="Profile Name" className="flex-grow bg-white border border-gray-300 rounded-md p-1 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                                <button onClick={handleSaveProfile} className="px-2 py-1 bg-green-600 text-xs text-white rounded hover:bg-green-500">Save</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Style Profiles */}
            <div className="flex-grow flex flex-col">
                <h4 className="font-semibold mb-2">Style Profiles</h4>
                <div className="flex-grow overflow-y-auto bg-gray-100 rounded-md p-2 space-y-2 border border-gray-200">
                    {project.styleProfiles.map(profile => (
                        <div key={profile.id} className={`p-2 rounded-md transition-colors ${project.currentStyleReference?.id === profile.id ? 'bg-blue-100 border border-blue-300' : 'bg-white border border-gray-200'}`}>
                           <div className="flex justify-between items-center">
                               <p className="text-sm font-semibold truncate flex-grow mr-2" title={profile.name}>{profile.name}</p>
                                <div className="flex-shrink-0 flex items-center gap-1">
                                    <button onClick={() => handleSetReference(profile)} className="px-2 py-0.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-500">
                                        Use
                                    </button>
                                    <button onClick={() => handleDeleteProfile(profile.id)} className="p-1 bg-red-600 rounded hover:bg-red-500 text-white">
                                        <TrashIcon className="w-3 h-3"/>
                                    </button>
                               </div>
                           </div>
                        </div>
                    ))}
                    {project.styleProfiles.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No saved styles.</p>}
                </div>
            </div>
        </div>
    );
};

export default DrawingTab;