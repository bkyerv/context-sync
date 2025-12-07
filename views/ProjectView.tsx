import React, { useState, useRef, useEffect } from 'react';
import { Project, Task, Message } from '../types';
import { chatStream, researchTopic } from '../services/geminiService';
import { ArrowLeftIcon, ChatIcon, CheckCircleIcon, GlobeIcon, SparklesIcon } from '../components/Icons';
import { GenerateContentResponse } from '@google/genai';

interface ProjectViewProps {
  project: Project;
  onBack: () => void;
  onUpdate: (updates: Partial<Project>) => void;
}

const ProjectView: React.FC<ProjectViewProps> = ({ project, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'board' | 'chat' | 'research'>('board');
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: `Welcome to the workspace for **${project.title}**. I've laid out an initial plan. Would you like to refine the tasks or start researching resources?`, timestamp: new Date() }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Research State
  const [researchQuery, setResearchQuery] = useState('');
  const [researchResults, setResearchResults] = useState<{text: string, links: any[]} | null>(null);
  const [isResearching, setIsResearching] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleTask = (taskId: string) => {
    const updatedTasks = project.tasks.map(t => 
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );
    onUpdate({ tasks: updatedTasks });
  };

  const handleSendMessage = async () => {
    if (!inputMsg.trim() || isTyping) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputMsg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMsg('');
    setIsTyping(true);

    // Context preparation
    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));
    
    try {
      const stream = await chatStream(history, userMsg.text);
      
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '', timestamp: new Date(), isStreaming: true }]);

      let fullText = "";
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullText += c.text;
          setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: fullText } : m));
        }
      }
      setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, isStreaming: false } : m));
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: 'Error connecting to AI agent.', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResearch = async () => {
     if(!researchQuery.trim()) return;
     setIsResearching(true);
     try {
       const res = await researchTopic(researchQuery);
       setResearchResults(res);
     } catch(e) {
       console.error(e);
     } finally {
       setIsResearching(false);
     }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      
      {/* Sidebar / Navigation for Project */}
      <div className="w-full lg:w-1/4 flex flex-col gap-4">
        <button onClick={onBack} className="flex items-center text-zinc-400 hover:text-white mb-2 transition-colors">
          <ArrowLeftIcon /> <span className="ml-2">Back to Dashboard</span>
        </button>
        
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
           <div className="w-full h-32 rounded-lg bg-zinc-700 mb-4 overflow-hidden">
             {project.imageUrl && <img src={project.imageUrl} alt="Project" className="w-full h-full object-cover" />}
           </div>
           <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
           <p className="text-sm text-zinc-400 mb-4">{project.description}</p>
           
           <div className="flex flex-col gap-2 mt-6">
              <button 
                onClick={() => setActiveTab('board')}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'board' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
              >
                <div className={`p-1.5 rounded-lg ${activeTab === 'board' ? 'bg-white/20' : 'bg-zinc-700'}`}><CheckCircleIcon completed={activeTab === 'board'} /></div>
                <div className="text-left">
                  <div className="font-semibold text-sm">Action Plan</div>
                  <div className="text-xs opacity-70">{project.tasks.filter(t => t.isCompleted).length}/{project.tasks.length} tasks</div>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
              >
                 <div className={`p-1.5 rounded-lg ${activeTab === 'chat' ? 'bg-white/20' : 'bg-zinc-700'}`}><ChatIcon /></div>
                 <div className="text-left">
                  <div className="font-semibold text-sm">Co-Founder Chat</div>
                  <div className="text-xs opacity-70">Brainstorm & Refine</div>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('research')}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'research' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
              >
                 <div className={`p-1.5 rounded-lg ${activeTab === 'research' ? 'bg-white/20' : 'bg-zinc-700'}`}><GlobeIcon /></div>
                 <div className="text-left">
                  <div className="font-semibold text-sm">Lab & Research</div>
                  <div className="text-xs opacity-70">Find tools & docs</div>
                </div>
              </button>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-surface border border-white/5 rounded-2xl overflow-hidden flex flex-col relative">
        
        {/* TAB: BOARD */}
        {activeTab === 'board' && (
          <div className="flex-1 overflow-y-auto p-6">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold flex items-center gap-2"><SparklesIcon /> AI Generated Roadmap</h2>
               <span className="text-xs text-zinc-500 bg-black/10 px-2 py-1 rounded border border-white/5">Auto-generated via Gemini 3.0 Reasoning</span>
             </div>
             
             <div className="space-y-3">
               {project.tasks.map((task) => (
                 <div key={task.id} className="group flex items-start gap-4 p-4 rounded-xl bg-black/10 hover:bg-black/20 border border-transparent hover:border-white/5 transition-all">
                    <button onClick={() => toggleTask(task.id)} className="mt-1 transition-transform active:scale-90">
                      <CheckCircleIcon completed={task.isCompleted} />
                    </button>
                    <div className="flex-1">
                      <h3 className={`font-medium ${task.isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{task.title}</h3>
                      <p className={`text-sm mt-1 ${task.isCompleted ? 'text-zinc-600' : 'text-zinc-400'}`}>{task.description}</p>
                      <div className="flex gap-2 mt-3">
                         <span className="text-[10px] uppercase font-bold text-zinc-500 bg-white/5 px-2 py-0.5 rounded">{task.category}</span>
                         {task.estimatedTime && <span className="text-[10px] text-zinc-500 px-2 py-0.5">⏱ {task.estimatedTime}</span>}
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* TAB: CHAT */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-secondary text-white rounded-br-none' : 'bg-white/10 text-zinc-200 rounded-bl-none'}`}>
                     <div className="prose prose-invert text-sm">
                       {msg.text.split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)}
                     </div>
                     {msg.isStreaming && <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse mt-2"/>}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-black/10 border-t border-white/5">
              <div className="relative">
                <input 
                  type="text" 
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask for advice, code snippets, or ideas..."
                  className="w-full bg-surface border border-white/10 rounded-full pl-6 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-secondary/50 text-white placeholder-zinc-500"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isTyping}
                  className="absolute right-2 top-2 p-2 bg-secondary rounded-full text-white hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                >
                  <ArrowLeftIcon /> {/* Using Arrow as Send icon for simplicity */}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: RESEARCH */}
        {activeTab === 'research' && (
          <div className="flex flex-col h-full p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <GlobeIcon /> Resource Laboratory
            </h2>
            <div className="flex gap-2 mb-6">
              <input 
                type="text"
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                placeholder="Search for libraries, tools, or tutorials..." 
                className="flex-1 bg-black/10 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button 
                onClick={handleResearch}
                disabled={isResearching}
                className="bg-accent text-black font-semibold px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50"
              >
                {isResearching ? 'Scanning...' : 'Search'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-black/10 rounded-xl p-6 border border-white/5">
              {!researchResults ? (
                <div className="text-center text-zinc-500 mt-10">
                  <p>Powered by Gemini Google Search Grounding.</p>
                  <p className="text-xs mt-2">Find real-time documentation, GitHub repos, and component libraries.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="prose prose-invert max-w-none text-sm text-zinc-300">
                    {researchResults.text}
                  </div>
                  {researchResults.links && researchResults.links.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-white/10">
                       {researchResults.links.map((link, i) => (
                         <a 
                           key={i} 
                           href={link.uri} 
                           target="_blank" 
                           rel="noreferrer"
                           className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-white/5 hover:border-accent/50 hover:bg-white/5 transition-all group"
                         >
                           <div className="bg-accent/10 text-accent p-2 rounded group-hover:bg-accent group-hover:text-black transition-colors">
                             <GlobeIcon />
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="font-medium text-sm truncate">{link.title}</div>
                             <div className="text-xs text-zinc-500 truncate">{link.uri}</div>
                           </div>
                         </a>
                       ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProjectView;