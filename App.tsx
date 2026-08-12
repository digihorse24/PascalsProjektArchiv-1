
import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from './services/geminiService';
import { AppStatus, GeneratedImage, GeneratedVideo } from './types';
import { LoadingOverlay } from './components/LoadingOverlay';

// Fix: Define AIStudio interface to match environmental requirements and ensure identical modifiers for the global property
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [prompt, setPrompt] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<GeneratedImage | GeneratedVideo>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    } catch (e) {
      console.error("API Key check failed", e);
    }
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Guideline: Assume successful selection after triggering openSelectKey to avoid race conditions
      setHasApiKey(true);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setStatus(AppStatus.GENERATING_IMAGE);
    setError(null);
    try {
      const imgUrl = await GeminiService.generateImage(prompt);
      setCurrentImage(imgUrl);
      setHistory(prev => [{
        id: crypto.randomUUID(),
        url: imgUrl,
        prompt: prompt,
        timestamp: Date.now()
      } as GeneratedImage, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setStatus(AppStatus.IDLE);
    }
  };

  const handleGenerateVideo = async () => {
    const videoPrompt = prompt.trim() || "Cinematic movement based on the image";
    setStatus(AppStatus.GENERATING_VIDEO);
    setError(null);
    try {
      const videoUrl = await GeminiService.generateVideo(videoPrompt, currentImage || undefined);
      setCurrentVideo(videoUrl);
      setHistory(prev => [{
        id: crypto.randomUUID(),
        url: videoUrl,
        prompt: videoPrompt,
        thumbnailUrl: currentImage || '',
        timestamp: Date.now()
      } as GeneratedVideo, ...prev]);
    } catch (err: any) {
      // Guideline: If Requested entity was not found, reset key selection state
      if (err.message && err.message.includes("Requested entity was not found")) {
        setHasApiKey(false);
        setError("API Key needs re-selection. Please connect your paid API key again.");
      } else {
        setError(err.message || 'Failed to generate video');
      }
    } finally {
      setStatus(AppStatus.IDLE);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentImage(reader.result as string);
        setCurrentVideo(null);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="inline-block p-4 rounded-full bg-blue-500/10 mb-4">
            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">VisionFlow Studio</h1>
          <p className="text-gray-400">
            To unlock the power of Veo 3.1 and Gemini, please select a valid API key from your Google AI Studio project.
          </p>
          <button
            onClick={handleOpenKeySelector}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            Connect API Key
          </button>
          <p className="text-xs text-gray-500">
            Requires a paid billing project. See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-blue-400">billing docs</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg shadow-lg"></div>
          <span className="text-xl font-bold tracking-tight text-white">VisionFlow</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setCurrentImage(null); setCurrentVideo(null); setPrompt(''); }}
            className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            Reset
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Controls */}
          <section className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white leading-tight">Create your next<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">masterpiece</span></h2>
              <p className="text-gray-400">Transform ideas into visuals, and visuals into cinematic motion in seconds.</p>
            </div>

            <div className="gradient-border">
              <div className="inner-card p-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A cyberpunk city street at neon night, reflected in puddles after rain..."
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-600 resize-none h-32"
                />
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-medium uppercase tracking-wider">Upload Image</span>
                  </button>
                  <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileUpload} />
                  
                  <div className="flex gap-2">
                    <button
                      disabled={!prompt || status !== AppStatus.IDLE}
                      onClick={handleGenerateImage}
                      className="px-6 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                      Draw Image
                    </button>
                    <button
                      disabled={!currentImage || status !== AppStatus.IDLE}
                      onClick={handleGenerateVideo}
                      className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                      Animate
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
          </section>

          {/* Preview */}
          <section className="space-y-6">
            <div className="relative aspect-video lg:aspect-square bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
              {!currentImage && !currentVideo ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                  <div className="w-16 h-16 border-2 border-dashed border-gray-700 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <p className="text-sm">Preview window</p>
                </div>
              ) : currentVideo ? (
                <video 
                  src={currentVideo} 
                  autoPlay 
                  loop 
                  controls 
                  className="w-full h-full object-contain"
                />
              ) : (
                <img 
                  src={currentImage!} 
                  alt="Generated" 
                  className="w-full h-full object-cover"
                />
              )}

              {currentVideo && (
                <div className="absolute top-4 left-4">
                   <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">AI Video</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              {currentImage && (
                <a 
                  href={currentImage} 
                  download="visionflow-image.png"
                  className="flex-1 py-3 bg-[#1a1a1a] text-white text-center rounded-xl hover:bg-[#252525] transition-colors border border-white/5 font-medium"
                >
                  Save Image
                </a>
              )}
              {currentVideo && (
                <a 
                  href={currentVideo} 
                  download="visionflow-video.mp4"
                  className="flex-1 py-3 bg-blue-600/20 text-blue-400 text-center rounded-xl hover:bg-blue-600/30 transition-colors border border-blue-500/20 font-medium"
                >
                  Save Video
                </a>
              )}
            </div>
          </section>
        </div>

        {/* History Gallery */}
        {history.length > 0 && (
          <section className="mt-24 space-y-8">
            <h3 className="text-xl font-semibold text-white">Recent Creations</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => {
                    if ('thumbnailUrl' in item) {
                      setCurrentVideo(item.url);
                      setCurrentImage(item.thumbnailUrl);
                    } else {
                      setCurrentImage(item.url);
                      setCurrentVideo(null);
                    }
                  }}
                  className="group relative aspect-square bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer ring-1 ring-white/5 hover:ring-blue-500/50 transition-all shadow-lg"
                >
                  <img 
                    src={'thumbnailUrl' in item ? item.thumbnailUrl : item.url} 
                    alt={item.prompt} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  {'thumbnailUrl' in item && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[10px] text-gray-300 truncate font-medium">{item.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Loading States */}
      {status === AppStatus.GENERATING_IMAGE && (
        <LoadingOverlay 
          message="Visualizing your prompt..." 
          subMessage="Our image engine is crafting your vision pixel by pixel." 
        />
      )}
      {status === AppStatus.GENERATING_VIDEO && (
        <LoadingOverlay 
          message="Animating with Veo 3.1..." 
          subMessage="This usually takes 1-2 minutes. We're rendering complex motion vectors and cinematic transitions." 
        />
      )}

      {/* Footer Branding */}
      <footer className="py-12 border-t border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded"></div>
            <span className="text-sm font-bold text-gray-400">VISIONFLOW STUDIO</span>
          </div>
          <p className="text-gray-600 text-xs">
            Powered by Google Gemini 2.5 & Veo 3.1 &bull; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
