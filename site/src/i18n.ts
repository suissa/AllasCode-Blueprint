import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  'pt-BR': {
    translation: {
      nav: {
        overview: 'Visão Geral', architecture: 'Arquitetura', resources: 'Recursos', modules: 'Módulos', docs: 'Docs', community: 'Comunidade', start: 'Comece Agora', openMenu: 'Abrir menu', language: 'Idioma',
      },
      hero: {
        title: 'AllasCode', headline: 'O framework fullstack para sistemas digitais inteligentes e auto-recuperáveis.',
        description: 'Desenvolva sistemas orientados à intenção, governados por semântica, auto-curáveis por design e preparados para operar com agentes, grafos e eventos.',
        start: 'Comece Agora', github: 'Ver no GitHub', intent: 'Intent Driven', healing: 'Self-Healing', runtime: 'Semantic Runtime', allAsCode: 'All as Code', logoAlt: 'Logo AllasCode',
      },
      vision: {
        eyebrow: 'Visão', title: 'Construído para a próxima geração de software',
        description: 'AllasCode une agentes, grafos semânticos, árvores de comportamento, mensageria e evidências para entregar sistemas resilientes, observáveis e escaláveis.',
      },
      features: {
        semantic: { title: 'Semantic as Code', text: 'Tudo é código e semântica: regras, intenções, comportamentos e validações declaradas.' },
        intent: { title: 'Intent Driven', text: 'Desenvolva a partir da intenção de negócio até a execução, sem perder contexto.' },
        healing: { title: 'Self-Healing by Design', text: 'Falhas entram em healing explícito com evidências, correções e governança.' },
        harness: { title: 'Agent Harness', text: 'Execução governada de agentes com contratos, isolamento de contexto e observabilidade.' },
        polyglot: { title: 'Polyglot & Best-of-Breed', text: 'Cada camada pode usar a tecnologia mais adequada para sua responsabilidade.' },
        observability: { title: 'Observability Adaptive', text: 'Telemetria que negocia o nível de evidência exigido pelo contexto.' },
      },
      architecture: {
        title: 'Arquitetura em Camadas', description: 'Cada camada com sua responsabilidade. Todas conectadas por intenção, contratos e eventos.',
        interface: { name: 'Interface', text: 'Web, Mobile, WhatsApp e outros canais.' },
        agents: { name: 'Agents', text: 'Agentes semânticos que orquestram intenção e contexto.' },
        runtime: { name: 'Runtime', text: 'Eventos, healing, governance, proofs e execução.' },
        data: { name: 'Data', text: 'SQL, NoSQL, grafos, vetores, logs e eventos.' },
        infra: { name: 'Infra & Edge', text: 'Mensageria, segurança, edge wall e deploy.' },
      },
      modules: {
        title: 'Módulos do Framework', description: 'Domínios prontos para acelerar sistemas comerciais e arquiteturas agentic.',
        purchase: 'Compras', sales: 'Vendas', inventory: 'Estoque', financial: 'Financeiro', customers: 'Clientes', suppliers: 'Fornecedores', fiscal: 'Fiscal', accounting: 'Contábil', marketing: 'Marketing', communication: 'Comunicação', auth: 'Auth', harness: 'Harness',
      },
      docs: {
        why: 'Por que AllasCode?', example: 'Exemplo: intenção em 2flow DSL', ready: 'Pronto para começar?',
        readyText: 'Clone, configure e execute. Em minutos você terá um sistema rodando com semântica, agentes e intenção de ponta a ponta.', quickStart: 'Guia de Início Rápido',
        reasons: {
          healing: 'Não retornamos erro silencioso: falhas entram em healing.', immutable: 'Eventos imutáveis e estado reconstruível.', idempotency: 'Idempotência por design.', zeroTrust: 'Segurança Zero Trust declarada.', observability: 'Observabilidade fala a linguagem do negócio.', smallBusiness: 'Adequado para micro e pequenas empresas.',
        },
      },
      footer: { community: 'Comunidade', roadmap: 'Roadmap' },
    },
  },
  en: {
    translation: {
      nav: {
        overview: 'Overview', architecture: 'Architecture', resources: 'Features', modules: 'Modules', docs: 'Docs', community: 'Community', start: 'Get Started', openMenu: 'Open menu', language: 'Language',
      },
      hero: {
        title: 'AllasCode', headline: 'The full-stack framework for intelligent, self-healing digital systems.',
        description: 'Build intent-driven systems governed by semantics, self-healing by design, and ready to operate with agents, graphs, and events.',
        start: 'Get Started', github: 'View on GitHub', intent: 'Intent Driven', healing: 'Self-Healing', runtime: 'Semantic Runtime', allAsCode: 'All as Code', logoAlt: 'AllasCode logo',
      },
      vision: {
        eyebrow: 'Vision', title: 'Built for the next generation of software',
        description: 'AllasCode combines agents, semantic graphs, behavior trees, messaging, and evidence to deliver resilient, observable, and scalable systems.',
      },
      features: {
        semantic: { title: 'Semantic as Code', text: 'Everything is code and semantics: rules, intents, behaviors, and declared validations.' },
        intent: { title: 'Intent Driven', text: 'Develop from business intent to execution without losing context.' },
        healing: { title: 'Self-Healing by Design', text: 'Failures enter explicit healing with evidence, corrections, and governance.' },
        harness: { title: 'Agent Harness', text: 'Governed agent execution with contracts, context isolation, and observability.' },
        polyglot: { title: 'Polyglot & Best-of-Breed', text: 'Each layer can use the technology that best fits its responsibility.' },
        observability: { title: 'Observability Adaptive', text: 'Telemetry negotiates the level of evidence required by the current context.' },
      },
      architecture: {
        title: 'Layered Architecture', description: 'Each layer has one responsibility. All are connected by intent, contracts, and events.',
        interface: { name: 'Interface', text: 'Web, Mobile, WhatsApp, and other channels.' },
        agents: { name: 'Agents', text: 'Semantic agents orchestrating intent and context.' },
        runtime: { name: 'Runtime', text: 'Events, healing, governance, proofs, and execution.' },
        data: { name: 'Data', text: 'SQL, NoSQL, graphs, vectors, logs, and events.' },
        infra: { name: 'Infra & Edge', text: 'Messaging, security, edge wall, and deployment.' },
      },
      modules: {
        title: 'Framework Modules', description: 'Ready-made domains to accelerate commercial systems and agentic architectures.',
        purchase: 'Purchases', sales: 'Sales', inventory: 'Inventory', financial: 'Financial', customers: 'Customers', suppliers: 'Suppliers', fiscal: 'Fiscal', accounting: 'Accounting', marketing: 'Marketing', communication: 'Communication', auth: 'Auth', harness: 'Harness',
      },
      docs: {
        why: 'Why AllasCode?', example: 'Example: intent in 2flow DSL', ready: 'Ready to get started?',
        readyText: 'Clone, configure, and run. In minutes you will have a system powered by semantics, agents, and end-to-end intent.', quickStart: 'Quick Start Guide',
        reasons: {
          healing: 'No silent failures: errors enter healing.', immutable: 'Immutable events and rebuildable state.', idempotency: 'Idempotency by design.', zeroTrust: 'Declared Zero Trust security.', observability: 'Observability speaks the language of the business.', smallBusiness: 'Suitable for micro and small businesses.',
        },
      },
      footer: { community: 'Community', roadmap: 'Roadmap' },
    },
  },
} as const

const stored = typeof window !== 'undefined' ? window.localStorage.getItem('allascode-language') : null
const browserLanguage = typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
const initialLanguage = stored === 'pt-BR' || stored === 'en' ? stored : browserLanguage

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (language) => {
  const normalized = language.startsWith('pt') ? 'pt-BR' : 'en'
  if (typeof window !== 'undefined') window.localStorage.setItem('allascode-language', normalized)
  if (typeof document !== 'undefined') document.documentElement.lang = normalized
})

if (typeof document !== 'undefined') document.documentElement.lang = initialLanguage

export default i18n
