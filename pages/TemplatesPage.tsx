import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectsContext';
import { useToast } from '../context/ToastContext';
import { ProjectTemplate } from '../types';
import { templates } from '../data/templates';
import TemplateCard from '../components/TemplateCard';
import NewProjectModal from '../components/NewProjectModal';

const TemplatesPage: React.FC = () => {
    const { addProject } = useProjects();
    const { addToast } = useToast();
    const navigate = useNavigate();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);

    const handleUseTemplate = (template: ProjectTemplate) => {
        setSelectedTemplate(template);
        setIsModalOpen(true);
    };

    const handleCreateProject = (details: { name: string; description: string }) => {
        if (!selectedTemplate) return;

        const newProject = addProject(details, selectedTemplate.projectData);
        setIsModalOpen(false);
        navigate(`/studio/${newProject.id}`);
        addToast(`Project created from "${selectedTemplate.name}" template!`, 'success');
    };

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold text-gray-900">Project Templates</h1>
                        <p className="mt-4 text-lg text-gray-600">
                            Jumpstart your creativity with one of our pre-built project starters.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
                        {templates.map(template => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                onUse={handleUseTemplate}
                            />
                        ))}
                    </div>
                </div>
            </div>
            {selectedTemplate && (
                <NewProjectModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onCreate={handleCreateProject}
                    initialName={`${selectedTemplate.name} Copy`}
                    initialDescription={selectedTemplate.description}
                />
            )}
        </>
    );
};

export default TemplatesPage;
