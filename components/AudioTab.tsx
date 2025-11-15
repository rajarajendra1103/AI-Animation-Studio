import React, { useState } from 'react';
import { Scene, Project, SoundEffect } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface AudioTabProps {
    scene: Scene;
    project: Project;
    onUpdateScene: (scene: Scene) => void;
    onUpdateProject: (project: Partial<Project>) => void;
}

const musicMoods = ['Happy', 'Sad', 'Dramatic', 'Suspenseful', 'Calm', 'Energetic', 'Mysterious'];

const AudioTab: React.FC<AudioTabProps> = ({ scene, project, onUpdateScene, onUpdateProject }) => {
    // Handlers for project-wide music
    const handleProjectMusicChange = (assetId: string | null) => {
        onUpdateProject({ projectWideMusicAssetId: assetId });
    };

    // Handlers for scene-specific music
    const handleSceneMusicChange = (assetId: string | null) => {
        onUpdateScene({ ...scene, backgroundMusicAssetId: assetId });
    };

    // Handlers for sound effects
    const handleAddSoundEffect = () => {
        const firstAudioEffect = project.assets.find(a => a.type === 'effect');
        if (!firstAudioEffect) {
            alert("No sound effect assets found. Upload an 'effect' type asset in the Assets tab first.");
            return;
        }
        const newEffect: SoundEffect = {
            id: `sfx_${new Date().getTime()}`,
            assetId: firstAudioEffect.id,
            startTime: 0,
            volume: 0.8,
        };
        onUpdateScene({ ...scene, soundEffects: [...scene.soundEffects, newEffect] });
    };

    const handleUpdateSoundEffect = (effectId: string, updates: Partial<SoundEffect>) => {
        const updatedEffects = scene.soundEffects.map(sfx =>
            sfx.id === effectId ? { ...sfx, ...updates } : sfx
        );
        onUpdateScene({ ...scene, soundEffects: updatedEffects });
    };

    const handleRemoveSoundEffect = (effectId: string) => {
        const updatedEffects = scene.soundEffects.filter(sfx => sfx.id !== effectId);
        onUpdateScene({ ...scene, soundEffects: updatedEffects });
    };
    
    const handleRecordVoice = () => {
        alert("Voice recording functionality coming soon!");
    };

    const musicAssets = project.assets.filter(a => a.type === 'music');
    const effectAssets = project.assets.filter(a => a.type === 'effect');

    return (
        <div className="p-4 flex flex-col h-full text-gray-800 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Audio Editor (Scene {scene.number})</h3>

            {/* Background Music */}
            <div className="mb-4">
                <h4 className="font-semibold text-md mb-2">Background Music</h4>
                <div className="p-3 bg-gray-100 rounded-md border border-gray-200 text-sm space-y-3">
                    <div>
                        <label className="font-medium">Project-Wide Music</label>
                        <select
                            value={project.projectWideMusicAssetId || ''}
                            onChange={(e) => handleProjectMusicChange(e.target.value || null)}
                            className="w-full mt-1 bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">None (Project-wide)</option>
                            {musicAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="font-medium">Scene-Specific Music (Overrides Project)</label>
                        <select
                            value={scene.backgroundMusicAssetId || ''}
                            onChange={(e) => handleSceneMusicChange(e.target.value || null)}
                            className="w-full mt-1 bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">None (Use Project music)</option>
                            {musicAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="font-medium">Music Mood</label>
                         <select className="w-full mt-1 bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none">
                             {musicMoods.map(mood => <option key={mood} value={mood.toLowerCase()}>{mood}</option>)}
                         </select>
                    </div>
                </div>
            </div>

            {/* Sound Effects */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-md">Sound Effects</h4>
                    <button onClick={handleAddSoundEffect} className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-xs font-medium rounded hover:bg-gray-300"><PlusIcon className="w-3 h-3"/> Add</button>
                </div>
                <div className="space-y-2">
                    {scene.soundEffects.map(sfx => (
                        <div key={sfx.id} className="p-2 bg-gray-100 rounded-md border border-gray-200 text-sm space-y-2">
                             <div className="flex items-center gap-2">
                                <select 
                                    value={sfx.assetId} 
                                    onChange={e => handleUpdateSoundEffect(sfx.id, { assetId: e.target.value })}
                                    className="w-full bg-white border border-gray-300 rounded-md p-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                >
                                    {effectAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                                <button onClick={() => handleRemoveSoundEffect(sfx.id)} className="p-1 bg-red-600 rounded text-white hover:bg-red-500"><TrashIcon className="w-3 h-3"/></button>
                           </div>
                           <div className="flex items-center gap-2 text-xs">
                               <label>Start (s):</label>
                               <input 
                                    type="number" 
                                    value={sfx.startTime}
                                    onChange={e => handleUpdateSoundEffect(sfx.id, { startTime: Number(e.target.value) })}
                                    min="0"
                                    step="0.1"
                                    className="w-16 bg-white border border-gray-300 rounded-md p-1 outline-none focus:ring-1 focus:ring-blue-500"
                                />
                               <label className="flex-grow text-right">Vol:</label>
                               <input 
                                    type="range" 
                                    value={sfx.volume}
                                    onChange={e => handleUpdateSoundEffect(sfx.id, { volume: Number(e.target.value) })}
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    className="w-full"
                               />
                               <span className="w-8 text-center">{sfx.volume.toFixed(2)}</span>
                           </div>
                        </div>
                    ))}
                    {scene.soundEffects.length === 0 && <p className="text-xs text-center text-gray-500 py-2">No sound effects in this scene.</p>}
                </div>
            </div>

            {/* Voice / Dialogue */}
             <div>
                <h4 className="font-semibold text-md mb-2">Voice / Dialogue</h4>
                 <div className="p-3 bg-gray-100 rounded-md border border-gray-200 text-sm space-y-3">
                     <button onClick={handleRecordVoice} className="w-full py-2 bg-gray-200 rounded-md text-sm font-medium hover:bg-gray-300">
                        Record Voice
                     </button>
                     <p className="text-xs text-center text-gray-500">
                         Attach recorded voice files to dialogue lines in the <span className="font-semibold">'Scene'</span> editor.
                     </p>
                 </div>
            </div>
        </div>
    );
};

export default AudioTab;