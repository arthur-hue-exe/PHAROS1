import {
  WHATSAPP_NUMBER,
  WHATSAPP_DISPLAY,
  SITE_ADDRESS,
  MAPS_QUERY,
  SITE_EMAIL,
  SITE_INSTAGRAM,
  SITE_HOURS,
} from '@/config/site';

export type CourseCategory = 'Atualização' | 'Aperfeiçoamento' | 'Profissional';

export interface CourseFaq {
  q: string;
  a: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  category: CourseCategory;
  shortDescription: string;
  price: number;
  installments: number;
  installmentValue: number;
  oldPrice?: number;
  offerBadge?: string;
  /**
   * Caminho local (src/assets/courses/) ou URL externa da imagem do curso.
   * Para substituir, altere apenas o valor aqui — ou, futuramente, via painel admin.
   * Centralizado em src/config/courseImages.ts para facilitar troca.
   */
  image: string;
  imageAlt: string;
  workload: string;
  modality: string;
  requirements: string[];
  description: string;
  objectives: string[];
  syllabus: string[];
  certification: string;
  faqs: CourseFaq[];
  /**
   * Controla a disponibilidade do curso para matrícula.
   * - true  → DISPONÍVEL: botão "Matricule-se" habilitado
   * - false → INDISPONÍVEL: botão desabilitado, badge vermelho exibido
   *
   * Em produção este valor vem do banco (tabela `courses`, coluna `is_available`).
   * O valor aqui serve de fallback/seed inicial caso o BD ainda não tenha o registro.
   */
  is_available: boolean;
}

export const courses: Course[] = [
  {
    id: '1',
    slug: 'atualizacao-transporte-de-valores',
    title: 'Atualização em Transporte de Valores',
    category: 'Atualização',
    shortDescription: 'Reciclagem obrigatória para profissionais de transporte de valores com foco em procedimentos, segurança e legislação vigente.',
    price: 800,
    installments: 4,
    installmentValue: 200,
    image: 'https://images.pexels.com/photos/28288101/pexels-photo-28288101.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Camininhão blindado de transporte de valores estacionado em via urbana',
    workload: '60 horas',
    modality: 'Presencial',
    requirements: [
      'Certificado de Formação de Vigilante vigente',
      'Mínimo 18 anos',
      'Documento de identificação e CPF',
      'Comprovante de residência',
    ],
    description:
      'Curso de atualização focado em profissionais que atuam no transporte de valores. Aborda procedimentos operacionais, roteiros, gestão de risco, condução defensiva e resposta a incidentes, em conformidade com a legislação atual e as exigências da Portaria do Departamento de Polícia Federal.',
    objectives: [
      'Atualizar conhecimentos técnicos sobre transporte de valores',
      'Revisar procedimentos de segurança e protocolos operacionais',
      'Aperfeiçoar respostas a situações de risco e emergência',
      'Reforçar conhecimentos sobre legislação aplicada ao setor',
    ],
    syllabus: [
      'Legislação aplicada ao transporte de valores',
      'Procedimentos operacionais e roteiros',
      'Gestão de risco e planejamento de rotas',
      'Condução defensiva e evasiva',
      'Resposta a incidentes e ocorrências',
      'Armamento e munição: atualização',
      'Primeiros socorros aplicados',
      'Ética e conduta profissional',
    ],
    certification:
      'Certificado de Atualização reconhecido conforme exigências da Polícia Federal para reciclagem de profissionais de segurança privada.',
    faqs: [
      {
        q: 'A atualização é obrigatória?',
        a: 'Sim. A reciclagem periódica é exigida para manutenção da habilitação profissional conforme legislação vigente.',
      },
      {
        q: 'Preciso levar o armamento?',
        a: 'Não. Os equipamentos e materiais de instrução prática são fornecidos pela escola durante as aulas.',
      },
      {
        q: 'Há horários noturnos?',
        a: 'Disponibilizamos turmas em diferentes horários. Consulte a agenda com nossa equipe de matrículas.',
      },
    ],
    is_available: true,
  },
  {
    id: '2',
    slug: 'aperfeicoamento-seguranca-pessoal-privada',
    title: 'Aperfeiçoamento em Segurança Pessoal Privada',
    category: 'Aperfeiçoamento',
    shortDescription: 'Capacitação avançada para execução de escolta armada e proteção de pessoas, com técnicas táticas e protocolos de conduta.',
    price: 1400,
    installments: 4,
    installmentValue: 350,
    image: 'https://images.pexels.com/photos/8425354/pexels-photo-8425354.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Profissionais de segurança executiva acompanhando cliente em veículo',
    workload: '120 horas',
    modality: 'Presencial',
    requirements: [
      'Certificado de Formação de Vigilante vigente',
      'Mínimo 21 anos',
      'Aprovação em avaliação psicotécnica',
      'Documento de identificação e CPF',
    ],
    description:
      'Curso de aperfeiçoamento destinado a profissionais que desejam atuar na área de segurança pessoal privada — execução de escolta armada e proteção de executivos. Combina teoria, prática tática e simulações realistas para preparar o aluno para cenários reais de proteção.',
    objectives: [
      'Desenvolver habilidades de proteção executiva e escolta',
      'Aplicar técnicas de varredura, posicionamento e cobertura',
      'Trear protocolos de conduta em diferentes cenários de risco',
      'Aperfeiçoar comunicação e trabalho em equipe de proteção',
    ],
    syllabus: [
      'Fundamentos da segurança pessoal privada',
      'Técnicas de escolta e proteção de executivos',
      'Posicionamento, cobertura e varredura ambiental',
      'Condução defensiva e evasiva aplicada',
      'Armamento e tiro defensivo',
      'Defesa pessoal aplicada à proteção',
      'Comunicação e coordenação de equipe',
      'Gestão de crises e respostas a incidentes',
      'Simulações práticas e estudos de caso',
    ],
    certification:
      'Certificado de Aperfeiçoamento em Segurança Pessoal Privada, válido para fins de capacitação profissional no setor.',
    faqs: [
      {
        q: 'Este curso habilita para escolta armada?',
        a: 'O curso oferece a capacitação técnica para atuação na área. A habilitação formal depende dos requisitos legais aplicáveis.',
      },
      {
        q: 'Qual o nível de exigência física?',
        a: 'Recomendamos condição física adequada. As atividades práticas incluem deslocamentos, simulações e defesa pessoal.',
      },
      {
        q: 'Preciso ter experiência prévia em segurança?',
        a: 'É necessário possuir Formação de Vigilante vigente. O curso é voltado para profissionais que buscam especialização.',
      },
    ],
    is_available: true,
  },
  {
    id: '3',
    slug: 'atualizacao-seguranca-pessoal-privada',
    title: 'Atualização em Segurança Pessoal Privada',
    category: 'Atualização',
    shortDescription: 'Reciclagem para profissionais de segurança pessoal privada com revisão de técnicas táticas, protocolos e legislação.',
    price: 1400,
    installments: 4,
    installmentValue: 350,
    image: 'https://images.pexels.com/photos/8425052/pexels-photo-8425052.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Profissional de segurança pessoal protegendo cliente durante saída de veículo',
    workload: '80 horas',
    modality: 'Presencial',
    requirements: [
      'Certificado de Formação ou Aperfeiçoamento em Segurança Pessoal Privada',
      'Mínimo 21 anos',
      'Documento de identificação e CPF',
    ],
    description:
      'Curso de atualização para profissionais que já atuam ou possuem formação em segurança pessoal privada. Revisa técnicas de proteção, escolta, conduta tática e atualizações legislativas, garantindo que o profissional mantenha-se alinhado às melhores práticas do setor.',
    objectives: [
      'Atualizar técnicas de proteção e escolta executiva',
      'Revisar protocolos táticos e de conduta',
      'Reforçar conhecimentos sobre legislação atualizada',
      'Aperfeiçoar respostas a situações de risco',
    ],
    syllabus: [
      'Revisão de técnicas de proteção executiva',
      'Atualização legislativa do setor',
      'Protocolos de escolta e posicionamento',
      'Condução defensiva: reciclagem',
      'Armamento e tiro: atualização',
      'Simulações e cenários práticos',
      'Gestão de crises e tomada de decisão',
    ],
    certification:
      'Certificado de Atualização em Segurança Pessoal Privada, reconhecido para fins de reciclagem profissional.',
    faqs: [
      {
        q: 'Qual a diferença entre o curso de Aperfeiçoamento e a Atualização?',
        a: 'O Aperfeiçoamento é a formação inicial na área. A Atualização é a reciclagem periódica para quem já possui essa capacitação.',
      },
      {
        q: 'O curso inclui práticas de tiro?',
        a: 'Sim, inclui atualização de armamento e tiro defensivo como parte da grade prática.',
      },
    ],
    is_available: true,
  },
  {
    id: '4',
    slug: 'supervisor-operacional-e-lideranca',
    title: 'Supervisor Operacional e Liderança',
    category: 'Profissional',
    shortDescription: 'Formação para supervisores de operações de segurança com foco em liderança de equipes, gestão e procedimentos operacionais.',
    price: 260,
    installments: 3,
    installmentValue: 86.67,
    image: 'https://images.pexels.com/photos/11783119/pexels-photo-11783119.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Supervisor em sala de controle monitorando operações em telas',
    workload: '40 horas',
    modality: 'Presencial',
    requirements: [
      'Experiência comprovada no setor de segurança privada',
      'Certificado de Formação de Vigilante',
      'Documento de identificação e CPF',
    ],
    description:
      'Curso voltado para profissionais que atuam ou desejam atuar como supervisores operacionais em empresas de segurança privada. Aborda liderança, gestão de equipes, procedimentos operacionais, comunicação e resolução de conflitos, preparando o aluno para posições de coordenação.',
    objectives: [
      'Desenvolver competências de liderança e gestão de equipes',
      'Dominar procedimentos operacionais de supervisão',
      'Aperfeiçoar comunicação e resolução de conflitos',
      'Preparar-se para atuar como supervisor operacional',
    ],
    syllabus: [
      'Fundamentos de liderança em segurança privada',
      'Gestão de equipes e escalas operacionais',
      'Procedimentos de supervisão e ronda',
      'Comunicação eficaz e relatórios operacionais',
      'Resolução de conflitos e tomada de decisão',
      'Gestão de crises do ponto de vista do supervisor',
      'Legislação e responsabilidades do supervisor',
    ],
    certification:
      'Certificado de conclusão do curso de Supervisor Operacional e Liderança.',
    faqs: [
      {
        q: 'Preciso ter experiência prévia como vigilante?',
        a: 'Sim, é recomendável experiência no setor para aproveitar melhor o conteúdo.',
      },
      {
        q: 'O curso é voltado apenas para supervisores já atuantes?',
        a: 'Não. Profissionais que desejam crescer na carreira e assumir posições de liderança também podem participar.',
      },
    ],
    is_available: true,
  },
  {
    id: '5',
    slug: 'manutencao-e-manuseio-de-armas',
    title: 'Manutenção e Manuseio de Armas',
    category: 'Profissional',
    shortDescription: 'Curso prático sobre manuseio, desmontagem, limpeza e manutenção de armas de fogo para profissionais de segurança.',
    price: 260,
    installments: 3,
    installmentValue: 86.67,
    image: 'https://images.pexels.com/photos/5202438/pexels-photo-5202438.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Armas de fogo e equipamentos de segurança em mesa de estande de tiro',
    workload: '40 horas',
    modality: 'Presencial',
    requirements: [
      'Certificado de Formação de Vigilante vigente',
      'Mínimo 18 anos',
      'Documento de identificação e CPF',
    ],
    description:
      'Curso focado no manuseio seguro, desmontagem, montagem, limpeza e manutenção preventiva de armas de fogo utilizadas na segurança privada. Combina teoria e prática para garantir que o profissional domine os procedimentos corretos de cuidado com o armamento.',
    objectives: [
      'Dominar procedimentos de manuseio seguro de armas',
      'Aprender desmontagem, montagem e limpeza',
      'Realizar manutenção preventiva corretamente',
      'Identificar e solucionar falhas comuns',
    ],
    syllabus: [
      'Normas de segurança no manuseio de armas',
      'Desmontagem e montagem de pistolas e revólveres',
      'Limpeza e lubrificação adequadas',
      'Manutenção preventiva e corretiva',
      'Identificação de falhas e soluções',
      'Armazenamento e transporte seguro',
      'Prática supervisionada em estande',
    ],
    certification:
      'Certificado de conclusão do curso de Manutenção e Manuseio de Armas.',
    faqs: [
      {
        q: 'Preciso ter arma própria?',
        a: 'Não. As armas utilizadas no curso são fornecidas pela escola.',
      },
      {
        q: 'O curso inclui tiro prático?',
        a: 'Inclui prática supervisionada em estande, com foco no manuseio e manutenção.',
      },
    ],
    is_available: true,
  },
  {
    id: '6',
    slug: 'monitoramento-cftv',
    title: 'Monitoramento CFTV',
    category: 'Profissional',
    shortDescription: 'Capacitação para operadores de monitoramento de câmeras de segurança com foco em vigilância, tecnologia e resposta.',
    price: 260,
    installments: 3,
    installmentValue: 86.67,
    image: 'https://images.pexels.com/photos/30692441/pexels-photo-30692441.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Operador de segurança em sala de controle monitorando telas de vigilância',
    workload: '40 horas',
    modality: 'Presencial',
    requirements: [
      'Mínimo 18 anos',
      'Ensino fundamental completo',
      'Documento de identificação e CPF',
    ],
    description:
      'Curso voltado para profissionais que atuam ou desejam atuar em centrais de monitoramento de CFTV. Aborda operação de sistemas de câmeras, análise de imagens, detecção de anomalias, protocolos de resposta e tecnologia de vigilância eletrônica.',
    objectives: [
      'Operar sistemas de CFTV com eficiência',
      'Identificar e analisar eventos suspeitos',
      'Aplicar protocolos de resposta a incidentes',
      'Compreender a tecnologia de vigilância eletrônica',
    ],
    syllabus: [
      'Fundamentos de CFTV e vigilância eletrônica',
      'Operação de centrais de monitoramento',
      'Análise de imagens e detecção de anomalias',
      'Protocolos de resposta a incidentes',
      'Tecnologia de câmeras e gravadores',
      'Relatórios e registro de ocorrências',
      'Ética e sigilo profissional',
    ],
    certification:
      'Certificado de conclusão do curso de Monitoramento CFTV.',
    faqs: [
      {
        q: 'Preciso experiência prévia em tecnologia?',
        a: 'Não. O curso parte dos fundamentos e é acessível a iniciantes.',
      },
      {
        q: 'O curso serve para atuar em central de alarme?',
        a: 'Sim, os conhecimentos são aplicáveis a centrais de monitoramento e alarme.',
      },
    ],
    is_available: true,
  },
  {
    id: '7',
    slug: 'seguranca-bancaria',
    title: 'Segurança Bancária',
    category: 'Profissional',
    shortDescription: 'Capacitação específica para atuação em segurança bancária com foco em procedimentos, atendimento e prevenção a riscos.',
    price: 260,
    oldPrice: 280,
    offerBadge: 'Oferta',
    installments: 3,
    installmentValue: 86.67,
    image: 'https://images.pexels.com/photos/13674041/pexels-photo-13674041.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Agência bancária iluminada à noite com estrutura moderna',
    workload: '40 horas',
    modality: 'Presencial',
    requirements: [
      'Certificado de Formação de Vigilante vigente',
      'Mínimo 18 anos',
      'Documento de identificação e CPF',
    ],
    description:
      'Curso voltado para profissionais que atuam ou desejam atuar em agências bancárias e dependências financeiras. Aborda procedimentos específicos do ambiente bancário, atendimento, prevenção a riscos, resposta a assaltos e conduta profissional.',
    objectives: [
      'Dominar procedimentos de segurança bancária',
      'Atuar com conduta profissional em ambiente financeiro',
      'Prevenir e responder a situações de risco',
      'Aplicar protocolos específicos do setor bancário',
    ],
    syllabus: [
      'Procedimentos de segurança em agências bancárias',
      'Atendimento e conduta profissional',
      'Prevenção a riscos e fraudes',
      'Resposta a assaltos e ocorrências',
      'Sistemas de segurança bancária',
      'Protocolos de comunicação e emergência',
      'Legislação aplicada ao setor financeiro',
    ],
    certification:
      'Certificado de conclusão do curso de Segurança Bancária.',
    faqs: [
      {
        q: 'Por que este curso está com preço promocional?',
        a: 'Estamos com uma oferta especial para novos alunos. O valor original é de R$ 280,00.',
      },
      {
        q: 'O curso é específico para vigilantes bancários?',
        a: 'Sim, o conteúdo é voltado para a atuação em ambiente bancário e financeiro.',
      },
    ],
    is_available: true,
  },
];

export const categoryFilters: ('Todos' | CourseCategory)[] = [
  'Todos',
  'Atualização',
  'Aperfeiçoamento',
  'Profissional',
];

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  image: string;
  alt: string;
}

export const galleryItems: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Treinamento Tático',
    description: 'Prática de técnicas operacionais em ambiente controlado',
    image: 'https://images.pexels.com/photos/29561683/pexels-photo-29561683.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Profissional em treinamento tático com equipamento operacional',
  },
  {
    id: 'g2',
    title: 'Sala de Aula',
    description: 'Instrução teórica com material didático atualizado',
    image: 'https://images.pexels.com/photos/5756649/pexels-photo-5756649.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Adultos em sala de aula participando de instrução teórica',
  },
  {
    id: 'g3',
    title: 'Estande de Tiro',
    description: 'Prática de armamento e tiro com supervisão especializada',
    image: 'https://images.pexels.com/photos/17314913/pexels-photo-17314913.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Homem praticando tiro em estande ao ar livre',
  },
  {
    id: 'g4',
    title: 'Central de Monitoramento',
    description: 'Operação de sistemas de CFTV e vigilância eletrônica',
    image: 'https://images.pexels.com/photos/19317897/pexels-photo-19317897.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Sala de controle moderna com monitores digitais',
  },
  {
    id: 'g5',
    title: 'Formação Tática',
    description: 'Exercícios de equipe e simulações operacionais',
    image: 'https://images.pexels.com/photos/37360234/pexels-photo-37360234.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Grupo de profissionais em treinamento físico e tático',
  },
  {
    id: 'g6',
    title: 'Transporte de Valores',
    description: 'Procedimentos operacionais para escolta e transporte',
    image: 'https://images.pexels.com/photos/38038520/pexels-photo-38038520.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Veículo blindado de transporte de valores',
  },
];

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  initials: string;
  isDemo: boolean;
}

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Carlos Mendes',
    role: 'Vigilante — Segurança Bancária',
    text: 'A estrutura da PHAROS superou minhas expectativas. A parte prática foi fundamental para minha atuação em agência. Instrutores muito experientes.',
    rating: 5,
    initials: 'CM',
    isDemo: true,
  },
  {
    id: 't2',
    name: 'Rafael Souza',
    role: 'Operador de CFTV',
    text: 'O curso de Monitoramento me deu confiança para atuar em central. O conteúdo é direto e a prática em equipamentos reais faz toda a diferença.',
    rating: 5,
    initials: 'RS',
    isDemo: true,
  },
  {
    id: 't3',
    name: 'Juliana Ramos',
    role: 'Supervisora Operacional',
    text: 'O curso de Supervisor me preparou para liderar equipe. Aprendi na prática como gerir operações e resolver conflitos no dia a dia.',
    rating: 5,
    initials: 'JR',
    isDemo: true,
  },
  {
    id: 't4',
    name: 'Marcos Antônio',
    role: 'Segurança Pessoal Privada',
    text: 'O aperfeiçoamento em segurança pessoal é muito completo. As simulações são realistas e os instrutores trazem experiência de campo.',
    rating: 5,
    initials: 'MA',
    isDemo: true,
  },
];

