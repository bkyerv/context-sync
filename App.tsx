import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, ViewState, Task } from './types';
import { generateProjectPlan, generateProjectImage } from './services/geminiService';
import { PlusIcon, LayoutIcon, SparklesIcon, ArrowLeftIcon } from './components/Icons';
import { Loader } from './components/Loader';
import { STATUS_COLORS } from './constants';
import Dashboard from './views/Dashboard';
import ProjectView from './views/ProjectView';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.DASHBOARD);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  
  // New Project Input State
  const [ideaInput, setIdeaInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleCreateProject = async () => {
    if (!ideaInput.trim()) return;
    setIsModalOpen(false);
    setIsGenerating(true);
    setGenerationStep("Analyzing concept & Planning structure...");

    try {
      // 1. Generate Plan
      const plan = await generateProjectPlan(ideaInput);
      setGenerationStep("Visualizing identity...");
      
      // 2. Generate Image
      const imageUrl = await generateProjectImage(plan.description);

      const newProject: Project = {
        id: Date.now().toString(),
        title: plan.title,
        description: plan.description,
        tags: plan.tags,
        status: ProjectStatus.PLANNING,
        createdAt: new Date(),
        tasks: plan.tasks.map((t, i) => ({ ...t, id: `task-${i}`, isCompleted: false })),
        imageUrl: imageUrl,
        notes: `Initial idea: ${ideaInput}`
      };

      setProjects(prev => [newProject, ...prev]);
      setActiveProjectId(newProject.id);
      setViewState(ViewState.PROJECT_DETAIL);
    } catch (error) {
      console.error(error);
      alert("Failed to generate project. Check API Key.");
    } finally {
      setIsGenerating(false);
      setIdeaInput("");
    }
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  return (
    <div className="min-h-screen bg-background text-zinc-100 font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <LayoutIcon />
             </div>
             <h1 className="font-bold text-xl tracking-tight">Horizon</h1>
          </div>
          
          <div className="flex items-center gap-4">
             {!process.env.API_KEY && (
               <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded border border-red-400/20">
                 API Key Missing
               </span>
             )}
             <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors"
             >
                <PlusIcon /> New Project
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-4 max-w-7xl mx-auto pb-12">
        {isGenerating ? (
          <div className="h-[60vh] flex flex-col items-center justify-center">
             <Loader text={generationStep} />
          </div>
        ) : viewState === ViewState.DASHBOARD ? (
          <Dashboard 
            projects={projects} 
            onSelect={(id) => {
              setActiveProjectId(id);
              setViewState(ViewState.PROJECT_DETAIL);
            }} 
          />
        ) : activeProject ? (
          <ProjectView 
            project={activeProject} 
            onBack={() => setViewState(ViewState.DASHBOARD)}
            onUpdate={(updates) => updateProject(activeProject.id, updates)}
          />
        ) : null}
      </main>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">Ignite a New Idea</h2>
            <p className="text-zinc-400 mb-6">Describe your project loosely. Horizon will structure it.</p>
            
            <textarea
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              placeholder="e.g. I want to build a smart mirror with a raspberry pi that shows my calendar and weather..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[120px] resize-none"
            />

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateProject}
                disabled={!ideaInput.trim()}
                className="bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <SparklesIcon /> Generate Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
