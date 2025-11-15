import React, { useState } from 'react';
import { Project, SearchCriteria, SearchResult, Asset } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

interface SearchTabProps {
    project: Project;
}

const SearchTab: React.FC<SearchTabProps> = ({ project }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [interpretation, setInterpretation] = useState<SearchCriteria | null>(null);
    const [results, setResults] = useState<SearchResult[]>([]);

    const calculateScore = (asset: Asset, criteria: SearchCriteria): SearchResult | null => {
        let score = 0;
        const reasons: string[] = [];

        // Type match: 30 points
        if (criteria.assetTypes.length > 0) {
            if (criteria.assetTypes.includes(asset.type)) {
                score += 30;
                reasons.push(`Type: ${asset.type}`);
            }
        }

        const lowerCaseName = asset.name.toLowerCase();
        // Name match: 20 points per keyword
        criteria.descriptors.forEach(desc => {
            if (lowerCaseName.includes(desc.toLowerCase())) {
                score += 20;
                reasons.push(`Name match: "${desc}"`);
            }
        });

        if (asset.aiMetadata) {
            const { aiMetadata, tags } = asset;
            const lowerCaseDesc = aiMetadata.description.toLowerCase();

            // AI tag match (from keywords): 15 points per tag
            criteria.descriptors.forEach(desc => {
                if (aiMetadata.searchKeywords.some(kw => kw.toLowerCase().includes(desc.toLowerCase()))) {
                    score += 15;
                    reasons.push(`AI Tag: "${desc}"`);
                }
            });

            // Scene context: 25 points
            if (criteria.context && aiMetadata.sceneContext.toLowerCase().includes(criteria.context.toLowerCase())) {
                score += 25;
                reasons.push(`Context: ${criteria.context}`);
            }

            // Mood match: 15 points
            if (criteria.mood && aiMetadata.mood.toLowerCase().includes(criteria.mood.toLowerCase())) {
                score += 15;
                reasons.push(`Mood: ${criteria.mood}`);
            }

            // Object detection: 12 points per object
            criteria.descriptors.forEach(desc => {
                if (aiMetadata.detectedObjects.some(obj => obj.toLowerCase().includes(desc.toLowerCase()))) {
                    score += 12;
                    reasons.push(`Object: "${desc}"`);
                }
            });
            
            // Color match: 8 points per color
            criteria.colors.forEach(color => {
                if(aiMetadata.dominantColors.some(c => c.toLowerCase().includes(color.toLowerCase())) || lowerCaseDesc.includes(color.toLowerCase())) {
                    score += 8;
                    reasons.push(`Color: ${color}`);
                }
            });

            // User tag match: 10 points per tag
            criteria.descriptors.forEach(desc => {
                if(tags.some(t => t.toLowerCase().includes(desc.toLowerCase()))) {
                    score += 10;
                    reasons.push(`User Tag: "${desc}"`);
                }
            });
        }
        
        if (score > 0) {
            return { asset, score, reasons: [...new Set(reasons)] }; // Return unique reasons
        }

        return null;
    }

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setInterpretation(null);
        setResults([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Analyze this search query and extract criteria. Return a JSON object with keys: assetTypes (array of: 'character', 'background', 'prop', 'audio', 'music', 'effect', 'video'), descriptors (array of nouns/adjectives), actions (array of verbs), context (e.g., 'forest'), mood (e.g., 'dramatic'), colors (array of colors). Query: "${query}"`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            assetTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
                            descriptors: { type: Type.ARRAY, items: { type: Type.STRING } },
                            actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                            context: { type: Type.STRING },
                            mood: { type: Type.STRING },
                            colors: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            });

            const criteria: SearchCriteria = JSON.parse(response.text);
            setInterpretation(criteria);

            const scoredResults = project.assets
                .map(asset => calculateScore(asset, criteria))
                .filter((result): result is SearchResult => result !== null);
            
            scoredResults.sort((a, b) => b.score - a.score);

            setResults(scoredResults.slice(0, 20));

        } catch (e: unknown) {
            console.error(e);
            let msg = 'Failed to perform AI search.';
            if (e instanceof Error) msg = e.message;
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };
    
    const exampleQueries = ["hero character walking in forest", "dramatic background for medieval setting", "red sword prop"];

    return (
        <div className="p-4 flex flex-col h-full text-gray-800">
            <h3 className="text-lg font-bold mb-2 border-b pb-2">AI Natural Language Search</h3>
            <p className="text-sm text-gray-600 mb-4">Use everyday language to find assets in your library.</p>
            
            <div className="mb-2">
                <textarea 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch(); }}}
                    placeholder="e.g., hero character walking in forest"
                    className="w-full h-20 bg-gray-50 p-2 rounded-md text-sm border border-gray-300 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    disabled={isLoading}
                />
                <div className="text-xs text-gray-500 mt-1 flex gap-2">
                    Examples: {exampleQueries.map(q => <button key={q} onClick={() => setQuery(q)} className="underline hover:text-blue-600">{`"${q}"`}</button>)}
                </div>
            </div>
            <button
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                className="w-full mt-2 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-500 disabled:bg-gray-400"
            >
                {isLoading ? 'Searching...' : 'Search with AI'}
            </button>
            {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
            
            {interpretation && (
                 <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded-md text-xs">
                     <p className="font-semibold">AI Interpretation:</p>
                     <p className="text-gray-700">
                        {interpretation.assetTypes.length > 0 && `Types: ${interpretation.assetTypes.join(', ')}. `}
                        {interpretation.descriptors.length > 0 && `Descriptors: ${interpretation.descriptors.join(', ')}. `}
                        {interpretation.context && `Context: ${interpretation.context}. `}
                        {interpretation.mood && `Mood: ${interpretation.mood}. `}
                     </p>
                </div>
            )}
            
            <div className="mt-4 flex-grow overflow-y-auto pr-2 -mr-2">
                {results.length > 0 && <p className="text-sm font-semibold mb-2">Top {results.length} Results</p>}
                <div className="space-y-3">
                    {results.map(({asset, score, reasons}) => (
                        <div key={asset.id} className="flex gap-3 p-2 bg-white border rounded-md">
                            <img src={asset.url} alt={asset.name} className="w-20 h-20 object-cover rounded bg-gray-100 flex-shrink-0" />
                            <div className="overflow-hidden">
                                <h4 className="font-bold truncate">{asset.name}</h4>
                                <p className="text-sm text-blue-600 font-semibold">Match Score: {score}%</p>
                                <div className="text-xs text-gray-600 mt-1">
                                    <p className="font-semibold">Match Reasons:</p>
                                    <ul className="list-disc list-inside">
                                        {reasons.slice(0, 3).map((r, i) => <li key={i} className="truncate">{r}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!isLoading && results.length === 0 && interpretation && (
                        <p className="text-center text-gray-500 py-4">No matching assets found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchTab;