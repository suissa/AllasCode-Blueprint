import { useState } from 'react'
import {
  FiActivity,
  FiArrowRight,
  FiBook,
  FiBookOpen,
  FiBox,
  FiCloud,
  FiCode,
  FiCpu,
  FiDatabase,
  FiGithub,
  FiGlobe,
  FiHeart,
  FiLayers,
  FiLinkedin,
  FiLock,
  FiMenu,
  FiMessageCircle,
  FiMonitor,
  FiPlayCircle,
  FiServer,
  FiShield,
  FiShoppingCart,
  FiStar,
  FiUsers,
  FiX,
  FiYoutube,
  FiZap,
} from 'react-icons/fi'

type SectionLabelProps = { number: string; code: string }

const navItems = [
  ['Home', '#home'],
  ['Architecture', '#architecture'],
  ['Docs', '#docs'],
  ['Ecosystem', '#ecosystem'],
  ['Use Cases', '#use-cases'],
  ['Blog', '#blog'],
  ['Community', '#community'],
] as const

const principles = [
  { icon: FiCpu, title: 'Intent-Driven', text: 'Model your business as intents, not just APIs.' },
  { icon: FiShield, title: 'Self-Healing', text: 'Built-in healing loop that learns errors into learning.' },
  { icon: FiLock, title: 'Zero-Trust', text: 'Passwordless, mTLS, DPoP, PQC and beyond.' },
  { icon: FiCode, title: 'All as Code', text: 'Every aspect — type, rules, flows, policies, proofs.' },
  { icon: FiActivity, title: 'Event-First', text: 'Linear events, immutable logs, perfect for agents.' },
  { icon: FiBox, title: 'Polyglot by Design', text: 'Leverage the best language for each concern.' },
]

const stack = [
  { icon: FiMonitor, title: 'UI', tech: 'TypeScript', tone: 'blue' },
  { icon: FiLayers, title: 'Type', tech: 'Haskell', tone: 'violet' },
  { icon: FiCode, title: 'Formal', tech: 'Prolog', tone: 'cyan' },
  { icon: FiCpu, title: 'AI Local', tech: 'Mojo / Python', tone: 'blue' },
  { icon: FiZap, title: 'Effects', tech: 'Koka', tone: 'cyan' },
  { icon: FiServer, title: 'Runtime', tech: 'Austral', tone: 'blue' },
  { icon: FiUsers, title: 'Actors', tech: 'Gleam', tone: 'violet' },
  { icon: FiBox, title: 'Media', tech: 'Zig', tone: 'amber' },
  { icon: FiShield, title: 'Crypto', tech: 'Rust', tone: 'cyan' },
  { icon: FiCloud, title: 'Gateway', tech: 'Go', tone: 'green' },
]

const dataLayer = [
  ['PostgreSQL', 'Transactional'],
  ['MongoDB', 'Read Model'],
  ['Redis', 'Cache'],
  ['Qdrant', 'Vector'],
  ['Neo4j', 'Graph'],
  ['ClickHouse', 'Logs'],
  ['EventStoreDB', 'Events'],
  ['NATS / Kafka', 'Messaging'],
  ['Tempo', 'Tracing'],
  ['Meilisearch', 'Search'],
] as const

const capabilities = [
  { icon: FiShield, title: 'Extreme Zero-Trust', text: 'Quantum-safe, passwordless and ephemeral security from end to end.' },
  { icon: FiZap, title: 'Intent-Based Healing', text: 'Never return an error. Every failure is a chance to heal and improve.' },
  { icon: FiActivity, title: 'Adaptive Observability', text: 'Human-in-the-loop observability that adapts to your intent and context.' },
  { icon: FiBox, title: 'Semantic as Code', text: 'Formal semantics, invariants and proofs versioned and machine-checked.' },
  { icon: FiGlobe, title: 'H2A2H Ecosystem', text: 'Human ↔ Agent ↔ Agent ↔ Human. A universal layer for digital collaboration.' },
  { icon: FiCloud, title: 'Offline-First Ready', text: 'Works anywhere. Syncs when it can. Operates when it must.' },
]

const useCases = [
  { icon: FiGlobe, title: 'Smart Cities', text: 'Digital public services with AI agents.', className: 'city' },
  { icon: FiHeart, title: 'Healthcare', text: 'Human-centered healthcare agents.', className: 'health' },
  { icon: FiShoppingCart, title: 'Digital Commerce', text: 'Intent-based commerce and financial agents.', className: 'commerce' },
  { icon: FiBookOpen, title: 'Education', text: 'The next generation of learning with AI.', className: 'education' },
]

const stats = [
  { icon: FiCode, value: '50+', label: 'Repositories' },
  { icon: FiUsers, value: '1.2k+', label: 'Developers' },
  { icon: FiStar, value: '200+', label: 'Contributors' },
  { icon: FiBox, value: '15+', label: 'Languages' },
  { icon: FiBook, value: '100+', label: 'Docs & RFCs' },
]

function SectionLabel({ number, code }: SectionLabelProps) {
  return (
    <aside className="section-label" aria-hidden="true">
      <span>{number}</span>
      <small>{code}</small>
    </aside>
  )
}

function Brand() {
  return (
    <a className="brand" href="#home" aria-label="AllasCode home">
      <img src="/allascode-logo.svg" alt="" />
      <strong>Allas<span>Code</span></strong>
    </a>
  )
}

function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="topbar">
      <div className="page-shell topbar-inner">
        <Brand />
        <nav className={`main-nav ${open ? 'open' : ''}`}>
          {navItems.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
        </nav>
        <a className="button button-primary header-cta" href="#docs">Get Started</a>
        <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <div className="site">
      <Header />
      <main>
        <section id="home" className="hero section-border">
          <div className="page-shell indexed-section hero-indexed">
            <SectionLabel number="01" code="HERO" />
            <div className="hero-content">
              <div className="hero-copy">
                <p className="eyebrow">Semantic as Code. Intent as Engine.</p>
                <h1>All as Code.<br /><span>Intent</span> into Reality.</h1>
                <p className="lead">AllasCode is a FullAgenticStack framework that unifies semantics, types, proofs, effects and runtime into a single intent-driven architecture.</p>
                <div className="hero-actions">
                  <a className="button button-primary" href="#architecture"><FiArrowRight /> Explore the Architecture</a>
                  <a className="button button-secondary" href="#docs"><FiPlayCircle /> Watch the Video</a>
                </div>
              </div>

              <div className="hero-visual" aria-hidden="true">
                <div className="hero-rays" />
                <div className="hero-logo-glow" />
                <img src="/allascode-logo.svg" alt="" className="hero-logo" />
                <div className="earth"><span /></div>
                <p>Build a safer<br />agentic future</p>
              </div>

              <div className="hero-principles">
                <span><FiCode /> All as Code</span>
                <span><FiShield /> Zero-Trust by Design</span>
                <span><FiLock /> Proven by Proofs</span>
                <span><FiZap /> Runtime Deterministic</span>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="section-block section-border">
          <div className="page-shell indexed-section">
            <SectionLabel number="02" code="WHAT" />
            <div className="about-grid">
              <div className="section-copy">
                <p className="eyebrow">What is AllasCode?</p>
                <h2>The Operating System<br />for <span>Agentic</span> Applications</h2>
                <p>AllasCode brings formal methods, event-driven runtime and self-healing intelligence together, so your agents understand, decide and act with safety and certainty.</p>
                <a className="button button-primary compact" href="#architecture">Learn More <FiArrowRight /></a>
              </div>
              <div className="principle-grid">
                {principles.map(({ icon: Icon, title, text }) => (
                  <article className="feature-card" key={title}>
                    <Icon />
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="architecture" className="section-block section-border">
          <div className="page-shell indexed-section">
            <SectionLabel number="03" code="ARCH" />
            <div>
              <div className="section-heading row-heading">
                <div>
                  <p className="eyebrow">FullAgenticStack Architecture</p>
                  <h2>A Stack for <span>Every</span> Concern</h2>
                  <p>A modular, type-safe, event-driven architecture. Each layer optimized with the best language and tool for the job.</p>
                </div>
                <a className="button button-outline" href="#docs">View Full Architecture <FiArrowRight /></a>
              </div>
              <div className="stack-grid">
                {stack.map(({ icon: Icon, title, tech, tone }, index) => (
                  <div className={`stack-item ${tone}`} key={title}>
                    <div className="stack-icon"><Icon /></div>
                    {index < stack.length - 1 && <span className="stack-arrow">→</span>}
                    <strong>{title}</strong>
                    <small>{tech}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="data" className="section-block section-border">
          <div className="page-shell indexed-section">
            <SectionLabel number="04" code="DATA" />
            <div>
              <div className="section-heading row-heading">
                <div>
                  <p className="eyebrow">Data & Knowledge Layer</p>
                  <h2>Ready for Real Systems</h2>
                  <p>From transactional to analytical, AllasCode supports a complete data ecosystem, with freedom to choose and evolve.</p>
                </div>
                <a className="button button-outline" href="#docs">Explore Data Plane <FiArrowRight /></a>
              </div>
              <div className="data-grid">
                {dataLayer.map(([name, role]) => (
                  <div className="data-chip" key={name}>
                    <FiDatabase />
                    <strong>{name}</strong>
                    <small>{role}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="capabilities" className="section-block section-border">
          <div className="page-shell indexed-section">
            <SectionLabel number="05" code="CAPA" />
            <div>
              <div className="section-heading row-heading">
                <div>
                  <p className="eyebrow">Built-in Capabilities</p>
                  <h2>More than a <span>Framework</span></h2>
                  <p>AllasCode comes with everything you need to build, run and scale real agentic applications.</p>
                </div>
                <a className="button button-outline" href="#docs">See All Capabilities <FiArrowRight /></a>
              </div>
              <div className="capability-grid">
                {capabilities.map(({ icon: Icon, title, text }) => (
                  <article className="capability" key={title}>
                    <Icon />
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="use-cases" className="section-block section-border">
          <div className="page-shell indexed-section">
            <SectionLabel number="06" code="USE" />
            <div>
              <div className="section-heading">
                <p className="eyebrow">Use Cases</p>
                <h2>Real Impact. Different Domains.</h2>
                <p>From startups to cities, AllasCode powers solutions in multiple domains.</p>
              </div>
              <div className="usecase-grid">
                {useCases.map(({ icon: Icon, title, text, className }) => (
                  <article className={`usecase-card ${className}`} key={title}>
                    <div className="usecase-overlay" />
                    <div className="usecase-content">
                      <Icon />
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="ecosystem" className="section-block section-border">
          <div className="page-shell indexed-section">
            <SectionLabel number="07" code="ECO" />
            <div>
              <div className="section-heading row-heading">
                <div>
                  <p className="eyebrow">The Ecosystem</p>
                  <h2>A Growing Open Ecosystem</h2>
                  <p>Open source, community driven, built for builders, by builders.</p>
                </div>
                <a className="button button-outline" href="#community">Join the Community <FiArrowRight /></a>
              </div>
              <div className="stats-grid">
                {stats.map(({ icon: Icon, value, label }) => (
                  <div className="stat" key={label}>
                    <Icon />
                    <div><strong>{value}</strong><span>{label}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="docs" className="section-block section-border cta-section">
          <div className="page-shell indexed-section">
            <SectionLabel number="08" code="CTA" />
            <div className="cta-panel">
              <div className="cta-copy">
                <p className="eyebrow">Ready to build?</p>
                <h2>Build the Future with AllasCode</h2>
                <p>Join a community that believes in open, safe and human-centered AI.</p>
                <div className="hero-actions">
                  <a className="button button-primary" href="https://github.com/suissa/AllasCode-Blueprint" target="_blank" rel="noreferrer">Get Started <FiArrowRight /></a>
                  <a className="button button-secondary" href="#community"><FiMessageCircle /> Join Discord</a>
                </div>
              </div>
              <div className="cta-planet" aria-hidden="true">
                <img src="/allascode-logo.svg" alt="" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="community" className="footer">
        <div className="page-shell footer-grid">
          <div className="footer-brand">
            <Brand />
            <p>All as Code. Intent into Reality.</p>
            <div className="socials">
              <a href="https://github.com/suissa/AllasCode-Blueprint" aria-label="GitHub"><FiGithub /></a>
              <a href="#community" aria-label="Discord"><FiMessageCircle /></a>
              <a href="#community" aria-label="YouTube"><FiYoutube /></a>
              <a href="#community" aria-label="LinkedIn"><FiLinkedin /></a>
            </div>
          </div>
          <div><h4>Explore</h4><a href="#architecture">Architecture</a><a href="#docs">Documentation</a><a href="#use-cases">Use Cases</a><a href="#ecosystem">Ecosystem</a></div>
          <div><h4>Resources</h4><a id="blog" href="#blog">Blog</a><a href="#docs">Research</a><a href="#docs">Whitepapers</a><a href="#ecosystem">Roadmap</a></div>
          <div><h4>Community</h4><a href="https://github.com/suissa/AllasCode-Blueprint">GitHub</a><a href="#community">Discord</a><a href="#community">Contribute</a><a href="#community">Events</a></div>
          <div className="newsletter"><h4>Stay in the loop</h4><p>Get updates about releases, articles and the ecosystem.</p><div><input aria-label="Email address" placeholder="your@email.com" /><button aria-label="Subscribe"><FiArrowRight /></button></div></div>
        </div>
        <div className="page-shell footer-bottom"><span>© 2026 AllasCode Institute. All rights reserved.</span><span>All as Code. Intent into Reality.</span></div>
      </footer>
    </div>
  )
}