export interface NewsItem {
  id: string;
  date: string;
  dateLabel: string;
  title: string;
  summary: string;
  image: string;
  alt: string;
  isPast: boolean;
}

export const newsItems: NewsItem[] = [
  {
    id: 'n1',
    date: '2024-11-13',
    dateLabel: '13 de Novembro de 2024',
    title: 'Evento discute nova legislação de segurança privada',
    summary:
      'Encontro promovido por Banco Santander, Fenavist e entidades do setor debateu desafios e avanços da nova legislação de segurança privada, com foco em formação profissional e atualização dos padrões operacionais.',
    image: 'https://images.pexels.com/photos/9275222/pexels-photo-9275222.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Plateia em evento de conferência assistindo apresentação',
    isPast: true,
  },
  {
    id: 'n2',
    date: '2024-11-13',
    dateLabel: '13 de Novembro de 2024',
    title: 'Fenavist reúne profissionais para debate setorial',
    summary:
      'O evento trouxe painéis sobre a regulamentação atualizada, capacitação contínua e os novos desafios enfrentados por profissionais de segurança privada em todo o país.',
    image: 'https://images.pexels.com/photos/26202153/pexels-photo-26202153.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Profissionais em conferência corporativa prestando atenção à palestra',
    isPast: true,
  },
];

export interface TimelineStep {
  step: string;
  title: string;
  description: string;
}

export const timelineSteps: TimelineStep[] = [
  {
    step: '01',
    title: 'Conheça',
    description: 'Explore nossos cursos e modalidades. Entenda qual formação se alinha ao seu momento profissional.',
  },
  {
    step: '02',
    title: 'Escolha seu curso',
    description: 'Selecione a formação ideal entre Atualização, Aperfeiçoamento e Cursos Profissionais.',
  },
  {
    step: '03',
    title: 'Realize sua matrícula',
    description: 'Faça sua matrícula online ou pelo WhatsApp. Processo simples e rápido.',
  },
  {
    step: '04',
    title: 'Participe da formação',
    description: 'Aulas práticas e teóricas com instrutores qualificados em estrutura preparada.',
  },
  {
    step: '05',
    title: 'Receba sua certificação',
    description: 'Conclua o curso e receba seu certificado, pronto para atuar no mercado.',
  },
];

export interface StatItem {
  label: string;
  value: number;
  suffix: string;
}

export const stats: StatItem[] = [
  { label: 'Cursos disponíveis', value: 7, suffix: '+' },
  { label: 'Profissionais capacitados', value: 500, suffix: '+' },
  { label: 'Modalidades de formação', value: 3, suffix: '' },
  { label: 'Atendimento em Goiás', value: 1, suffix: '' },
];

export interface Differentiator {
  icon: string;
  title: string;
  description: string;
}

export const differentiators: Differentiator[] = [
  {
    icon: 'ShieldCheck',
    title: 'Formação Profissional',
    description:
      'Cursos estruturados conforme exigências legais e padrões do mercado de segurança privada.',
  },
  {
    icon: 'UserCheck',
    title: 'Instrutores Qualificados',
    description:
      'Professores com experiência comprovada em segurança, tática e operações do setor.',
  },
  {
    icon: 'Building2',
    title: 'Estrutura Preparada',
    description:
      'Ambiente de treinamento com salas de aula, estande e equipamentos operacionais.',
  },
  {
    icon: 'RefreshCw',
    title: 'Atualização Constante',
    description:
      'Conteúdo sempre alinhado à legislação vigente e às práticas mais recentes do setor.',
  },
  {
    icon: 'TrendingUp',
    title: 'Foco no Mercado de Trabalho',
    description:
      'Formação voltada para as reais demandas das empresas de segurança privada em Goiás.',
  },
];

/**
 * contactInfo — dados institucionais exibidos no frontend.
 * Fonte de verdade: src/config/site.ts — edite apenas lá.
 */
export const contactInfo = {
  address: SITE_ADDRESS,
  email: SITE_EMAIL,
  whatsapp: WHATSAPP_NUMBER,
  whatsappDisplay: WHATSAPP_DISPLAY,
  instagram: SITE_INSTAGRAM,
  mapsQuery: MAPS_QUERY,
  hours: SITE_HOURS,
};

export const navLinks = [
  { label: 'Início', href: '#inicio' },
  { label: 'A Escola', href: '#sobre' },
  { label: 'Cursos', href: '#cursos' },
  { label: 'Estrutura', href: '#estrutura' },
  { label: 'Depoimentos', href: '#depoimentos' },
  { label: 'Contato', href: '#contato' },
];
