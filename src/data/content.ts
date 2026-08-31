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

// ── Certidões exigidas (texto padrão reutilizado nos cursos) ──────────────────
const CERTIDOES_EXIGIDAS = [
  'Certidão Negativa Criminal Estadual',
  'Certidão Militar da União',
  'Certidão Negativa de Crimes Federais',
  'Certidão Negativa de Crimes Eleitorais',
  'Certidão de Quitação Eleitoral',
];

// ── FAQ padrão sobre certidões ────────────────────────────────────────────────
const FAQ_CERTIDOES: CourseFaq[] = [
  {
    q: 'Quais certidões criminais são exigidas?',
    a: 'Certidão Negativa Criminal Estadual, Certidão Militar da União, Certidão Negativa de Crimes Federais, Certidão Negativa de Crimes Eleitorais e Certidão de Quitação Eleitoral. Os dados devem ser compatíveis com a identidade apresentada — não são aceitos nomes divergentes.',
  },
  {
    q: 'A escola pode retirar as certidões?',
    a: 'Sim. A instituição pode realizar a retirada das certidões por R$ 10,00 por certidão.',
  },
  {
    q: 'Como devem ser entregues as cópias dos documentos?',
    a: 'Toda a documentação deve ser apresentada no ato da matrícula. As cópias devem ser legíveis e coloridas.',
  },
];

// ── FAQ padrão sobre exames ───────────────────────────────────────────────────
const FAQ_EXAMES: CourseFaq[] = [
  {
    q: 'Como funciona o pagamento dos exames?',
    a: 'Os exames psicotécnico (R$ 50,00) e médico (R$ 40,00) são pagos diretamente aos médicos no dia do exame, em dinheiro ou PIX.',
  },
];

// ── FAQ padrão sobre alojamento ───────────────────────────────────────────────
const FAQ_ALOJAMENTO: CourseFaq[] = [
  {
    q: 'Há opção de alojamento?',
    a: 'Sim. O alojamento custa R$ 25,00 por dia, com Wi-Fi e piscina inclusos. O aluno deve levar roupa de cama e travesseiro. Existe local para lavar roupas.',
  },
];

