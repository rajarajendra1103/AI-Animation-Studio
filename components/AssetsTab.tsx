import React, { useState, useMemo } from 'react';
import { Project, Asset, AssetType } from '../types';
import { PlusIcon } from './icons';
import AssetDetailModal from './AssetDetailModal';

interface AssetsTabProps {
    project: Project;
    onProjectUpdate: (updates: Partial<Project>) => void;
    onAssetAddToTimeline: (asset: Asset) => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    isUploading: boolean;
}

const assetTypes: AssetType[] = ['character', 'background', 'prop', 'video', 'audio', 'music', 'effect'];
const artStyles = ['any', 'cartoon', 'realistic', 'pixel art', 'anime'];

const AssetsTab: React.FC<AssetsTabProps> = ({ project, onProjectUpdate, onAssetAddToTimeline, onFileUpload, isUploading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all');
    const [styleFilter, setStyleFilter] = useState('any');
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    const filteredAssets = useMemo(() => {
        return project.assets.filter(asset => {
            const lowerSearch = searchTerm.toLowerCase();
            const { name, tags, aiMetadata } = asset;

            const matchesSearch = searchTerm === '' ||
                name.toLowerCase().includes(lowerSearch) ||
                tags.some(tag => tag.toLowerCase().includes(lowerSearch)) ||
                (aiMetadata && (
                    aiMetadata.description.toLowerCase().includes(lowerSearch) ||
                    aiMetadata.detectedObjects.some(obj => obj.toLowerCase().includes(lowerSearch)) ||
                    aiMetadata.searchKeywords.some(kw => kw.toLowerCase().includes(lowerSearch)) ||
                    aiMetadata.artStyle.toLowerCase().includes(lowerSearch) ||
                    aiMetadata.sceneContext.toLowerCase().includes(lowerSearch)
                ));

            const matchesType = typeFilter === 'all' || asset.type === typeFilter;
            const matchesStyle = styleFilter === 'any' || (asset.aiMetadata?.artStyle || '').toLowerCase().includes(styleFilter.toLowerCase());
            return matchesSearch && matchesType && matchesStyle;
        });
    }, [project.assets, searchTerm, typeFilter, styleFilter]);

    return (
        <>
            <div className="p-4 flex flex-col h-full text-gray-800">
                <h3 className="text-lg font-bold mb-4">Asset Library</h3>

                {/* Upload */}
                <div className="mb-4">
                     <label htmlFor="asset-upload" className="relative cursor-pointer w-full flex justify-center items-center gap-2 px-6 py-4 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-500 transition-colors">
                         {isUploading ? (
                             <span className="text-sm font-medium text-gray-500">Analyzing with AI...</span>
                         ) : (
                             <>
                                <PlusIcon className="w-5 h-5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-600">Upload & Auto-Tag Asset</span>
                             </>
                         )}
                        <input id="asset-upload" name="asset-upload" type="file" className="sr-only" onChange={onFileUpload} disabled={isUploading} accept="image/*,video/*,audio/*"/>
                    </label>
                </div>

                {/* Search and Filter */}
                <div className="mb-4 space-y-3">
                    <input
                        type="text"
                        placeholder="Search all metadata..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <div className="flex gap-2">
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none">
                            <option value="all">All Types</option>
                            {assetTypes.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                        </select>
                         <select value={styleFilter} onChange={e => setStyleFilter(e.target.value)} className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none">
                            {artStyles.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Asset Grid */}
                <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                    {filteredAssets.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {filteredAssets.map(asset => (
                                <div key={asset.id} className="group relative bg-gray-200 rounded-md overflow-hidden aspect-square cursor-pointer" onClick={() => setSelectedAsset(asset)}>
                                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-xs font-bold truncate text-white">{asset.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-sm text-gray-500">No assets found.</p>
                        </div>
                    )}
                </div>
            </div>
            {selectedAsset && (
                <AssetDetailModal 
                    asset={selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                    onAddToTimeline={onAssetAddToTimeline}
                />
            )}
        </>
    );
};

export default AssetsTab;