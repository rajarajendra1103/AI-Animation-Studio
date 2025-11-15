
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ProjectsProvider } from './context/ProjectsContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/Toast';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import StudioPage from './pages/StudioPage';
import TemplatesPage from './pages/TemplatesPage';

function App() {
  return (
    <ProjectsProvider>
      <ToastProvider>
        <HashRouter>
          <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-grow overflow-auto">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/studio/:projectId" element={<StudioPage />} />
              </Routes>
            </main>
            <ToastContainer />
          </div>
        </HashRouter>
      </ToastProvider>
    </ProjectsProvider>
  );
}

export default App;