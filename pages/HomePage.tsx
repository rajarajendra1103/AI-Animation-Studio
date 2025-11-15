import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectsContext';
import { useToast } from '../context/ToastContext';
import NewProjectModal from '../components/NewProjectModal';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { addProject } = useProjects();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreateProject = (details: { name: string; description: string }) => {
        const newProject = addProject(details);
        setIsModalOpen(false);
        navigate(`/studio/${newProject.id}`);
        addToast(`Project "${newProject.name}" created successfully!`, 'success');
    };
    
    const handleBrowseTemplates = () => {
        navigate('/templates');
    };

    return (
        <>
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white">
                <div className="max-w-3xl">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
                        Bring Your Ideas to Life with AI
                    </h1>
                    <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                        Create stunning animations in minutes. No experience required.
                        Let our AI co-pilot your creative journey from start to finish.
                    </p>
                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={handleBrowseTemplates}
                            className="w-full sm:w-auto px-8 py-3 bg-white text-gray-800 border border-gray-300 font-semibold rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105"
                        >
                            Browse Templates
                        </button>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all transform hover:scale-105"
                        >
                            Start with a Blank Project
                        </button>
                    </div>
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

export default HomePage;