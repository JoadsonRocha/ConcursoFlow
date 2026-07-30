import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { 
  Compass, 
  BookOpen, 
  PlayCircle, 
  Lightbulb, 
  Search, 
  ArrowRight, 
  X,
  Target,
  Zap,
  Clock,
  Layout,
  Users,
  Award,
  ArrowLeft,
  Share2,
  Bookmark,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Flame,
  CheckCircle2,
  BookOpenCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { contentData, type ContentItem } from '../constants/content';

const ImageWithFallback = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div className={cn("relative overflow-hidden bg-slate-100", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse bg-slate-200">
           <Layout className="w-8 h-8 text-slate-300" />
        </div>
      )}
      <img
        src={error ? 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=500&auto=format&fit=crop' : src}
        alt={alt}
        className={cn("w-full h-full object-cover transition-opacity duration-500", loading ? "opacity-0" : "opacity-100")}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
export default function Explorar() {
  const [activeTab, setActiveTab] = useState<'all' | 'tutorial' | 'dica'>('all');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const handleShare = () => {
    if (selectedItem) {
      if (navigator.share) {
        navigator.share({
          title: selectedItem.title,
          text: selectedItem.excerpt,
          url: window.location.href,
        }).catch(console.error);
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiado para a área de transferência!');
      }
    }
  };

  const filteredItems = contentData.filter(item => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-full bg-bg">
      <AnimatePresence mode="wait">
        {!selectedItem ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="pb-20"
          >
            {/* Blog Header */}
            <header className="bg-white border-b border-border px-6 py-8">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                      <Compass className="w-5 h-5 font-bold" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Discovery HUB</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-display font-black text-text-main tracking-tight leading-none">
                    Stratis <span className="text-primary italic">Journal</span>
                  </h1>
                  <p className="text-sm text-text-sub font-medium max-w-md">Sua dose diária de estratégia aplicada e maestria técnica.</p>
                </div>

                <div className="relative group w-full md:w-auto">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    placeholder="Pesquisar por tema ou categoria..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-96 pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none font-bold"
                  />
                </div>
              </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12">
              {/* Featured Article */}
              {activeTab === 'all' && searchQuery === '' && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-20"
                >
                  <div 
                    className="group relative grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl overflow-hidden bg-white border border-border shadow-xl hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer"
                    onClick={() => {
                        window.scrollTo(0,0);
                        setSelectedItem(contentData[0]);
                    }}
                  >
                    <div className="lg:col-span-7 h-[250px] lg:h-[400px] overflow-hidden relative">
                      <ImageWithFallback 
                        src={contentData[0].image}
                        alt="Featured"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                    </div>
                    <div className="lg:col-span-5 p-6 md:p-10 flex flex-col justify-center bg-white border-l border-border">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                          <TrendingUp className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-[9px] text-text-sub font-black uppercase tracking-widest">Post em Destaque</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main leading-tight mb-4 group-hover:text-primary transition-colors line-clamp-3">
                        {contentData[0].title}
                      </h2>
                      <p className="text-text-sub text-xs leading-relaxed mb-6 font-medium line-clamp-3">
                        {contentData[0].excerpt}
                      </p>
                      <div className="flex items-center justify-between border-t border-border pt-6 mt-auto">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary font-bold shadow-inner text-[10px]">JR</div>
                          <div>
                            <p className="text-[9px] font-black text-text-main uppercase tracking-widest">{contentData[0].author}</p>
                            <p className="text-[8px] text-text-sub font-bold uppercase">{contentData[0].date}</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Category Nav */}
              <div className="sticky top-[73px] z-20 flex items-center gap-2 mb-12 overflow-x-auto py-4 px-2 no-scrollbar bg-bg/80 backdrop-blur-md">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    "px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-full flex items-center gap-2 whitespace-nowrap",
                    activeTab === 'all' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-text-sub hover:bg-slate-50 border border-border"
                  )}
                >
                  <Compass className="w-3.5 h-3.5" />
                  Todos os Insights
                </button>
                <button 
                  onClick={() => setActiveTab('tutorial')}
                  className={cn(
                    "px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-full flex items-center gap-2 whitespace-nowrap",
                    activeTab === 'tutorial' ? "bg-secondary text-white shadow-lg shadow-secondary/20" : "bg-white text-text-sub hover:bg-slate-50 border border-border"
                  )}
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  Dominando a Stratis
                </button>
                <button 
                  onClick={() => setActiveTab('dica')}
                  className={cn(
                    "px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-full flex items-center gap-2 whitespace-nowrap",
                    activeTab === 'dica' ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-white text-text-sub hover:bg-slate-50 border border-border"
                  )}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  Estratégias de Elite
                </button>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-6">
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item, index) => (
                    <motion.article
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.1 }}
                      className="group flex flex-col cursor-pointer bg-white rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300"
                      onClick={() => {
                          window.scrollTo(0,0);
                          setSelectedItem(item);
                      }}
                    >
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <ImageWithFallback 
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className={cn(
                          "absolute top-3 left-3 p-2 rounded-xl text-white shadow-lg backdrop-blur-md border border-white/20",
                          item.category === 'tutorial' ? "bg-secondary/80" : "bg-accent/80"
                        )}>
                          <item.icon className="w-4 h-4" />
                        </div>
                      </div>
                      
                      <div className="p-5 sm:p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-[0.2em]",
                            item.category === 'tutorial' ? "text-secondary" : "text-accent"
                          )}>
                            {item.category === 'tutorial' ? 'Manual' : 'Inside Strategy'}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-[9px] font-bold text-text-sub uppercase tracking-wider">{item.readTime}</span>
                        </div>
                        
                        <h3 className="text-lg sm:text-xl font-display font-bold text-text-main mb-3 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        
                        <p className="text-xs text-text-sub font-medium leading-relaxed mb-6 line-clamp-2">
                          {item.excerpt}
                        </p>

                        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-primary">JR</div>
                             <span className="text-[9px] font-black text-text-main uppercase tracking-widest">{item.author}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Ler Mais <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>

              {/* Newsletter */}
              <div className="mt-40 p-12 md:p-24 rounded-3xl bg-text-main text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-primary/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/4"></div>
                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-10">
                   <div className="inline-flex items-center gap-2 bg-white/10 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest backdrop-blur-xl border border-white/10">
                     <Flame className="w-4 h-4 text-primary animate-pulse" /> Edição Especial da Newsletter
                   </div>
                   <h2 className="text-4xl md:text-6xl font-display font-bold leading-[1.1]">Estratégias que a concorrência não quer que você saiba.</h2>
                   <p className="text-white/60 text-base md:text-xl font-medium max-w-2xl mx-auto">Receba em primeira mão hacks de memorização e alertas de editais críticos diretamente no seu radar.</p>
                   
                   <div className="flex flex-col md:flex-row gap-5 max-w-2xl mx-auto">
                      <input 
                        type="email" 
                        placeholder="Seu melhor e-mail operacional" 
                        className="flex-1 bg-white/5 border border-white/20 rounded-xl px-8 py-5 text-base focus:outline-none focus:bg-white/10 focus:border-primary transition-all font-medium"
                      />
                      <button className="bg-primary text-white px-10 py-5 rounded-xl text-[12px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-primary/40">
                        Inscrever-se Agora
                      </button>
                   </div>
                   <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest italic flex items-center justify-center gap-2">
                     <CheckCircle2 className="w-3 h-3" /> Transmissão Segura via SSL
                   </p>
                </div>
              </div>
            </main>
          </motion.div>
        ) : (
          <motion.div
            key="article"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-full bg-white"
          >
            {/* Reading Progress Bar */}
            <motion.div 
              className="fixed top-0 left-0 right-0 h-1.5 bg-primary origin-left z-[60]" 
              style={{ scaleX }}
            />

            {/* Article Top Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-border shadow-sm">
              <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => {
                        window.scrollTo(0,0);
                        setSelectedItem(null);
                    }}
                    className="flex items-center gap-2 group text-text-sub hover:text-text-main transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:bg-slate-50 transition-colors shadow-sm">
                      <ArrowLeft className="w-5 h-5" />
                    </div>
                  </button>
                  <div className="hidden md:block w-px h-6 bg-border" />
                  <div className="hidden lg:block truncate max-w-md font-display font-bold text-text-main text-sm">
                    {selectedItem.title}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 md:gap-4">
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest text-text-sub hover:bg-slate-50 transition-all"
                  >
                    <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Compartilhar</span>
                  </button>
                  <button className="p-2.5 rounded-xl border border-border text-text-sub hover:bg-slate-50 transition-all"><Bookmark className="w-4 h-4" /></button>
                  <button className="bg-primary text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all">Salvar Dica</button>
                </div>
              </div>
            </nav>

            <article className="pt-32 pb-40">
              <header className="max-w-4xl mx-auto px-6 mb-20 space-y-10 text-center">
                <div className="flex items-center justify-center gap-4">
                  <span className={cn(
                    "px-5 py-2 rounded-full text-[11px] font-black text-white uppercase tracking-widest shadow-xl",
                    selectedItem.category === 'tutorial' ? "bg-secondary shadow-secondary/20" : "bg-accent shadow-accent/20"
                  )}>
                    {selectedItem.category === 'tutorial' ? 'Documentação' : 'Inside Knowledge'}
                  </span>
                </div>

                <h1 className="text-4xl md:text-7xl font-display font-black text-text-main leading-[1] tracking-tighter">
                  {selectedItem.title}
                </h1>

                <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-4">
                    <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-full border border-border">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black shadow-inner">JR</div>
                        <div className="text-left">
                            <p className="text-[11px] font-black text-text-main uppercase tracking-widest leading-none">{selectedItem.author}</p>
                            <p className="text-[9px] text-text-sub font-bold uppercase tracking-wider">{selectedItem.date} • {selectedItem.readTime} </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {selectedItem.tags.map(tag => (
                            <span key={tag} className="text-[9px] font-black uppercase tracking-widest text-text-sub/50">#{tag}</span>
                        ))}
                    </div>
                </div>
              </header>

              <div className="max-w-6xl mx-auto px-6 mb-24">
                <div className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl">
                  <ImageWithFallback src={selectedItem.image} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
              </div>

              <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-20">
                {/* Sidebar Sticky Left */}
                <aside className="hidden lg:block lg:col-span-3 sticky top-36 h-fit space-y-12">
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-main">Meta Conteúdo</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-text-sub">
                                <Clock className="w-4 h-4 text-primary" />
                                <span className="text-xs font-bold">{selectedItem.readTime} de leitura profunda</span>
                            </div>
                            <div className="flex items-center gap-3 text-text-sub">
                                <MessageSquare className="w-4 h-4 text-secondary" />
                                <span className="text-xs font-bold">12 Comentários da Comunidade</span>
                            </div>
                            <div className="flex items-center gap-3 text-text-sub">
                                <Target className="w-4 h-4 text-accent" />
                                <span className="text-xs font-bold">Nível: Todos os Estudantes</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-2xl border border-border/50">
                        <h4 className="text-[11px] font-black uppercase tracking-widest mb-4">Newsletter</h4>
                        <p className="text-[10px] font-medium text-text-sub mb-6 leading-relaxed">Assine para receber novos insights toda terça-feira.</p>
                        <input type="email" placeholder="email@exemplo.com" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-xs mb-4" />
                        <button className="w-full bg-primary text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest">Assinar Hub</button>
                    </div>
                </aside>

                {/* Main Article Content */}
                <main className="lg:col-span-6">
                    <div className="markdown-body prose prose-xl prose-slate max-w-none 
                    prose-h2:text-4xl prose-h2:font-display prose-h2:font-black prose-h2:text-text-main prose-h2:mt-16 prose-h2:mb-10 prose-h2:tracking-tight
                    prose-p:text-text-main/70 prose-p:leading-[1.8] prose-p:text-xl prose-p:mb-10 prose-p:font-medium
                    prose-li:text-text-main/70 prose-li:text-xl prose-li:font-medium prose-li:mb-4
                    prose-blockquote:border-l-[6px] prose-blockquote:border-primary prose-blockquote:bg-slate-50 prose-blockquote:p-12 rounded-2xl prose-blockquote:text-text-main prose-blockquote:font-display prose-blockquote:text-2xl prose-blockquote:font-bold prose-blockquote:my-16 prose-blockquote:shadow-sm
                    prose-strong:text-text-main prose-strong:font-black
                    ">
                      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                        {selectedItem.content}
                      </Markdown>
                    </div>

                    <div className="mt-32 p-12 bg-text-main text-white rounded-2xl text-center relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                       <div className="relative z-10 space-y-8">
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110 shadow-2xl">
                                <Award className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-3xl font-display font-black leading-tight">Masterize seu Edital na Prática.</h3>
                            <p className="text-white/50 text-base max-w-sm mx-auto font-medium leading-relaxed">Não estude de forma aleatória. Use a metodologia que os aprovados usam.</p>
                            <button 
                                onClick={() => {
                                    window.scrollTo(0,0);
                                    setSelectedItem(null);
                                }}
                                className="bg-white text-text-main px-12 py-5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transform hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10"
                            >
                                Ativar Ferramentas Gratuitas
                            </button>
                       </div>
                    </div>
                    
                    <div className="mt-20 flex items-center justify-between border-t border-border pt-12">
                        <div className="flex items-center gap-6">
                            <button className="flex items-center gap-2 text-text-sub hover:text-primary transition-colors">
                                <Zap className="w-5 h-5" />
                                <span className="text-sm font-black uppercase tracking-widest">Útil (241)</span>
                            </button>
                            <button className="flex items-center gap-2 text-text-sub hover:text-primary transition-colors">
                                <MessageSquare className="w-5 h-5" />
                                <span className="text-sm font-black uppercase tracking-widest">Discussão</span>
                            </button>
                        </div>
                        <button 
                            onClick={handleShare}
                            className="text-text-sub hover:text-primary transition-colors flex items-center gap-2"
                        >
                            <Share2 className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Enviar p/ Amigo</span>
                        </button>
                    </div>
                </main>

                {/* Sidebar Sticky Right - Popular Posts */}
                <aside className="hidden lg:block lg:col-span-3 sticky top-36 h-fit space-y-12">
                   <div className="space-y-8">
                       <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-main flex items-center gap-2">
                           <TrendingUp className="w-4 h-4 text-primary" /> Tendências
                       </h4>
                       <div className="space-y-8">
                           {contentData.filter(i => i.id !== selectedItem.id).slice(0, 3).map((item, i) => (
                               <div 
                                    key={item.id} 
                                    className="group/mini cursor-pointer"
                                    onClick={() => {
                                        window.scrollTo(0,0);
                                        setSelectedItem(item);
                                    }}
                                >
                                   <div className="flex items-start gap-4">
                                       <span className="text-3xl font-display font-black text-slate-100 group-hover/mini:text-primary/10 transition-colors">0{i+1}</span>
                                       <div className="space-y-2">
                                           <h5 className="text-sm font-bold text-text-main leading-snug group-hover/mini:text-primary transition-colors">{item.title}</h5>
                                           <p className="text-[9px] font-black text-text-sub uppercase tracking-widest">{item.author}</p>
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>

                   <div className="relative rounded-3xl overflow-hidden aspect-[4/5] bg-primary group cursor-pointer">
                        <ImageWithFallback 
                             src="https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=2070&auto=format&fit=crop" 
                             alt="CTA"
                             className="w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                            <h4 className="text-2xl font-display font-black leading-tight mb-4">Torne-se uma Máquina de Estudos.</h4>
                            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] group-hover:translate-x-2 transition-transform">Conhecer PRO <ArrowRight className="w-3 h-3" /></button>
                        </div>
                   </div>
                </aside>
              </div>

              {/* Bottom Navigation Related */}
              <footer className="max-w-6xl mx-auto px-6 mt-40 pt-20 border-t border-border">
                <div className="flex items-center justify-between mb-16">
                    <h4 className="text-[12px] font-black text-text-main uppercase tracking-[0.4em]">Exploração Sugerida</h4>
                    <button 
                         onClick={() => {
                            window.scrollTo(0,0);
                            setSelectedItem(null);
                        }}
                        className="text-[10px] font-black text-primary uppercase tracking-widest border-b-2 border-primary/20 hover:border-primary transition-all"
                    >
                        Ver todos os posts
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {contentData.filter(i => i.id !== selectedItem.id).slice(0, 3).map((item) => (
                    <div 
                      key={item.id} 
                      className="group cursor-pointer bg-white border border-border p-4 rounded-2xl hover:shadow-xl transition-all"
                      onClick={() => {
                        window.scrollTo(0, 0);
                        setSelectedItem(item);
                      }}
                    >
                      <div className="aspect-[16/9] w-full overflow-hidden rounded-xl mb-4 shadow-sm">
                        <ImageWithFallback src={item.image} alt="Related" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-[8px] font-black uppercase tracking-widest text-primary">{item.category}</span>
                         <span className="text-[8px] font-bold text-text-sub uppercase tracking-wider">{item.readTime}</span>
                      </div>
                      <h5 className="text-sm font-display font-bold text-text-main group-hover:text-primary transition-colors leading-snug mb-3 line-clamp-2">{item.title}</h5>
                      <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-text-sub group-hover:text-primary transition-colors">Abrir Artigo <ArrowRight className="w-3 h-3" /></span>
                    </div>
                  ))}
                </div>
              </footer>
            </article>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

