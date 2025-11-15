import React from 'react';
import { ProjectTemplate } from '../types';
import { PlusCircleIcon } from './icons';

interface TemplateCardProps {
    template: ProjectTemplate;
    onUse: (template: ProjectTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUse }) => {
    return (
        <div 
            className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer" 
            onClick={() => onUse(template)}
        >
            <img src={template.thumbnailUrl} alt={template.name} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-all duration-300"></div>
            
            <div className="p-4">
                <h3 className="text-lg font-semibold text-slate-900 truncate">{template.name}</h3>
                <p className="text-sm text-slate-600 h-10 overflow-hidden">
                    {template.description}
                </p>
            </div>

            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-center text-white">
                    <PlusCircleIcon className="w-12 h-12 mx-auto" />
                    <p className="font-semibold mt-2">Use Template</p>
                </div>
            </div>
        </div>
    );
};

export default TemplateCard;
