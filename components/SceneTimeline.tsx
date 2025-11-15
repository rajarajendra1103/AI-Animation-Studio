import React, { useRef, useEffect } from 'react';
import { Project, Scene } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface SceneTimelineProps {
    project: Project;
    scenes: Scene[];
    selectedSceneId: string | null;
    onSelectScene: (id: string) => void;
    onAddScene: () => void;
    onDeleteScene: (id: string) => void;
    currentTime: number;
    totalDuration: number;
    isPlaying: boolean;
    onTimeUpdate: (time: number) => void;
}

const PIXELS_PER_SECOND = 60;

const SceneTimeline: React.FC<SceneTimelineProps> = ({ project, scenes, selectedSceneId, onSelectScene, onAddScene, onDeleteScene, currentTime, totalDuration, isPlaying, onTimeUpdate }) => {
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        if (isPlaying && timelineContainerRef.current && timelineRef.current) {
            const playheadScreenPosition = (currentTime * PIXELS_PER_SECOND) - timelineContainerRef.current.scrollLeft;
            const containerWidth = timelineContainerRef.current.offsetWidth;
            if (playheadScreenPosition > containerWidth * 0.8) {
                timelineContainerRef.current.scrollLeft += playheadScreenPosition - (containerWidth * 0.8);
            } else if (playheadScreenPosition < containerWidth * 0.2 && timelineContainerRef.current.scrollLeft > 0) {
                 timelineContainerRef.current.scrollLeft -= (containerWidth * 0.2) - playheadScreenPosition;
            }
        }
    }, [currentTime, isPlaying]);

    const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = Math.max(0, Math.min(totalDuration, x / PIXELS_PER_SECOND));
        onTimeUpdate(time);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        isDraggingRef.current = true;
        handleScrub(e);
    };
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDraggingRef.current) {
            handleScrub(e);
        }
    };
    const handleMouseUp = () => {
        isDraggingRef.current = false;
    };
     const handleMouseLeave = () => {
        isDraggingRef.current = false;
    };

    let cumulativeTime = 0;
    const timeMarkers = Array.from({ length: Math.ceil(totalDuration) + 5 }, (_, i) => i);

    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex-shrink-0 text-sm font-mono text-slate-600">
                Playback: {currentTime.toFixed(2)}s / {totalDuration.toFixed(2)}s
            </div>
            <div className="flex-grow flex items-center gap-4 min-h-0 py-2">
                <button onClick={onAddScene} title="Add New Scene" className="flex-shrink-0 flex flex-col items-center justify-center h-24 w-24 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 hover:text-slate-800 transition-colors shadow-sm border border-slate-300">
                    <PlusIcon className="w-10 h-10" />
                    <span className="text-xs font-semibold mt-1">New Scene</span>
                </button>
                <div 
                    ref={timelineContainerRef} 
                    className="relative flex-grow flex items-center overflow-x-auto h-full bg-slate-200/50 rounded-lg shadow-inner"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                >
                    <div 
                        ref={timelineRef}
                        className="relative h-full cursor-pointer"
                        style={{ width: `${(totalDuration + 5) * PIXELS_PER_SECOND}px` }}
                        onMouseDown={handleMouseDown}
                    >
                        {/* Time markers */}
                        {timeMarkers.map(sec => (
                            <div key={sec} className="absolute top-0 h-full" style={{ left: `${sec * PIXELS_PER_SECOND}px`}}>
                                <div className={`w-px h-full ${sec % 5 === 0 ? 'bg-slate-400' : 'bg-slate-300'}`}></div>
                                {sec % 5 === 0 && <span className="absolute -top-4 text-xs text-slate-500 -translate-x-1/2">{sec}s</span>}
                            </div>
                        ))}
                        
                        {/* Scenes */}
                        {scenes.map(scene => {
                            const backgroundAsset = project.assets.find(a => a.id === scene.backgroundAssetId);
                            const sceneStart = cumulativeTime;
                            cumulativeTime += scene.duration;
                            return (
                                <div
                                    key={scene.id}
                                    onClick={(e) => { e.stopPropagation(); onSelectScene(scene.id); }}
                                    className={`absolute top-1/2 -translate-y-1/2 h-24 rounded-lg border-2 shadow-lg transition-all bg-slate-300 overflow-hidden group z-10 ${selectedSceneId === scene.id ? 'border-blue-500 scale-105 shadow-xl ring-4 ring-blue-500/30' : 'border-slate-300 hover:border-blue-400'}`}
                                    style={{ left: `${sceneStart * PIXELS_PER_SECOND}px`, width: `${scene.duration * PIXELS_PER_SECOND}px` }}
                                >
                                    {backgroundAsset && <img src={backgroundAsset.url} alt={`Scene ${scene.number}`} className="w-full h-full object-cover"/>}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <div className="absolute top-1 left-1.5 bg-black/70 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-lg">{scene.number}</div>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteScene(scene.id); }} className="absolute top-1 right-1.5 p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-3 h-3" /></button>
                                </div>
                            )
                        })}

                        {/* Playhead */}
                        <div 
                            className="absolute top-0 h-full w-0.5 bg-red-500 z-20 pointer-events-none"
                            style={{ left: `${currentTime * PIXELS_PER_SECOND}px`}}
                        >
                           <div className="absolute -top-1.5 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full ring-4 ring-white/50"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SceneTimeline;