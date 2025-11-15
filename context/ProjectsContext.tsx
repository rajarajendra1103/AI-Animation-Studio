
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Project } from '../types';

interface NewProjectDetails {
  name: string;
  description?: string;
}

interface ProjectsContextType {
  projects: Project[];
  addProject: (details: NewProjectDetails, templateData?: Partial<Omit<Project, 'id' | 'lastModified' | 'name' | 'description' | 'thumbnailUrl'>>) => Project;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  updateProject: (id: string, updatedProject: Partial<Project>) => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const ProjectsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const localData = localStorage.getItem('ai-animation-projects');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Error reading projects from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ai-animation-projects', JSON.stringify(projects));
    } catch (error) {
      console.error("Error saving projects to localStorage", error);
    }
  }, [projects]);

  const addProject = useCallback((details: NewProjectDetails, templateData: Partial<Omit<Project, 'id' | 'lastModified' | 'name' | 'description' | 'thumbnailUrl'>> = {}) => {
    const newProject: Project = {
      // Default structure that can be overridden
      data: { duration: 30, layers: [] },
      script: '',
      assets: [],
      styleProfiles: [],
      currentStyleReference: null,
      scenes: [],
      projectWideMusicAssetId: null,
      // Overwrite with template data
      ...templateData,
      // Explicitly set new project properties
      id: `proj_${new Date().getTime()}`,
      name: details.name.trim(),
      description: details.description?.trim() || '',
      thumbnailUrl: `https://picsum.photos/seed/${Math.random()}/400/300`,
      lastModified: new Date().toISOString(),
    };
    setProjects(prev => [...prev, newProject]);
    return newProject;
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);

  const updateProject = useCallback((id: string, updatedProjectData: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updatedProjectData, lastModified: new Date().toISOString() } : p));
  }, []);


  // FIX: Memoize the context value to prevent consumers from re-rendering unnecessarily.
  // This provides stable references for functions and likely fixes the errors in StudioPage.tsx.
  const value = useMemo(() => ({ projects, addProject, deleteProject, getProject, updateProject }), [projects, addProject, deleteProject, getProject, updateProject]);

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = (): ProjectsContextType => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};