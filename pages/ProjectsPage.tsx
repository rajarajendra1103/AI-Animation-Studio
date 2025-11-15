import React, { useState } from 'react';
import { useProjects } from '../context/ProjectsContext';
import { useToast } from '../context/ToastContext';
import ProjectCard from '../components/ProjectCard';
import { PlusIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';
import NewProjectModal from '../components/NewProjectModal';

const ProjectsPage: React.FC = () => {
    const { projects, deleteProject, addProject } = useProjects();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreateProject = (details: { name: string; description: string }) => {
        const newProject = addProject(details);
        setIsModalOpen(false);
        navigate(`/studio/${newProject.id}`);
        addToast(`Project "${newProject.name}" created successfully!`, 'success');
    };

    const handleDeleteProject = (id: string, name: string) => {
        deleteProject(id);
        addToast(`Project "${name}" has been deleted.`, 'info');
    };

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
                        >
                            <PlusIcon className="w-5 h-5" />
                            New Project
                        </button>
                    </div>

                    {projects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {projects.map(project => (
                                <ProjectCard 
                                    key={project.id} 
                                    project={project} 
                                    onDelete={() => handleDeleteProject(project.id, project.name)} 
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white border border-dashed border-gray-300 rounded-lg">
                            <h2 className="text-2xl font-semibold text-gray-800">No Projects Yet</h2>
                            <p className="mt-2 text-gray-500">Click 'New Project' to start creating your first animation!</p>
                        </div>
                    )}
                </div>
            </div>
            <NewProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateProject}
            />
        </>
    );
};

export default ProjectsPage;
