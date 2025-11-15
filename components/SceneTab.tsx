import React, { useState, useEffect } from 'react';
import { Scene, Project, CameraMovement, CharacterPosition, CharacterAnimation, SceneCharacter, SceneDialogue, CharacterMovement, DialogueEmotion, CameraAngle, AnimationStyle, AnimationData } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface SceneTabProps {
    scene: Scene;
    project: Project;
    onUpdateScene: (scene: Scene) => void;
}

const cameraMovements: CameraMovement[] = ['none', 'pan-left', 'pan-right', 'zoom-in', 'zoom-out', 'dolly', 'static', 'truck'];
const cameraAngles: CameraAngle[] = ['eye-level', 'high-angle', 'low-angle', 'birds-eye', 'worms-eye'];
const charPositions: CharacterPosition[] = ['left', 'center', 'right', 'upstage', 'downstage', 'stage-left', 'stage-right'];
const charAnimations: CharacterAnimation[] = ['idle', 'walking', 'talking', 'action'];
const charMovements: CharacterMovement[] = ['none', 'enter-left', 'enter-right', 'exit-left', 'exit-right'];
const dialogueEmotions: DialogueEmotion[] = ['neutral', 'happy', 'sad', 'angry', 'surprised'];
const animationStyles: { id: AnimationStyle, name: string }[] = [ { id: 'realistic', name: 'Realistic' }, { id: 'squash-and-stretch', name: 'Squash & Stretch' }, { id: 'limited', name: 'Limited Animation' }, { id: 'bouncy', name: 'Bouncy' }, { id: 'robotic', name: 'Stiff/Robotic' } ];

const SceneTab: React.FC<SceneTabProps> = ({ scene, project, onUpdateScene }) => {
    const [localScene, setLocalScene] = useState(scene);

    useEffect(() => { setLocalScene(scene); }, [scene]);

    const handleUpdate = (updates: Partial<Scene>) => {
        const updatedScene = { ...localScene, ...updates };
        setLocalScene(updatedScene);
        onUpdateScene(updatedScene);
    };
    
    const handleCharacterChange = (charId: string, updates: Partial<SceneCharacter>) => {
        const originalChar = localScene.characters.find(c => c.id === charId);
        if (!originalChar) return;

        // Enhanced Workflow: When a character's movement is set to an enter/exit animation
        // from 'none', we automatically create a default idle animation layer.
        if (updates.movement && updates.movement !== 'none' && originalChar.movement === 'none') {
            if (!originalChar.animationLayers?.idle) {
                // The new idle layer's duration matches the scene's duration for perfect timing.
                const newIdleAnimation: AnimationData = {
                    type: 'idle',
                    frames: [],
                    duration: localScene.duration,
                };

                const finalUpdates: Partial<SceneCharacter> = {
                    ...updates,
                    animationLayers: {
                        ...originalChar.animationLayers,
                        idle: newIdleAnimation,
                    },
                };
                
                handleUpdate({
                    characters: localScene.characters.map(c =>
                        c.id === charId ? { ...c, ...finalUpdates } : c
                    ),
                });
                return; // Return early as handleUpdate was called.
            }
        }

        // Default update logic for all other character changes.
        handleUpdate({
            characters: localScene.characters.map(c =>
                c.id === charId ? { ...c, ...updates } : c
            ),
        });
    };
    
    const handleAddCharacter = () => {
        const firstCharAsset = project.assets.find(a => a.type === 'character');
        if (!firstCharAsset) { alert("No character assets found. Please upload a character in the 'Assets' tab first."); return; }
        const newChar: SceneCharacter = { id: `sc_char_${Date.now()}`, assetId: firstCharAsset.id, position: 'center', animation: 'idle', movement: 'none', animationStyle: 'realistic', animationLayers: { talking: {} } };
        handleUpdate({ characters: [...localScene.characters, newChar] });
    };
    const handleRemoveCharacter = (charId: string) => handleUpdate({ characters: localScene.characters.filter(c => c.id !== charId), dialogue: localScene.dialogue.filter(d => d.characterId !== charId) });
    
    const handleAddDialogue = () => {
        if (localScene.characters.length === 0) { alert("Add a character before adding dialogue."); return; }
        const newDialogue: SceneDialogue = { id: `sc_dlg_${Date.now()}`, characterId: localScene.characters[0].id, line: '', emotion: 'neutral', audioAssetId: null };
        handleUpdate({ dialogue: [...localScene.dialogue, newDialogue] });
    };
    const handleDialogueChange = (dialogueId: string, updates: Partial<SceneDialogue>) => handleUpdate({ dialogue: localScene.dialogue.map(d => d.id === dialogueId ? { ...d, ...updates } : d) });
    const handleRemoveDialogue = (dialogueId: string) => handleUpdate({ dialogue: localScene.dialogue.filter(d => d.id !== dialogueId) });

    const characterAssets = project.assets.filter(a => a.type === 'character');
    const backgroundAssets = project.assets.filter(a => ['background', 'prop', 'video'].includes(a.type));
    const audioAssets = project.assets.filter(a => a.type === 'audio');

    return (
        <div className="p-4 flex flex-col h-full text-slate-800 overflow-y-auto">
            <h3 className="panel-header">Manual Editor</h3>

            <div className="mb-4">
                <h4 className="section-header">Properties</h4>
                <div className="space-y-4 text-sm">
                    <div>
                        <label className="font-medium">Script</label>
                        <textarea value={localScene.script} onChange={e => handleUpdate({ script: e.target.value })} rows={3} className="form-textarea mt-1" />
                    </div>
                     <div>
                        <label className="font-medium">Background</label>
                        <select value={localScene.backgroundAssetId || ''} onChange={e => handleUpdate({ backgroundAssetId: e.target.value || null })} className="form-select mt-1">
                            <option value="">None</option>
                            {backgroundAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <h5 className="font-medium mb-1">Camera & Timing</h5>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-slate-600">Movement</label>
                                <select value={localScene.cameraMovement} onChange={e => handleUpdate({ cameraMovement: e.target.value as CameraMovement })} className="form-select capitalize mt-1 !p-2 !text-xs">
                                    {cameraMovements.map(m => <option key={m} value={m}>{m.replace('-',' ')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-600">Angle</label>
                                <select value={localScene.cameraAngle} onChange={e => handleUpdate({ cameraAngle: e.target.value as CameraAngle })} className="form-select capitalize mt-1 !p-2 !text-xs">
                                    {cameraAngles.map(m => <option key={m} value={m}>{m.replace('-',' ')}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="text-xs text-slate-600">Duration (s)</label>
                                <input type="number" value={localScene.duration} onChange={e => handleUpdate({ duration: Number(e.target.value) })} min="0.1" step="0.1" className="form-input mt-1 !p-2 !text-xs" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="section-header">Characters</h4>
                    <button onClick={handleAddCharacter} className="btn btn-secondary !px-2 !py-1 text-xs"><PlusIcon className="w-3 h-3"/> Add</button>
                </div>
                <div className="space-y-2">
                    {localScene.characters.map(char => (
                        <div key={char.id} className="card text-sm space-y-2">
                           <div className="flex items-center gap-2">
                                <select value={char.assetId} onChange={e => handleCharacterChange(char.id, { assetId: e.target.value })} className="form-select !p-1 text-xs">{characterAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                                <button onClick={() => handleRemoveCharacter(char.id)} className="btn btn-danger !p-1.5"><TrashIcon className="w-3 h-3"/></button>
                           </div>
                           <div className="grid grid-cols-3 gap-2">
                                <select value={char.position} onChange={e => handleCharacterChange(char.id, { position: e.target.value as CharacterPosition })} className="form-select !p-1 text-xs capitalize">{charPositions.map(p => <option key={p} value={p}>{p}</option>)}</select>
                                <select value={char.animation} onChange={e => handleCharacterChange(char.id, { animation: e.target.value as CharacterAnimation })} className="form-select !p-1 text-xs capitalize">{charAnimations.map(a => <option key={a} value={a}>{a}</option>)}</select>
                                <select value={char.movement} onChange={e => handleCharacterChange(char.id, { movement: e.target.value as CharacterMovement })} className="form-select !p-1 text-xs capitalize">{charMovements.map(m => <option key={m} value={m}>{m.replace('-',' ')}</option>)}</select>
                           </div>
                           <div>
                               <label className="font-medium text-xs">Animation Style</label>
                                <select value={char.animationStyle} onChange={e => handleCharacterChange(char.id, { animationStyle: e.target.value as AnimationStyle })} className="form-select !p-1 mt-1 text-xs capitalize">{animationStyles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                           </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div>
                 <div className="flex justify-between items-center mb-2">
                    <h4 className="section-header">Dialogue</h4>
                    <button onClick={handleAddDialogue} className="btn btn-secondary !px-2 !py-1 text-xs"><PlusIcon className="w-3 h-3"/> Add</button>
                </div>
                 <div className="space-y-2">
                    {localScene.dialogue.map(dlg => (
                        <div key={dlg.id} className="card text-sm space-y-2">
                            <div className="flex items-center gap-2">
                                <select value={dlg.characterId} onChange={e => handleDialogueChange(dlg.id, { characterId: e.target.value })} className="form-select !p-1 text-xs w-2/5">{localScene.characters.map(c => { const asset = project.assets.find(a => a.id === c.assetId); return <option key={c.id} value={c.id}>{asset?.name || 'Unknown'}</option> })}</select>
                                <input type="text" value={dlg.line} onChange={e => handleDialogueChange(dlg.id, { line: e.target.value })} placeholder="Dialogue..." className="form-input !p-1 text-xs w-3/5"/>
                                <button onClick={() => handleRemoveDialogue(dlg.id)} className="btn btn-danger !p-1.5"><TrashIcon className="w-3 h-3"/></button>
                            </div>
                             <div className="flex gap-2">
                                <select value={dlg.emotion} onChange={e => handleDialogueChange(dlg.id, { emotion: e.target.value as DialogueEmotion })} className="form-select !p-1 text-xs capitalize">{dialogueEmotions.map(e => <option key={e} value={e}>{e}</option>)}</select>
                                <select value={dlg.audioAssetId || ''} onChange={e => handleDialogueChange(dlg.id, { audioAssetId: e.target.value || null })} className="form-select !p-1 text-xs"><option value="">No Voice</option>{audioAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};

export default SceneTab;