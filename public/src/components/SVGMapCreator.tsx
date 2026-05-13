import { useState } from 'react';
import { X, Save, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { generateSVGMap } from '../services/gemini';
import { toast } from 'sonner';

export default function SVGMapCreator({ onClose, saveMap }: { onClose: () => void, saveMap: (svgData: string[], title: string) => void }) {
  const [title, setTitle] = useState('');
  const [svgs, setSvgs] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [quantity, setQuantity] = useState<number>(3);
  const [loading, setLoading] = useState(false);

  const addSvg = () => {
    if (svgs.length < 5) {
      // For now, add a placeholder SVG
      const newSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="indigo" /></svg>`;
      setSvgs([...svgs, newSvg]);
    }
  };

  const generateWithAI = async () => {
    if (!prompt || loading) return;
    setLoading(true);
    try {
      const newSvgs = await generateSVGMap(prompt, quantity || 1);
      setSvgs(newSvgs);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar via IA. Tente um tema mais específico.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-4">
      <div className="bg-white w-full max-w-5xl h-[95vh] sm:h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in duration-300">
        <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-b border-border">
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do Mapa Mental"
            className="text-lg sm:text-2xl font-display font-bold text-text-main italic border-none focus:outline-none flex-1 min-w-0 bg-transparent placeholder:text-slate-300"
          />
          <div className="flex gap-2 items-center shrink-0">
            <button 
              onClick={() => saveMap(svgs, title)} 
              disabled={svgs.length === 0}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-primary text-white rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest disabled:opacity-50 shadow-md shadow-primary/20 hover:brightness-110 transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Salvar</span>
            </button>
            <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"><X className="w-5 h-5 sm:w-6 sm:h-6" /></button>
          </div>
        </div>
        <div className="p-4 sm:p-6 border-b border-border bg-slate-50 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Exemplo: Fisiologia do Coração, Teoria Geral do Direito..."
                className="flex-1 p-3 bg-white border border-border shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder:text-slate-400"
              />
              <div className="flex gap-3">
                <div className="flex items-center justify-between sm:justify-start gap-2 bg-white border border-border shadow-sm rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 shrink-0">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Mapas</span>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="p-1.5 bg-transparent text-center text-sm font-bold text-slate-700 outline-none cursor-pointer appearance-none"
                    style={{ textAlignLast: 'center' }}
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={generateWithAI} 
                  disabled={loading} 
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 sm:py-2.5 bg-indigo-600 text-white shadow-md shadow-indigo-600/20 rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {loading ? "Gerando..." : "Gerar"}
                </button>
              </div>
            </div>
        </div>
        <div className="p-4 sm:p-6 flex-1 flex flex-wrap justify-center gap-4 sm:gap-6 overflow-y-auto bg-slate-100">
          {svgs.map((svg, index) => (
            <div key={index} className="w-[45%] sm:w-48 aspect-[1/1.414] bg-white shadow-sm sm:shadow-md rounded-none overflow-hidden flex items-center justify-center shrink-0">
              <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: svg }} />
            </div>
          ))}
          {svgs.length < 5 && (
            <button onClick={addSvg} className="w-[45%] sm:w-48 aspect-[1/1.414] border-2 border-dashed border-slate-300 rounded-none flex items-center justify-center hover:bg-slate-50 shrink-0">
              <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
