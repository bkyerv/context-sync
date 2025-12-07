import React from 'react';
import { Project } from '../types';
import { STATUS_COLORS } from '../constants';

interface DashboardProps {
  projects: Project[];
  onSelect: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, onSelect }) => {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
           <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
           </svg>
        </div>
        <h2 className="text-3xl font-bold text-white">No active projects</h2>
        <p className="text-zinc-400 max-w-md">Horizon is waiting for your next big idea. Click the "New Project" button to start brainstorming with the AI.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div 
          key={project.id}
          onClick={() => onSelect(project.id)}
          className="group relative bg-surface border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 transition-all cursor-pointer hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
        >
          {/* Image Header */}
          <div className="h-40 w-full bg-zinc-800 overflow-hidden relative">
            {project.imageUrl ? (
              <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900" />
            )}
            <div className="absolute top-3 right-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border backdrop-blur-md ${STATUS_COLORS[project.status]}`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary transition-colors truncate">{project.title}</h3>
            <p className="text-zinc-400 text-sm line-clamp-2 mb-4 h-10">{project.description}</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-zinc-700 h-1.5 rounded-full mb-4 overflow-hidden">
               <div 
                 className="bg-primary h-full rounded-full transition-all duration-500" 
                 style={{ width: `${(project.tasks.filter(t => t.isCompleted).length / project.tasks.length) * 100 || 0}%` }} 
               />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {project.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs text-zinc-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;