import React from 'react';
import { Asset } from '../types';

interface AssetDetailModalProps {
    asset: Asset;
    onClose: () => void;
    onAddToTimeline: (asset: Asset) => void;
}

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="border-b border-slate-200 pb-2 mb-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className="text-sm text-slate-800 pt-1">{children}</div>
    </div>
);

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="bg-slate-200 text-slate-700 text-xs font-medium px-2 py-1 rounded-full">{children}</span>
);

const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ asset, onClose, onAddToTimeline }) => {
    
    const handleAddToTimeline = () => {
        onAddToTimeline(asset);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-lg w-full max-w-3xl h-full max-h-[90vh] shadow-xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-shrink-0 p-4 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900 truncate pr-4">{asset.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-2xl leading-none hover:bg-slate-200 text-slate-500">&times;</button>
                </div>

                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* Left: Image */}
                    <div className="w-full md:w-1/2 p-4 bg-slate-100 flex items-center justify-center border-r border-slate-200">
                        <img src={asset.url} alt={asset.name} className="max-w-full max-h-full object-contain rounded-md" />
                    </div>

                    {/* Right: Metadata */}
                    <div className="w-full md:w-1/2 p-4 overflow-y-auto">
                        <div className="space-y-4">
                            {asset.aiMetadata && (
                                <>
                                    <DetailRow label="Description">
                                        <p>{asset.aiMetadata.description}</p>
                                    </DetailRow>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        <DetailRow label="Art Style">{asset.aiMetadata.artStyle}</DetailRow>
                                        <DetailRow label="Artistic Tone">{asset.aiMetadata.artisticTone}</DetailRow>
                                        <DetailRow label="Mood">{asset.aiMetadata.mood}</DetailRow>
                                        <DetailRow label="Scene Context">{asset.aiMetadata.sceneContext}</DetailRow>
                                    </div>
                                    
                                     <DetailRow label="AI Tags">
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {asset.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                                        </div>
                                    </DetailRow>

                                    <DetailRow label="Detected Objects">
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {asset.aiMetadata.detectedObjects.map(obj => <Tag key={obj}>{obj}</Tag>)}
                                        </div>
                                    </DetailRow>
                                    
                                     <DetailRow label="Dominant Colors">
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {asset.aiMetadata.dominantColors.map(color => (
                                                 <div key={color} className="flex items-center gap-1.5">
                                                    <div className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: color }}></div>
                                                    <span className="text-xs">{color}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </DetailRow>
                                    
                                    <DetailRow label="Lighting">{asset.aiMetadata.lighting}</DetailRow>
                                    <DetailRow label="Composition">{asset.aiMetadata.composition}</DetailRow>

                                    <DetailRow label="Suggested Usage">
                                        <p className="text-xs italic text-slate-600">{asset.aiMetadata.suggestedUsage}</p>
                                    </DetailRow>
                                </>
                            )}
                            {!asset.aiMetadata && (
                                <p className="text-slate-500">No AI metadata available for this asset.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 p-4 border-t border-slate-200 flex justify-end bg-slate-50 rounded-b-lg">
                     <button
                        onClick={handleAddToTimeline}
                        className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        Add to Scene
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssetDetailModal;