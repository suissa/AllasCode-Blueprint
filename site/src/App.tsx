import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  FiArrowRight, FiGithub, FiZap, FiDatabase, FiCloud, FiCode, FiCheckCircle,
  FiShoppingCart, FiTag, FiBox, FiDollarSign, FiUsers, FiTruck, FiFileText,
  FiBarChart2, FiMessageCircle, FiLock, FiMenu, FiX, FiCpu,
} from 'react-icons/fi'
import { PiMegaphoneSimple, PiRobot } from 'react-icons/pi'

const nav = [
  ['Visão Geral', '#visao'], ['Arquitetura', '#arquitetura'], ['Recursos', '#recursos'],
  ['Módulos', '#modulos'], ['Docs', '#docs'], ['Comunidade', '#comunidade'],
]

const features = [
  { icon: FiMessageCircle, title: 'Semantic as Code', text: 'Tudo é código e semântica: regras, intenções, comportamentos e validações declaradas.' },
  { icon: FiZap, title: 'Intent Driven', text: 'Desenvolva a partir da intenção de negócio até a execução, sem perder contexto.' },
  { icon: FiCheckCircle, title: 'Self-Healing by Design', text: 'Falhas entram em healing explícito com evidências, correções e governança.' },
  { icon: PiRobot, title: 'Agent Harness', text: 'Execução governada de agentes com contratos, isolamento de contexto e observabilidade.' },
  { icon: FiCpu, title: 'Polyglot & Best-of-Breed', text: 'Cada camada pode usar a tecnologia mais adequada para sua responsabilidade.' },
  { icon: FiBarChart2, title: 'Observability Adaptive', text: 'Telemetria que negocia o nível de evidência exigido pelo contexto.' },
]

const layers = [
  { icon: FiCode, name: 'Interface', text: 'Web, Mobile, WhatsApp e outros canais.', tech: 'TypeScript', border: 'border-violet-500/70' },
  { icon: FiUsers, name: 'Agents', text: 'Agentes semânticos que orquestram intenção e contexto.', tech: 'Gleam / Haskell', border: 'border-blue-500/70' },
  { icon: FiCpu, name: 'Runtime', text: 'Eventos, healing, governance, proofs e execução.', tech: 'Rust / Go / Zig', border: 'border-cyan-400/70' },
  { icon: FiDatabase, name: 'Data', text: 'SQL, NoSQL, grafos, vetores, logs e eventos.', tech: 'Best-of-Breed', border: 'border-emerald-400/70' },
  { icon: FiCloud, name: 'Infra & Edge', text: 'Mensageria, segurança, edge wall e deploy.', tech: 'NATS / eBPF / QUIC', border: 'border-lime-400/70' },
]

const modules = [
  [FiShoppingCart, 'Compras'], [FiTag, 'Vendas'], [FiBox, 'Estoque'], [FiDollarSign, 'Financeiro'],
  [FiUsers, 'Clientes'], [FiTruck, 'Fornecedores'], [FiFileText, 'Fiscal'], [FiBarChart2, 'Contábil'],
  [PiMegaphoneSimple, 'Marketing'], [FiMessageCircle, 'Comunicação'], [FiLock, 'Auth'], [PiRobot, 'Harness'],
] as const

const code = `-> CompraRecebida
->> PurchaseManagerAgent
  ->> ValidarCompraTool
    <- Ok | Error
  ->> EntrarEstoqueTool
    <- Ok | Error
  ->> LancarDespesaTool
    <- Ok | Error
<- CompraRegistrada.Ok
<- CompraRegistrada.Error`

function Header() {
  const [open, setOpen] = useState(false)
  return <header className="sticky top-0 z-50 border-b border-white/5 bg-[#02050b]/80 backdrop-blur-xl">
    <div className="site-shell flex h-20 items-center justify-between">
      <a href="#" className="flex items-center gap-3">
        <img src="/allascode-logo.svg" alt="AllasCode" className="h-11 w-14 object-contain" />
        <span className="font-display text-2xl font-semibold tracking-tight">Allas<span className="bg-gradient-to-r from-cyan-300 to-violet-500 bg-clip-text text-transparent">Code</span></span>
      </a>
      <nav className="hidden items-center gap-7 lg:flex">
        {nav.map(([label, href]) => <a key={href} className="text-sm text-zinc-300 transition hover:text-cyan-300" href={href}>{label}</a>)}
        <a className="text-sm text-zinc-300 transition hover:text-cyan-300" href="https://github.com/suissa/AllasCode-Blueprint" target="_blank">GitHub</a>
      </nav>
      <div className="hidden lg:block"><Button asChild><a href="#docs">Comece Agora</a></Button></div>
      <button className="lg:hidden" onClick={() => setOpen(v => !v)} aria-label="Abrir menu">{open ? <FiX size={24}/> : <FiMenu size={24}/>}</button>
    </div>
    {open && <div className="site-shell animate__animated animate__fadeInDown border-t border-white/5 py-5 lg:hidden">{nav.map(([label, href]) => <a key={href} onClick={() => setOpen(false)} className="block py-3 text-zinc-300" href={href}>{label}</a>)}</div>}
  </header>
}

export default function App() {
  return <div className="overflow-x-hidden">
    <Header />
    <main>
      <section id="visao" className="site-shell grid min-h-[760px] items-center gap-14 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-28">
        <div className="animate__animated animate__fadeInLeft">
          <div className="eyebrow mb-6 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-2">Semantic as Code</div>
          <h1 className="font-display text-6xl font-bold leading-[.95] tracking-[-.055em] sm:text-7xl lg:text-8xl"><span className="gradient-text">AllasCode</span></h1>
          <p className="mt-7 max-w-xl text-2xl font-medium leading-snug text-white">O framework fullstack para sistemas digitais inteligentes e auto-recuperáveis.</p>
          <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">Desenvolva sistemas orientados à intenção, governados por semântica, auto-curáveis por design e preparados para operar com agentes, grafos e eventos.</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button size="lg" asChild><a href="#docs">Comece Agora <FiArrowRight /></a></Button>
            <Button size="lg" variant="outline" asChild><a href="https://github.com/suissa/AllasCode-Blueprint" target="_blank">Ver no GitHub <FiGithub /></a></Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-zinc-300"><span>⚡ Intent Driven</span><span>♡ Self-Healing</span><span>&lt;/&gt; Semantic Runtime</span><span>◫ All as Code</span></div>
        </div>
        <div className="relative flex items-center justify-center animate__animated animate__fadeInRight">
          <div className="absolute h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <img src="/allascode-logo.svg" alt="Logo AllasCode" className="relative z-10 w-full max-w-[570px] drop-shadow-[0_0_45px_rgba(0,198,255,.22)]" />
          <div className="absolute -bottom-8 h-20 w-4/5 rounded-[100%] border border-blue-500/40 bg-blue-500/5 blur-[1px] shadow-[0_0_50px_rgba(0,145,255,.35)]" />
        </div>
      </section>

      <section id="recursos" className="site-shell section-pad border-t border-white/5">
        <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
          <div><div className="eyebrow text-emerald-300">Visão</div><h2 className="mt-5 max-w-lg font-display text-4xl font-semibold tracking-tight md:text-5xl">Construído para a próxima geração de software</h2><p className="mt-6 max-w-xl leading-8 text-zinc-400">AllasCode une agentes, grafos semânticos, árvores de comportamento, mensageria e evidências para entregar sistemas resilientes, observáveis e escaláveis.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{features.map((f) => <Card key={f.title} className="group p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-cyan-400/[.04]"><f.icon className="mb-5 text-3xl text-violet-400 transition group-hover:text-cyan-300"/><h3 className="font-display text-lg font-semibold">{f.title}</h3><p className="mt-3 text-sm leading-6 text-zinc-400">{f.text}</p></Card>)}</div>
        </div>
      </section>

      <section id="arquitetura" className="border-y border-white/5 bg-white/[.012]">
        <div className="site-shell section-pad"><div className="text-center"><h2 className="font-display text-4xl font-semibold">Arquitetura em Camadas</h2><p className="mt-3 text-zinc-400">Cada camada com sua responsabilidade. Todas conectadas por intenção, contratos e eventos.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-5">{layers.map((l) => <Card key={l.name} className={`relative overflow-hidden border ${l.border} p-6 text-center`}><l.icon className="mx-auto text-4xl text-cyan-300"/><h3 className="mt-5 font-display text-xl font-semibold">{l.name}</h3><p className="mt-3 min-h-16 text-sm leading-6 text-zinc-400">{l.text}</p><div className="-mx-6 -mb-6 mt-6 border-t border-white/10 bg-white/[.03] py-3 font-mono text-xs text-zinc-400">{l.tech}</div></Card>)}</div>
        </div>
      </section>

      <section id="modulos" className="site-shell section-pad"><div className="text-center"><h2 className="font-display text-4xl font-semibold">Módulos do Framework</h2><p className="mt-3 text-zinc-400">Domínios prontos para acelerar sistemas comerciais e arquiteturas agentic.</p></div><div className="mt-12 grid grid-cols-3 gap-5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">{modules.map(([Icon, label], i) => <div key={label} className="group text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[.03] transition group-hover:-translate-y-1 group-hover:border-cyan-400/30"><Icon className={`text-2xl ${i % 3 === 0 ? 'text-violet-400' : i % 3 === 1 ? 'text-cyan-300' : 'text-emerald-300'}`}/></div><div className="mt-3 text-xs text-zinc-300">{label}</div></div>)}</div></section>

      <section id="docs" className="border-t border-white/5 bg-gradient-to-b from-transparent to-cyan-950/10"><div className="site-shell section-pad grid gap-8 lg:grid-cols-3">
        <div><h2 className="font-display text-3xl font-semibold">Por que AllasCode?</h2><ul className="mt-6 space-y-4 text-sm text-zinc-300">{['Não retornamos erro silencioso: falhas entram em healing.','Eventos imutáveis e estado reconstruível.','Idempotência por design.','Segurança Zero Trust declarada.','Observabilidade fala a linguagem do negócio.','Adequado para micro e pequenas empresas.'].map(x => <li key={x} className="flex gap-3"><FiCheckCircle className="mt-0.5 shrink-0 text-emerald-400"/>{x}</li>)}</ul></div>
        <Card className="overflow-hidden"><div className="border-b border-white/10 px-5 py-3 font-mono text-xs text-zinc-400">Exemplo: intenção em 2flow DSL</div><pre className="overflow-x-auto p-5 font-mono text-[12px] leading-6 text-cyan-300"><code>{code}</code></pre></Card>
        <div><h2 className="font-display text-3xl font-semibold">Pronto para começar?</h2><p className="mt-5 leading-8 text-zinc-400">Clone, configure e execute. Em minutos você terá um sistema rodando com semântica, agentes e intenção de ponta a ponta.</p><Button className="mt-7" size="lg" asChild><a href="https://github.com/suissa/AllasCode-Blueprint" target="_blank">Guia de Início Rápido <FiArrowRight/></a></Button></div>
      </div></section>
    </main>

    <footer id="comunidade" className="border-t border-white/10 py-10"><div className="site-shell flex flex-col gap-8 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><img src="/allascode-logo.svg" className="h-10 w-12"/><div><div className="font-display text-xl font-semibold">Allas<span className="text-cyan-300">Code</span></div><div className="text-[11px] text-zinc-500">Semantic as Code · Intent Driven · Self-Healing by Design</div></div></div><div className="flex flex-wrap gap-6 text-sm text-zinc-400"><a href="#docs">Docs</a><a href="https://github.com/suissa/AllasCode-Blueprint" target="_blank">GitHub</a><a href="#comunidade">Comunidade</a><a href="#modulos">Roadmap</a></div><div className="text-xs text-zinc-600">© 2026 AllasCode.</div></div></footer>
  </div>
}
