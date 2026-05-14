import { 
  Layout, 
  Zap, 
  Target, 
  Flame 
} from 'lucide-react';

export interface ContentItem {
  id: string;
  category: 'tutorial' | 'dica';
  title: string;
  excerpt: string;
  content: string;
  icon: any;
  image: string;
  readTime: string;
  author: string;
  date: string;
  tags: string[];
}

export const contentData: ContentItem[] = [
  {
    id: 'tutorial-1',
    category: 'tutorial',
    title: 'Transforme o Caos do Edital em Ordem',
    excerpt: 'Sabe aquele PDF gigante? A gente te ensina a transformar ele em um plano real de aprovação hoje mesmo.',
    author: 'Joadson Rocha',
    date: '14 de Maio, 2024',
    tags: ['Estratégia', 'IA', 'Comece Aqui'],
    content: `
## Você não precisa de uma planilha, você precisa de clareza

Abrir um edital de 200 páginas é o momento em que muitos desistem. A gente sente esse peso. Por isso, a Stratis nasceu para ser o seu braço direito. Em vez de perder dias tentando entender o que é mais importante, deixe nossa tecnologia fazer o trabalho pesado.

### Como funciona na prática?

1. **Suba o seu Edital**: Não se preocupe com o formato. Nossa IA foi treinada para entender a hierarquia das bancas.
2. **Defina seu Ritmo**: Só tem 2 horas por dia? Tudo bem. A plataforma ajusta a carga horária para que você veja o essencial sem pirar.
3. **Foque no Coração do Edital**: Usamos o **Princípio de Pareto**. 80% das suas questões virão de 20% do edital. Nós sinalizamos exatamente onde está esse "tesouro".

> "Não é sobre quanto tempo você estuda, mas sobre a qualidade do que você faz com o tempo que tem."

**Lembre-se:** Você pode ajustar qualquer detalhe do cronograma a qualquer momento. O plano é seu, a gente só facilita o caminho.
    `,
    icon: Layout,
    image: 'https://images.unsplash.com/photo-1434030216411-067df72459ef?q=80&w=2000&auto=format&fit=crop',
    readTime: '3 min'
  },
  {
    id: 'tutorial-2',
    category: 'tutorial',
    title: 'O Segredo da Memória Blindada',
    excerpt: 'Pare de esquecer o que estudou ontem. Entenda como o microaprendizado salva sua rotina.',
    author: 'Equipe Editorial',
    date: '12 de Maio, 2024',
    tags: ['Neurociência', 'Memorização'],
    content: `
## Por que a gente esquece?

Você já teve a sensação de ler 50 páginas e, 15 minutos depois, sentir que o cérebro está em branco? Isso é o que chamamos de "ilusão de competência". O cérebro humano não foi feito para maratonas de leitura passiva.

### A estratégia do Microaprendizado

Na Stratis, a gente quebra o conteúdo em pílulas. É muito melhor estudar **30 minutos focados** do que 3 horas distraídos.

- **Flashcards Inteligentes**: A IA identifica os conceitos-chave do seu texto e cria perguntas que desafiam sua memória.
- **Mapas Mentais Ativos**: Visualize como uma lei se conecta com outra. Quando você vê o "todo", o detalhe faz sentido.
- **Repetição Espaçada**: O sistema te avisa o momento exato de revisar, logo antes do seu cérebro deletar a informação.

Estudar menos, mas estudar melhor. Esse é o caminho da elite.
    `,
    icon: Zap,
    image: 'https://images.unsplash.com/photo-1506377711776-dbdc2f3c20d9?q=80&w=1973&auto=format&fit=crop',
    readTime: '4 min'
  },
  {
    id: 'dica-1',
    category: 'dica',
    title: 'Pare de ser um "Colecionador de PDFs"',
    excerpt: 'O erro número 1 que afasta você da posse e como a técnica 80/20 resolve isso.',
    author: 'Joadson Rocha',
    date: '10 de Maio, 2024',
    tags: ['Mindset', 'Produtividade'],
    content: `
## O perigo da obesidade mental

Muitos concurseiros acham que ter 1TB de material é estar preparado. A verdade? Isso só gera ansiedade. O aprovado não é quem tem mais material, é quem domina a base.

### Aplicando o 80/20 (Lei de Pareto)

Em qualquer prova, um grupo pequeno de assuntos responde pela maioria das questões. Se você dominar esses 20% com maestria, sua nota vai disparar.

1. **Analise sua Banca**: Não estude Direito Constitucional de forma genérica. Estude como a **FGV** ou o **Cebraspe** cobram isso.
2. **Sinalização Visual**: Na Stratis, os temas "quentes" ganham destaque. Comece o dia por eles, enquanto sua energia está alta.
3. **Simulados de Base**: Teste seu conhecimento nos temas centrais antes de se aventurar nos rodapés de livros.

Mantenha a simplicidade. Foque no que traz pontos.
    `,
    icon: Target,
    image: 'https://images.unsplash.com/photo-1454165833767-13067144603e?q=80&w=2070&auto=format&fit=crop',
    readTime: '5 min'
  },
  {
    id: 'dica-3',
    category: 'dica',
    title: 'A Ciência do Descanso Estratégico',
    excerpt: 'Sim, dormir e descansar faz parte do estudo. Entenda como vencer o cansaço mental.',
    author: 'Equipe Editorial',
    date: '08 de Maio, 2024',
    tags: ['Saúde', 'Performance'],
    content: `
## Você não é uma máquina

O cansaço não é falta de foco, é um sinal biológico. Quando você força a barra sem descansar, a retenção cai para quase zero. Você está apenas gastando luz e tempo.

### O Padrão 24-7-30 de Recuperação

A Stratis automatiza seu fluxo para que o descanso seja produtivo:

- **Descanso de 24h**: Depois de um dia pesado, seu cérebro precisa de sono para consolidar a memória.
- **Ajuste Semanal**: Tenha um dia de folga total ou de leveza. Isso previne o *Burnout*.
- **Ciclos de 30 Dias**: Reavalie sua energia. Se estiver exausto, diminua o ritmo antes que precise parar de vez.

Respeite seu corpo. Ele é a sua principal ferramenta de aprovação.
    `,
    icon: Flame,
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop',
    readTime: '6 min'
  }
];
