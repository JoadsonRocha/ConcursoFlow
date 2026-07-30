import { useState } from 'react';
import { Maximize, Minimize, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'dompurify';

interface SVGMapViewerProps {
  svgData: string[];
}

export default function SVGMapViewer({ svgData = [] }: SVGMapViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <div className="flex flex-col gap-8 p-8 items-center w-full h-full overflow-y-auto bg-slate-100 relative">
        <button 
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-10 p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all text-slate-500"
          title="Ver em Tela Cheia"
        >
          <Maximize className="w-5 h-5" />
        </button>
        {svgData.map((svg, index) => (
          <div key={index} className="flex flex-col items-center gap-2 w-full max-w-3xl">
            <div className="bg-white rounded-none shadow-xl w-full shrink-0 aspect-[1/1.414] flex items-center justify-center transform transition-all duration-300">
              <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } }) }} />
            </div>
            <span className="text-[9px] font-bold text-slate-400 opacity-40 uppercase tracking-[0.2em] italic">Stratis Planner • IA Generativa</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <span className="text-white text-xs font-bold uppercase tracking-widest opacity-60">Visualização em Tela Cheia</span>
              <button 
                onClick={toggleFullscreen}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white border border-white/10"
              >
                <Minimize className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-12 flex flex-col items-center gap-12 bg-slate-950">
              {svgData.map((svg, index) => (
                <div key={index} className="flex flex-col items-center gap-4 w-full max-w-5xl">
                  <div className="bg-white w-full shrink-0 aspect-[1/1.414] flex items-center justify-center shadow-2xl">
                    <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } }) }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 opacity-60 uppercase tracking-[0.2em] italic">Stratis Planner • IA Generativa</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