export const courses: Course[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. FORMAÇÃO DE VIGILANTE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: '1',
    slug: 'formacao-de-vigilante',
    title: 'Curso de Formação de Vigilante',
    category: 'Profissional',
    shortDescription: 'Formação completa para atuar como vigilante patrimonial armado. 200 horas presenciais com turmas intensivas (20 dias) ou noturnas (44 noites). Segurança armada.',
    price: 1500,
    installments: 6,
    installmentValue: 300,
    image: 'https://images.pexels.com/photos/4653119/pexels-photo-4653119.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Profissional de segurança em treinamento tático',
    workload: '200 H/Aulas',
    modality: 'Presencial',
    requirements: [
      '21 anos completos',
      '1 foto 3x4 (pode ser tirada gratuitamente na instituição)',
      'Cópia de identidade ou CNH dentro da validade de 10 anos',
      'Cópia do CPF',
      'Certificado de reservista ou dispensa com foto (para homens, conforme regras informadas)',
      'Histórico escolar — mínimo 8ª série completo',
      'Comprovante de endereço atual com CEP (validade de 3 meses)',
      ...CERTIDOES_EXIGIDAS,
    ],
    description:
      'O Curso de Formação de Vigilante habilita profissionais para atuação em segurança patrimonial armada, conforme exigências da legislação vigente. Com 200 horas de carga horária presencial, o curso é oferecido em duas modalidades: intensiva (20 dias consecutivos) e noturna (44 noites). O aluno receberá formação completa em legislação, procedimentos operacionais, armamento, tiro, primeiros socorros e ética profissional.',
    objectives: [
      'Habilitar o aluno para atuar como vigilante patrimonial armado',
      'Dominar legislação aplicada à segurança privada',
      'Desenvolver técnicas de postura, posicionamento e ronda',
      'Aprender procedimentos de armamento, tiro e manuseio seguro',
      'Capacitar para primeiros socorros e resposta a emergências',
      'Formar conduta ética e profissional no exercício da função',
    ],
    syllabus: [
      'Legislação da segurança privada',
      'Ética e conduta profissional',
      'Técnicas de vigilância e ronda',
      'Armamento e munição',
      'Tiro prático supervisionado',
      'Primeiros socorros',
      'Prevenção e combate a incêndio',
      'Relações humanas e atendimento ao público',
      'Noções de informática aplicada',
      'Educação física e condicionamento',
    ],
    certification:
      'Certificado de Formação de Vigilante homologado, habilitando o profissional para exercer a função de vigilante patrimonial armado conforme legislação vigente.',
    faqs: [
      {
        q: 'Quais são as modalidades disponíveis?',
        a: 'Modalidade intensiva: 20 dias consecutivos (segunda a segunda), das 08:00 às 17:20. Modalidade noturna: 44 noites (segunda a sexta), das 18:30 às 22:50. Para a modalidade noturna, o interessado deve deixar o nome na lista.',
      },
      {
        q: 'Qual é o valor do curso?',
        a: 'R$ 1.500,00 à vista ou R$ 1.800,00 no cartão de crédito em até 6x de R$ 300,00. Não trabalhamos com boleto ou link de pagamento.',
      },
      {
        q: 'Quais são as próximas turmas?',
        a: 'Turmas previstas: 10/08, 24/08, 07/09, 28/09, 05/10 e 19/10. Confirme disponibilidade pelo WhatsApp.',
      },
      {
        q: 'O material didático está incluso?',
        a: 'A apostila em PDF está inclusa. A apostila física pode ser adquirida por R$ 45,00.',
      },
      {
        q: 'Há alojamento disponível?',
        a: 'Sim, R$ 25,00 por dia com Wi-Fi e piscina. O aluno deve levar roupa de cama e travesseiro. Existe local para lavar roupas.',
      },
      {
        q: 'Há alimentação no local?',
        a: 'Refeitório, restaurantes, lanchonetes e mercado ficam nas proximidades da instituição, mas não fazem parte da estrutura interna.',
      },
      {
        q: 'Há regras de vestimenta?',
        a: 'Para atividades físicas: traje permitido com no máximo 4 dedos acima do joelho e tênis. Para demais aulas: roupa padrão com calça.',
      },
      ...FAQ_EXAMES,
      ...FAQ_CERTIDOES,
    ],
    is_available: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ATUALIZAÇÃO DE VIGILANTE PATRIMONIAL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: '2',
    slug: 'atualizacao-vigilante-patrimonial',
    title: 'Atualização de Vigilante Patrimonial',
    category: 'Atualização',
    shortDescription: 'Reciclagem obrigatória para vigilantes patrimoniais. 5 dias presenciais, apenas diurno, turmas às segundas-feiras.',
    price: 500,
    installments: 4,
    installmentValue: 137.50,
    image: 'https://images.pexels.com/photos/8425354/pexels-photo-8425354.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Vigilante patrimonial em posto de segurança',
    workload: '40 horas',
    modality: 'Presencial',
    requirements: [
      '1 foto 3x4',
      'Identidade ou CNH válida',
      'CPF',
      'Certificado de reservista ou dispensa (para homens, conforme regras informadas)',
      'Comprovante de endereço atual',
      'Certificado do curso de formação de vigilante',
      ...CERTIDOES_EXIGIDAS,
    ],
    description:
      'Curso de atualização obrigatória para vigilantes patrimoniais que precisam manter sua habilitação profissional em dia. Com duração de 5 dias presenciais no período diurno, as turmas iniciam às segundas-feiras, no formato 12x36 em dias alternados.',
    objectives: [
      'Reciclar conhecimentos técnicos e legais do vigilante patrimonial',
      'Atualizar procedimentos operacionais conforme legislação vigente',
      'Revisar armamento, tiro e protocolos de segurança',
      'Reforçar postura ética e conduta profissional',
    ],
    syllabus: [
      'Atualização legislativa da segurança privada',
      'Revisão de técnicas de vigilância e posicionamento',
      'Armamento e tiro: reciclagem',
      'Primeiros socorros: atualização',
      'Ética e relações profissionais',
    ],
    certification:
      'Certificado de Atualização de Vigilante Patrimonial, válido para fins de reciclagem e manutenção da habilitação profissional.',
    faqs: [
      {
        q: 'Quando iniciam as turmas?',
        a: 'As turmas têm início às segundas-feiras, no formato 12x36, com dias alternados. Confirme a próxima data disponível pelo WhatsApp.',
      },
      {
        q: 'Qual o horário das aulas?',
        a: 'Das 08:00 às 17:20, apenas no período diurno.',
      },
      {
        q: 'Qual é o valor do curso?',
        a: 'R$ 500,00 à vista ou R$ 550,00 no cartão de crédito em até 4x.',
      },
      {
        q: 'O material didático está incluso?',
        a: 'A apostila em PDF está inclusa. A apostila física pode ser adquirida por R$ 45,00.',
      },
      ...FAQ_EXAMES,
      ...FAQ_ALOJAMENTO,
      ...FAQ_CERTIDOES,
    ],
    is_available: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. APERFEIÇOAMENTO EM ESCOLTA / TRANSPORTE DE VALORES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: '3',
    slug: 'aperfeicoamento-escolta-transporte-de-valores',
    title: 'Aperfeiçoamento e Atualização em Escolta e/ou Transporte de Numerário, Bens ou Valores',
    category: 'Aperfeiçoamento',
    shortDescription: 'Capacitação para atuação em escolta armada e transporte de valores. 5 dias presenciais, diurno. Próximas turmas: 10/08, 24/08, 07/09.',
    price: 800,
    installments: 6,
    installmentValue: 141.67,
    image: 'https://images.pexels.com/photos/28288101/pexels-photo-28288101.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Veículo blindado de transporte de valores',
    workload: '40 horas',
    modality: 'Presencial',
    requirements: [
      'Curso de formação de vigilante homologado',
      'Identidade ou CNH válida',
      'CPF',
      'Histórico escolar — mínimo 8ª série completo',
      'Certificado de reservista ou dispensa (para homens, conforme regras informadas)',
      'Comprovante de endereço atual',
      ...CERTIDOES_EXIGIDAS,
    ],
    description:
      'Curso de aperfeiçoamento e atualização destinado a profissionais que atuam ou desejam atuar em escolta armada e transporte de numerário, bens ou valores. Com 5 dias consecutivos de aulas presenciais no período diurno, o curso prepara o vigilante para os desafios operacionais, táticos e legais desta especialidade.',
    objectives: [
      'Aperfeiçoar procedimentos operacionais de escolta armada',
      'Dominar protocolos de transporte de valores',
      'Atualizar técnicas de gestão de risco e planejamento de rotas',
      'Revisar legislação aplicada ao transporte de valores',
      'Desenvolver respostas eficazes a incidentes e emergências',
    ],
    syllabus: [
      'Legislação aplicada ao transporte de valores',
      'Procedimentos operacionais de escolta',
      'Planejamento e gestão de rotas',
      'Armamento e munição: reciclagem',
      'Técnicas táticas em situações de risco',
      'Resposta a incidentes e gestão de crises',
      'Comunicação e coordenação de equipe',
    ],
    certification:
      'Certificado de Aperfeiçoamento e Atualização em Escolta e/ou Transporte de Numerário, Bens ou Valores.',
    faqs: [
      {
        q: 'Quais são as próximas turmas?',
        a: 'Turmas previstas: 10/08, 24/08, 07/09, 21/09, 12/10 e 26/10. Confirme disponibilidade pelo WhatsApp.',
      },
      {
        q: 'Qual é o valor do curso?',
        a: 'R$ 800,00 à vista ou R$ 850,00 no cartão de crédito em até 6x.',
      },
      {
        q: 'O material didático está incluso?',
        a: 'A apostila em PDF está inclusa. A apostila física pode ser adquirida por R$ 35,00.',
      },
      ...FAQ_EXAMES,
      ...FAQ_ALOJAMENTO,
      ...FAQ_CERTIDOES,
    ],
    is_available: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. EXTENSÃO EM SEGURANÇA PARA GRANDES EVENTOS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: '4',
    slug: 'extensao-seguranca-grandes-eventos',
    title: 'Curso de Extensão em Segurança para Eventos Sociais / Grandes Eventos',
    category: 'Aperfeiçoamento',
    shortDescription: 'Capacitação para atuação em segurança de eventos sociais e grandes eventos. 5 dias presenciais, diurno. Consulte próximas turmas.',
    price: 500,
    installments: 3,
    installmentValue: 183.33,
    image: 'https://images.pexels.com/photos/9275222/pexels-photo-9275222.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Profissional de segurança em evento com grande público',
    workload: '40 horas',
    modality: 'Presencial',
    requirements: [
      '1 foto 3x4',
      'Identidade ou CNH válida',
      'CPF',
      'Histórico escolar — mínimo 8ª série completo',
      'Certificado de reservista ou dispensa (para homens, conforme regras informadas)',
      'Comprovante de endereço atual',
      'Certificado de curso de vigilante homologado',
      ...CERTIDOES_EXIGIDAS,
    ],
    description:
      'Curso de extensão voltado para vigilantes que desejam se especializar na segurança de eventos sociais e grandes eventos. Em 5 dias de formação presencial diurna, o aluno aprende técnicas específicas para controle de acesso, gestão de multidões, prevenção de incidentes e coordenação de equipes em ambientes de grande circulação de pessoas.',
    objectives: [
      'Capacitar para atuação em segurança de eventos sociais e grandes eventos',
      'Desenvolver técnicas de controle de acesso e gestão de multidões',
      'Aplicar protocolos de prevenção e resposta a incidentes em eventos',
      'Aperfeiçoar comunicação e coordenação de equipe em campo',
    ],
    syllabus: [
      'Legislação aplicada à segurança em eventos',
      'Controle de acesso e credenciamento',
      'Gestão e dispersão de multidões',
      'Prevenção e resposta a incidentes',
      'Comunicação operacional em eventos',
      'Coordenação com forças de segurança pública',
      'Primeiros socorros em eventos de massa',
    ],
    certification:
      'Certificado de Extensão em Segurança para Eventos Sociais / Grandes Eventos.',
    faqs: [
      {
        q: 'Quando são as próximas turmas?',
        a: 'As datas das próximas turmas estão a confirmar. Entre em contato pelo WhatsApp para verificar a agenda atualizada.',
      },
      {
        q: 'Qual é o valor do curso?',
        a: 'R$ 500,00 à vista ou R$ 550,00 no cartão de crédito em até 3x.',
      },
      {
        q: 'O material didático está incluso?',
        a: 'A apostila em PDF está inclusa. A apostila física pode ser adquirida por R$ 25,00.',
      },
      ...FAQ_EXAMES,
      ...FAQ_ALOJAMENTO,
      ...FAQ_CERTIDOES,
    ],
    is_available: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. APERFEIÇOAMENTO EM SEGURANÇA V.I.P.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: '5',
    slug: 'aperfeicoamento-seguranca-vip',
    title: 'Aperfeiçoamento e Atualização em Segurança V.I.P. — Segurança Pessoal Privado',
    category: 'Aperfeiçoamento',
    shortDescription: 'Especialização em segurança pessoal privada e proteção de VIPs. 5 dias presenciais, diurno. Próximas turmas: 10/08, 24/08, 07/09.',
    price: 1500,
    installments: 6,
    installmentValue: 300,
    image: 'https://images.pexels.com/photos/8425052/pexels-photo-8425052.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Profissional de segurança pessoal acompanhando cliente',
    workload: '40 horas',
    modality: 'Presencial',
    requirements: [
      'Curso de vigilante homologado',
      'Identidade ou CNH válida',
      'CPF',
      'Histórico escolar — mínimo 8ª série completo',
      'Comprovante de escolaridade mínimo de 5º ano completo',
      'Certificado de reservista ou dispensa (para homens, conforme regras informadas)',
      'Comprovante de endereço atual',
      ...CERTIDOES_EXIGIDAS,
    ],
    description:
      'Curso de aperfeiçoamento e atualização para vigilantes que desejam se especializar na área de Segurança Pessoal Privada — proteção de VIPs e pessoas de alto risco. O curso combina teoria e prática em 5 dias consecutivos de formação presencial diurna, abordando técnicas táticas, protocolos de escolta, leitura de ambiente e coordenação de equipe.',
    objectives: [
      'Especializar o vigilante para atuação em segurança pessoal privada',
      'Desenvolver técnicas de proteção executiva e escolta de VIPs',
      'Aplicar protocolos de varredura, posicionamento e cobertura',
      'Aperfeiçoar tomada de decisão em situações de alto risco',
      'Atualizar conhecimentos táticos e de armamento para a especialidade',
    ],
    syllabus: [
      'Fundamentos da segurança pessoal privada',
      'Legislação aplicada à proteção de VIPs',
      'Técnicas de escolta e posicionamento tático',
      'Varredura e análise de ambiente',
      'Condução defensiva e evasiva',
      'Armamento e tiro para segurança pessoal',
      'Comunicação e coordenação de equipe de proteção',
      'Gestão de crises e resposta a incidentes',
    ],
    certification:
      'Certificado de Aperfeiçoamento e Atualização em Segurança V.I.P. — Segurança Pessoal Privado.',
    faqs: [
      {
        q: 'Quais são as próximas turmas?',
        a: 'Turmas previstas: 10/08, 24/08, 07/09, 21/09, 12/10 e 26/10. Confirme disponibilidade pelo WhatsApp.',
      },
      {
        q: 'Qual é o valor do curso?',
        a: 'R$ 1.500,00 à vista ou R$ 1.800,00 no cartão de crédito em até 6x de R$ 300,00.',
      },
      {
        q: 'O material didático está incluso?',
        a: 'A apostila em PDF está inclusa. A apostila física pode ser adquirida por R$ 35,00.',
      },
      ...FAQ_EXAMES,
      ...FAQ_ALOJAMENTO,
      ...FAQ_CERTIDOES,
    ],
    is_available: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. EXTENSÃO SUPERVISOR DE VIGILANTE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: '6',
    slug: 'extensao-supervisor-de-vigilante',
    title: 'Extensão Supervisor de Vigilante',
    category: 'Aperfeiçoamento',
    shortDescription: 'Formação para supervisores de operações de segurança. Turmas diurnas, noturnas e fins de semana. Próxima turma: 17/08/2026.',
    price: 1100,
    installments: 6,
    installmentValue: 191.67,
    image: 'https://images.pexels.com/photos/11783119/pexels-photo-11783119.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Supervisor de segurança em sala de controle operacional',
    workload: '48 horas',
    modality: 'Presencial',
    requirements: [
      '1 foto 3x4',
      'Identidade ou CNH válida',
      'CPF',
      'Certificado de reservista ou dispensa (para homens, conforme regras informadas)',
      'Comprovante de endereço atual',
      'Certificado do curso de formação de vigilante',
      'Comprovação de no mínimo 2 anos de atuação como vigilante (registro em carteira)',
      ...CERTIDOES_EXIGIDAS,
    ],
    description:
      'Curso de extensão voltado para vigilantes experientes que desejam assumir posições de supervisão operacional em empresas de segurança privada. Oferecido em três modalidades — diurna, noturna e fins de semana — para adequar à rotina profissional de cada aluno. É exigida comprovação de no mínimo 2 anos de atuação como vigilante.',
    objectives: [
      'Capacitar vigilantes experientes para posições de supervisão operacional',
      'Desenvolver habilidades de liderança, gestão de equipes e escalas',
      'Dominar procedimentos de supervisão, ronda e relatórios operacionais',
      'Aperfeiçoar comunicação, resolução de conflitos e tomada de decisão',
      'Compreender responsabilidades legais e técnicas do cargo de supervisor',
    ],
    syllabus: [
      'Fundamentos de liderança em segurança privada',
      'Gestão de equipes e escalas operacionais',
      'Procedimentos de supervisão e ronda',
      'Comunicação eficaz e elaboração de relatórios',
      'Resolução de conflitos e tomada de decisão',
      'Responsabilidades legais do supervisor',
      'Gestão de crises e coordenação com autoridades',
    ],
    certification:
      'Certificado de Extensão Supervisor de Vigilante, habilitando o profissional para exercer função de supervisão em empresas de segurança privada.',
    faqs: [
      {
        q: 'Quais modalidades estão disponíveis?',
        a: 'Diurno: 6 dias, das 08:00 às 17:20. Noturno: 12 noites, das 18:30 às 22:50. Fins de semana: 6 finais de semana, das 08:00 às 17:20.',
      },
      {
        q: 'Quais são as próximas turmas?',
        a: '17/08/2026 — início das turmas diurna e noturna. 22/08/2026 — início da turma de fins de semana.',
      },
      {
        q: 'Qual é o valor do curso?',
        a: 'R$ 1.100,00 à vista ou R$ 1.150,00 no cartão de crédito em até 6x.',
      },
      {
        q: 'É necessário ter experiência prévia como vigilante?',
        a: 'Sim. É exigida comprovação de no mínimo 2 anos de atuação como vigilante, com registro em carteira de trabalho.',
      },
      {
        q: 'O material didático está incluso?',
        a: 'A apostila em PDF está inclusa. A apostila física pode ser adquirida por R$ 35,00.',
      },
      ...FAQ_EXAMES,
      ...FAQ_ALOJAMENTO,
      ...FAQ_CERTIDOES,
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
  { label: 'Cursos disponíveis', value: 6, suffix: '' },
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
