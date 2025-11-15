import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types';
import { EditIcon, TrashIcon } from './icons';

interface ProjectCardProps {
    project: Project;
    onDelete: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
    const navigate = useNavigate();

    const handleEdit = () => {
        navigate(`/studio/${project.id}`);
    };
    
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
            onDelete();
        }
    };

    return (
        <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer" onClick={handleEdit}>
            <img src={project.thumbnailUrl} alt={project.name} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent transition-all duration-300"></div>
            
            <div className="absolute bottom-0 left-0 p-4 w-full">
                <h3 className="text-lg font-semibold text-white truncate">{project.name}</h3>
                <p className="text-sm text-slate-300">
                    Last modified: {new Date(project.lastModified).toLocaleDateString()}
                </p>
            </div>

            <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={handleEdit}
                    className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                    aria-label="Edit project"
                >
                    <EditIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={handleDelete}
                    className="p-2.5 bg-red-600/80 backdrop-blur-sm rounded-full text-white hover:bg-red-600/100 transition-colors"
                    aria-label="Delete project"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ProjectCard;
