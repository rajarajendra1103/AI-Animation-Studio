import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectsContext';
import { Project, Asset, Scene, SceneCharacter } from '../types';
import { GoogleGenAI, Type } from '@google/genai';
import { UndoIcon, RedoIcon, ExportIcon, PlayIcon, ScriptIcon, SceneIcon, AssetsIcon, DrawingIcon, AIIcon, AnimateIcon, AudioIcon, DirectorIcon, SequenceIcon, StoryboardIcon, GenerateIcon, SearchIcon, EditIcon, CharacterIcon, PauseIcon, AnimationStyleIcon, BackIcon, UploadIcon } from '../components/icons';
import AssetsTab from '../components/AssetsTab';
import DrawingTab from '../components/DrawingTab';
import AITab from '../components/AITab';
import SceneTab from '../components/SceneTab';
import SceneTimeline from '../components/SceneTimeline';
import AnimateTab from '../components/AnimateTab';
import AudioTab from '../components/AudioTab';
import ScriptTab from '../components/ScriptTab';
import { DirectorTab } from '../components/DirectorTab';
import SequenceTab from '../components/SequenceTab';
import StoryboardTab from '../components/StoryboardTab';
import GenerateTab from '../components/GenerateTab';
import SearchTab from '../components/SearchTab';
import CharacterTab from '../components/CharacterTab';
import { AnimationStyleTab } from '../components/AnimationStyleTab';

type Tool = 'Search' | 'Script' | 'Sequence' | 'Storyboard' | 'Editor' | 'Character' | 'Anim Style' | 'Assets' | 'Drawing' | 'Generate' | 'AI Story' | 'Animate' | 'Audio' | 'Director';

const StudioPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { getProject, updateProject } = useProjects();
    const navigate = useNavigate();

    const [project, setProject] = useState<Project | null>(null);
    const [projectName, setProjectName] = useState('');
    const [selectedTool, setSelectedTool] = useState<Tool>('Editor');
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Animation Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const animationFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);

    const totalDuration = project?.scenes.reduce((acc, scene) => acc + scene.duration, 0) || 0;
    const sceneStartTimes = useRef<{ [key: string]: number }>({});

    useEffect(() => {
        if (projectId) {
            const currentProject = getProject(projectId);
            if (currentProject) {
                setProject(currentProject);
                setProjectName(currentProject.name);
                
                let cumulativeTime = 0;
                const times: { [key: string]: number } = {};
                currentProject.scenes.forEach(scene => {
                    times[scene.id] = cumulativeTime;
                    cumulativeTime += scene.duration;
                });
                sceneStartTimes.current = times;

                if (currentProject.scenes.length > 0 && !selectedSceneId) {
                    setSelectedSceneId(currentProject.scenes[0].id);
                } else if (currentProject.scenes.length === 0) {
                    setSelectedSceneId(null);
                }
            }
        }
    }, [projectId, getProject, selectedSceneId, project?.scenes]);
    
    const animate = useCallback((time: number) => {
        if (lastTimeRef.current === null) {
            lastTimeRef.current = time;
        }
        const deltaTime = (time - lastTimeRef.current!) / 1000;
        lastTimeRef.current = time;

        setCurrentTime(prevTime => {
            const newTime = prevTime + deltaTime;
            if (newTime >= totalDuration) {
                setIsPlaying(false);
                return totalDuration;
            }
            return newTime;
        });

        animationFrameRef.current = requestAnimationFrame(animate);
    }, [totalDuration]);

    useEffect(() => {
        if (isPlaying) {
            lastTimeRef.current = null;
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, animate]);

    const handleTogglePlay = () => {
        if (isPlaying) {
            setIsPlaying(false);
        } else {
            if (currentTime >= totalDuration) {
                setCurrentTime(0);
            }
            setIsPlaying(true);
        }
    };
    
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setProjectName(e.target.value);
    const handleNameBlur = () => {
        if (projectId && project && projectName !== project.name) updateProject(projectId, { name: projectName });
    };
    const handleProjectUpdate = useCallback((updates: Partial<Project>) => {
        if (projectId) updateProject(projectId, updates);
    }, [projectId, updateProject]);
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !project) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const dataUrl = reader.result as string;
                let newAsset: Asset;

                if (!file.type.startsWith('image/')) {
                    const assetType = file.type.startsWith('video') ? 'video' : (file.type.startsWith('audio') ? 'audio' : 'prop');
                    newAsset = {
                        id: `asset_${new Date().getTime()}`,
                        name: file.name,
                        type: assetType,
                        url: dataUrl,
                        tags: [assetType],
                    };
                    handleProjectUpdate({ assets: [...project.assets, newAsset] });
                } else {
                    const base64String = dataUrl.split(',')[1];
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                    const prompt = `Analyze this image and provide detailed metadata. Format the output as a single JSON object with the following structure:
                    { "name": "A short, suitable name for the asset", "aiMetadata": { "description": "A comprehensive description...", "detectedObjects": ["object1", "object2"], "sceneContext": "e.g., 'Outdoor, forest clearing'", "mood": "e.g., 'Peaceful'", "dominantColors": ["color1", "color2"], "composition": "e.g., 'Rule of thirds'", "suggestedUsage": "Suggestions for use", "artStyle": "Primary art style", "colorPaletteDescription": "Description of the colors", "lighting": "Description of lighting", "lineQuality": "e.g., 'Thin, consistent'", "artisticTone": "e.g., 'Whimsical'", "searchKeywords": ["keyword1", "keyword2"] }, "tags": ["tag1", "tag2"] }`;

                    const responseSchema = {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            aiMetadata: {
                                type: Type.OBJECT,
                                properties: {
                                    description: { type: Type.STRING },
                                    detectedObjects: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    sceneContext: { type: Type.STRING },
                                    mood: { type: Type.STRING },
                                    dominantColors: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    composition: { type: Type.STRING },
                                    suggestedUsage: { type: Type.STRING },
                                    artStyle: { type: Type.STRING },
                                    colorPaletteDescription: { type: Type.STRING },
                                    lighting: { type: Type.STRING },
                                    lineQuality: { type: Type.STRING },
                                    artisticTone: { type: Type.STRING },
                                    searchKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                                }
                            },
                            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    };
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: [ { inlineData: { mimeType: file.type, data: base64String } }, { text: prompt }, ],
                        config: { responseMimeType: 'application/json', responseSchema }
                    });
                    const resultJson = JSON.parse(response.text);
                    newAsset = {
                        id: `asset_${new Date().getTime()}`,
                        name: resultJson.name || file.name,
                        type: 'character',
                        url: dataUrl,
                        tags: resultJson.tags || [],
                        aiMetadata: resultJson.aiMetadata,
                    };
                    handleProjectUpdate({ assets: [...project.assets, newAsset] });
                }
            } catch (error) {
                console.error("Failed to process asset:", error);
                 const assetType = file.type.startsWith('image') ? 'prop' : file.type.startsWith('video') ? 'video' : 'audio';
                 const fallbackAsset: Asset = {
                    id: `asset_${new Date().getTime()}`,
                    name: file.name,
                    type: assetType,
                    url: reader.result as string,
                    tags: [assetType],
                };
                handleProjectUpdate({ assets: [...project.assets, fallbackAsset] });
            } finally {
                setIsUploading(false);
                if (e.target) e.target.value = '';
            }
        };
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleAddScene = () => {
        if (!project) return;
        const newScene: Scene = { id: `scene_${Date.now()}`, number: project.scenes.length + 1, script: '', duration: 5, cameraMovement: 'none', cameraAngle: 'eye-level', characters: [], dialogue: [], backgroundAssetId: null, storyboardPanels: [], backgroundMusicAssetId: null, soundEffects: [] };
        const updatedScenes = [...project.scenes, newScene];
        handleProjectUpdate({ scenes: updatedScenes });
        setSelectedSceneId(newScene.id);
    };
    const handleDeleteScene = (sceneId: string) => {
        if (!project || !window.confirm("Delete this scene?")) return;
        const updatedScenes = project.scenes.filter(s => s.id !== sceneId).map((s, i) => ({ ...s, number: i + 1 }));
        handleProjectUpdate({ scenes: updatedScenes });
        if (selectedSceneId === sceneId) setSelectedSceneId(updatedScenes[0]?.id || null);
    };
    const handleUpdateScene = (updatedScene: Scene) => {
        if (!project) return;
        const updatedScenes = project.scenes.map(s => s.id === updatedScene.id ? updatedScene : s);
        handleProjectUpdate({ scenes: updatedScenes });
    };
    const handleBulkAddScenesAndAssets = (newScenes: Scene[], newAssets: Asset[]) => {
        if (!project) return;
        const updatedScenes = [...project.scenes, ...newScenes].map((s, i) => ({ ...s, number: i + 1 }));
        const updatedAssets = [...project.assets, ...newAssets];
        handleProjectUpdate({ scenes: updatedScenes, assets: updatedAssets });
        if (newScenes.length > 0) {
            setSelectedSceneId(newScenes[0].id);
            setSelectedTool('Editor');
        }
    };
    const handleAnimatedSceneCreated = (newSceneId: string) => {
        setSelectedSceneId(newSceneId);
        setSelectedTool('Editor');
    };

    const handleSelectSceneAndFocusEditor = (sceneId: string) => {
        setSelectedSceneId(sceneId);
        setSelectedTool('Editor');
    };

    if (!project) return <div className="flex items-center justify-center h-full">Loading...</div>;
    
    const tools: { name: Tool, icon: React.FC<{className?: string}> }[] = [ { name: 'Search', icon: SearchIcon }, { name: 'Script', icon: ScriptIcon }, { name: 'Sequence', icon: SequenceIcon }, { name: 'Storyboard', icon: StoryboardIcon }, { name: 'Editor', icon: EditIcon }, { name: 'Character', icon: CharacterIcon }, { name: 'Anim Style', icon: AnimationStyleIcon }, { name: 'Assets', icon: AssetsIcon }, { name: 'Drawing', icon: DrawingIcon }, { name: 'Generate', icon: GenerateIcon }, { name: 'AI Story', icon: AIIcon }, { name: 'Animate', icon: AnimateIcon }, { name: 'Audio', icon: AudioIcon }, { name: 'Director', icon: DirectorIcon } ];
    
    let activeScene = selectedSceneId ? project.scenes.find(s => s.id === selectedSceneId) : null;
    if (isPlaying) {
        const playingScene = [...project.scenes].reverse().find(scene => currentTime >= sceneStartTimes.current[scene.id]);
        activeScene = playingScene || null;
    }

    const backgroundAsset = activeScene?.backgroundAssetId ? project.assets.find(a => a.id === activeScene.backgroundAssetId) : null;
    const getCharacterDialogue = (charId: string) => activeScene?.dialogue.filter(d => d.characterId === charId).map(d => d.line).join(' ');
    const getPositionClass = (char: SceneCharacter) => ({ left: 'left-[5%]', right: 'right-[5%]', center: 'left-1/2 -translate-x-1/2' })[char.position] || 'left-1/2 -translate-x-1/2';

    const renderContentPanel = () => {
        const selectedSceneForEdit = project.scenes.find(s => s.id === selectedSceneId);
        switch (selectedTool) {
            case 'Search': return <SearchTab project={project} />;
            case 'Script': return <ScriptTab project={project} onProjectUpdate={handleProjectUpdate} />;
            case 'Sequence': return <SequenceTab project={project} onSequenceGenerated={handleBulkAddScenesAndAssets} />;
            case 'Storyboard': return selectedSceneForEdit ? <StoryboardTab key={selectedSceneId} scene={selectedSceneForEdit} onUpdateScene={handleUpdateScene} setSelectedTool={setSelectedTool as (tool: 'Editor') => void} /> : <div className="p-4 text-center">Select a scene.</div>;
            case 'Editor': return selectedSceneForEdit ? <SceneTab key={selectedSceneId} scene={selectedSceneForEdit} project={project} onUpdateScene={handleUpdateScene} /> : <div className="p-4 text-center">Select or add a scene.</div>;
            case 'Character': return <CharacterTab project={project} onProjectUpdate={handleProjectUpdate} />;
            case 'Anim Style': return selectedSceneForEdit ? <AnimationStyleTab key={selectedSceneId} scene={selectedSceneForEdit} project={project} onUpdateScene={handleUpdateScene} /> : <div className="p-4 text-center">Select a scene.</div>;
            case 'Assets': return <AssetsTab project={project} onProjectUpdate={handleProjectUpdate} onAssetAddToTimeline={() => alert("Add assets via the 'Editor' tool.")} onFileUpload={handleFileUpload} isUploading={isUploading} />;
            case 'Drawing': return <DrawingTab project={project} onProjectUpdate={handleProjectUpdate} />;
            case 'Generate': return <GenerateTab project={project} onProjectUpdate={handleProjectUpdate} />;
            case 'AI Story': return <AITab project={project} onProjectUpdate={handleProjectUpdate} />;
            case 'Animate': return <AnimateTab project={project} onProjectUpdate={handleProjectUpdate} onSceneCreated={handleAnimatedSceneCreated} />;
            case 'Audio': return selectedSceneForEdit ? <AudioTab key={selectedSceneId} scene={selectedSceneForEdit} project={project} onUpdateScene={handleUpdateScene} onUpdateProject={handleProjectUpdate}/> : <div className="p-4 text-center">Select a scene.</div>;
            case 'Director': return selectedSceneForEdit ? <DirectorTab key={selectedSceneId} scene={selectedSceneForEdit} project={project} onUpdateScene={handleUpdateScene} /> : <div className="p-4 text-center">Select a scene.</div>;
            default: return <div className="p-4">Select a tool</div>;
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-100 text-slate-800">
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,video/*,audio/*"
            />
            <div className="flex-shrink-0 bg-white px-4 py-2 flex items-center justify-between shadow-sm z-20 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/projects')} className="btn btn-secondary !p-2.5" title="Back to Projects">
                        <BackIcon className="w-5 h-5" />
                    </button>
                    <input type="text" value={projectName} onChange={handleNameChange} onBlur={handleNameBlur} className="form-input !p-1 !border-transparent focus:!border-blue-500 !bg-transparent text-lg font-bold" aria-label="Project Name" />
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={handleUploadClick} className="btn btn-secondary" title="Upload Asset" disabled={isUploading}>
                        <UploadIcon className="w-5 h-5" />
                        <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                    </button>
                    <button onClick={handleTogglePlay} className="btn btn-secondary" title="Preview">
                        {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                        <span>{isPlaying ? 'Pause' : 'Preview'}</span>
                    </button>
                    <button className="btn btn-primary" title="Export"><ExportIcon className="w-5 h-5" /><span>Export</span></button>
                </div>
            </div>

            <div className="flex-grow flex overflow-hidden">
                <div className="w-20 flex-shrink-0 bg-white/80 backdrop-blur-sm text-slate-700 flex flex-col items-center py-2 space-y-1 border-r border-slate-200 shadow-lg overflow-y-auto">
                    {tools.map(tool => (
                        <button key={tool.name} onClick={() => setSelectedTool(tool.name)} className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg transition-all duration-200 group ${selectedTool === tool.name ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-100 text-slate-600'}`} title={tool.name}>
                            <tool.icon className="w-6 h-6 mb-1" />
                            <span className="text-xs tracking-tighter font-semibold">{tool.name}</span>
                        </button>
                    ))}
                </div>

                <div className="w-[384px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-lg z-10">{renderContentPanel()}</div>

                <div className="flex-grow flex items-center justify-center p-8 bg-slate-200/50">
                     <div className="w-full h-full bg-slate-800 rounded-lg shadow-2xl flex items-center justify-center relative overflow-hidden border-4 border-slate-300">
                       {backgroundAsset ? ( backgroundAsset.type === 'video' ? <video key={backgroundAsset.url} src={backgroundAsset.url} className="w-full h-full object-cover" autoPlay loop muted /> : <img src={backgroundAsset.url} alt="background" className="w-full h-full object-cover" /> ) : <div className="text-slate-400">Animation Preview</div> }
                       {activeScene && (
                           <>
                               <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded font-mono shadow">Scene: {activeScene.number}</div>
                               <div className="absolute inset-0">
                                   {activeScene.characters.map(char => {
                                       const charAsset = project.assets.find(a => a.id === char.assetId);
                                       if (!charAsset) return null;
                                       return (
                                           <div key={char.id} className={`absolute bottom-0 h-2/3 w-1/4 flex flex-col items-center ${getPositionClass(char)}`}>
                                                <div className="relative w-full h-full">
                                                    <img src={charAsset.url} alt={charAsset.name} className="h-full w-full object-contain drop-shadow-xl" />
                                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full capitalize shadow">{char.animation}</div>
                                                </div>
                                           </div>
                                       )
                                   })}
                               </div>
                           </>
                       )}
                    </div>
                </div>
            </div>

            <div className="h-40 flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 z-20 px-4 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
                 <SceneTimeline 
                    project={project}
                    scenes={project.scenes}
                    selectedSceneId={selectedSceneId}
                    onSelectScene={handleSelectSceneAndFocusEditor}
                    onAddScene={handleAddScene}
                    onDeleteScene={handleDeleteScene}
                    currentTime={currentTime}
                    totalDuration={totalDuration}
                    isPlaying={isPlaying}
                    onTimeUpdate={setCurrentTime}
                />
            </div>
        </div>
    );
};

export default StudioPage;