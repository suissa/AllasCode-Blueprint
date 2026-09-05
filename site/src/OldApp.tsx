import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  FiArrowRight, FiGithub, FiZap, FiDatabase, FiCloud, FiCode, FiCheckCircle,
  FiShoppingCart, FiTag, FiBox, FiDollarSign, FiUsers, FiTruck, FiFileText,
  FiBarChart2, FiMessageCircle, FiLock, FiMenu, FiX, FiCpu, FiGlobe,
} from 'react-icons/fi'
import { PiMegaphoneSimple, PiRobot } from 'react-icons/pi'

const nav = [
  ['nav.overview', '#visao'], ['nav.architecture', '#arquitetura'], ['nav.resources', '#recursos'],
  ['nav.modules', '#modulos'], ['nav.docs', '#docs'], ['nav.community', '#comunidade'],
] as const

const features = [
  { icon: FiMessageCircle, key: 'semantic' },
  { icon: FiZap, key: 'intent' },
  { icon: FiCheckCircle, key: 'healing' },
  { icon: PiRobot, key: 'harness' },
  { icon: FiCpu, key: 'polyglot' },
  { icon: FiBarChart2, key: 'observability' },
] as const

const layers = [
  { icon: FiCode, key: 'interface', tech: 'TypeScript', border: 'border-violet-500/70' },
  { icon: FiUsers, key: 'agents', tech: 'Gleam / Haskell', border: 'border-blue-500/70' },
  { icon: FiCpu, key: 'runtime', tech: 'Rust / Go / Zig', border: 'border-cyan-400/70' },
  { icon: FiDatabase, key: 'data', tech: 'Best-of-Breed', border: 'border-emerald-400/70' },
  { icon: FiCloud, key: 'infra', tech: 'NATS / eBPF / QUIC', border: 'border-lime-400/70' },
] as const

const modules = [
  [FiShoppingCart, 'purchase'], [FiTag, 'sales'], [FiBox, 'inventory'], [FiDollarSign, 'financial'],
  [FiUsers, 'customers'], [FiTruck, 'suppliers'], [FiFileText, 'fiscal'], [FiBarChart2, 'accounting'],
  [PiMegaphoneSimple, 'marketing'], [FiMessageCircle, 'communication'], [FiLock, 'auth'], [PiRobot, 'harness'],
] as const

const reasons = ['healing', 'immutable', 'idempotency', 'zeroTrust', 'observability', 'smallBusiness'] as const

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

function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation()
  const current = i18n.language.startsWith('pt') ? 'pt-BR' : 'en'
  const change = (language: 'pt-BR' | 'en') => void i18n.changeLanguage(language)

  return <div className={`flex items-center ${compact ? 'gap-2' : 'gap-1 rounded-xl border border-white/10 bg-white/[.03] p-1'}`} aria-label={t('nav.language')}>
    {!compact && <FiGlobe className="mx-1 text-cyan-300" />}
    <button onClick={() => change('pt-BR')} className={`${compact ? 'rounded-lg border px-3 py-2' : 'rounded-lg px-2.5 py-1.5'} text-xs font-semibold transition ${current === 'pt-BR' ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-transparent text-zinc-400 hover:text-white'}`}>PT</button>
    <button onClick={() => change('en')} className={`${compact ? 'rounded-lg border px-3 py-2' : 'rounded-lg px-2.5 py-1.5'} text-xs font-semibold transition ${current === 'en' ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-transparent text-zinc-400 hover:text-white'}`}>EN</button>
  </div>
}

function Header() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  return <header className="sticky top-0 z-50 border-b border-white/5 bg-[#02050b]/80 backdrop-blur-xl">
    <div className="site-shell flex h-16 items-center justify-between sm:h-20">
      <a href="#" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <img src="/allascode-logo.svg" alt="AllasCode" className="h-9 w-11 shrink-0 object-contain sm:h-11 sm:w-14" />
        <span className="truncate font-display text-xl font-semibold tracking-tight sm:text-2xl">Allas<span className="bg-gradient-to-r from-cyan-300 to-violet-500 bg-clip-text text-transparent">Code</span></span>
      </a>
      <nav className="hidden items-center gap-5 xl:flex">
        {nav.map(([key, href]) => <a key={href} className="text-sm text-zinc-300 transition hover:text-cyan-300" href={href}>{t(key)}</a>)}
        <a className="text-sm text-zinc-300 transition hover:text-cyan-300" href="https://github.com/suissa/AllasCode-Blueprint" target="_blank" rel="noreferrer">GitHub</a>
      </nav>
      <div className="hidden items-center gap-3 xl:flex"><LanguageSwitcher/><Button asChild><a href="#docs">{t('nav.start')}</a></Button></div>
      <button className="rounded-lg border border-white/10 p-2 xl:hidden" onClick={() => setOpen(v => !v)} aria-label={t('nav.openMenu')}>{open ? <FiX size={22}/> : <FiMenu size={22}/>}</button>
    </div>
    {open && <div className="site-shell animate__animated animate__fadeInDown border-t border-white/5 py-4 xl:hidden">
      <div className="grid gap-1 sm:grid-cols-2">{nav.map(([key, href]) => <a key={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-zinc-300 transition hover:bg-white/[.04] hover:text-cyan-300" href={href}>{t(key)}</a>)}</div>
      <div className="mt-4 flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between"><LanguageSwitcher compact/><Button asChild><a href="#docs" onClick={() => setOpen(false)}>{t('nav.start')}</a></Button></div>
    </div>}
  </header>
}

export default function OldApp() {
  const { t } = useTranslation()

  return <div className="overflow-x-hidden">
    <Header />
    <main>
      <section id="visao" className="site-shell grid items-center gap-10 py-14 sm:gap-14 sm:py-20 lg:min-h-[760px] lg:grid-cols-[1.05fr_.95fr] lg:py-28">
        <div className="animate__animated animate__fadeInLeft">
          <div className="eyebrow mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 sm:mb-6">Semantic as Code</div>
          <h1 className="font-display text-5xl font-bold leading-[.95] tracking-[-.055em] sm:text-7xl lg:text-8xl"><span className="gradient-text">{t('hero.title')}</span></h1>
          <p className="mt-6 max-w-xl text-xl font-medium leading-snug text-white sm:mt-7 sm:text-2xl">{t('hero.headline')}</p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:mt-5 sm:text-base sm:leading-8">{t('hero.description')}</p>
          <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:gap-4">
            <Button size="lg" className="w-full sm:w-auto" asChild><a href="#docs">{t('hero.start')} <FiArrowRight /></a></Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild><a href="https://github.com/suissa/AllasCode-Blueprint" target="_blank" rel="noreferrer">{t('hero.github')} <FiGithub /></a></Button>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-zinc-300 sm:mt-10 sm:flex sm:flex-wrap sm:gap-x-7 sm:gap-y-3 sm:text-sm"><span>⚡ {t('hero.intent')}</span><span>♡ {t('hero.healing')}</span><span>&lt;/&gt; {t('hero.runtime')}</span><span>◫ {t('hero.allAsCode')}</span></div>
        </div>
        <div className="relative order-first flex items-center justify-center animate__animated animate__fadeInRight lg:order-none">
          <div className="absolute h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl sm:h-72 sm:w-72" />
          <img src="/allascode-logo.svg" alt={t('hero.logoAlt')} className="relative z-10 w-full max-w-[290px] drop-shadow-[0_0_45px_rgba(0,198,255,.22)] sm:max-w-[430px] lg:max-w-[570px]" />
          <div className="absolute -bottom-4 h-14 w-4/5 rounded-[100%] border border-blue-500/40 bg-blue-500/5 blur-[1px] shadow-[0_0_50px_rgba(0,145,255,.35)] sm:-bottom-8 sm:h-20" />
        </div>
      </section>

      <section id="recursos" className="site-shell section-pad border-t border-white/5">
        <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-12">
          <div><div className="eyebrow text-emerald-300">{t('vision.eyebrow')}</div><h2 className="mt-5 max-w-lg font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">{t('vision.title')}</h2><p className="mt-6 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base sm:leading-8">{t('vision.description')}</p></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{features.map((f) => <Card key={f.key} className="group p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-cyan-400/[.04] sm:p-6"><f.icon className="mb-5 text-3xl text-violet-400 transition group-hover:text-cyan-300"/><h3 className="font-display text-lg font-semibold">{t(`features.${f.key}.title`)}</h3><p className="mt-3 text-sm leading-6 text-zinc-400">{t(`features.${f.key}.text`)}</p></Card>)}</div>
        </div>
      </section>

      <section id="arquitetura" className="border-y border-white/5 bg-white/[.012]">
        <div className="site-shell section-pad"><div className="text-center"><h2 className="font-display text-3xl font-semibold sm:text-4xl">{t('architecture.title')}</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">{t('architecture.description')}</p></div>
          <div className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-2 xl:grid-cols-5">{layers.map((l) => <Card key={l.key} className={`relative overflow-hidden border ${l.border} p-5 text-center sm:p-6`}><l.icon className="mx-auto text-4xl text-cyan-300"/><h3 className="mt-5 font-display text-xl font-semibold">{t(`architecture.${l.key}.name`)}</h3><p className="mt-3 min-h-0 text-sm leading-6 text-zinc-400 xl:min-h-16">{t(`architecture.${l.key}.text`)}</p><div className="-mx-5 -mb-5 mt-6 border-t border-white/10 bg-white/[.03] py-3 font-mono text-xs text-zinc-400 sm:-mx-6 sm:-mb-6">{l.tech}</div></Card>)}</div>
        </div>
      </section>

      <section id="modulos" className="site-shell section-pad"><div className="text-center"><h2 className="font-display text-3xl font-semibold sm:text-4xl">{t('modules.title')}</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">{t('modules.description')}</p></div><div className="mt-10 grid grid-cols-2 gap-4 min-[430px]:grid-cols-3 sm:mt-12 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">{modules.map(([Icon, key], i) => <div key={key} className="group text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[.03] transition group-hover:-translate-y-1 group-hover:border-cyan-400/30"><Icon className={`text-2xl ${i % 3 === 0 ? 'text-violet-400' : i % 3 === 1 ? 'text-cyan-300' : 'text-emerald-300'}`}/></div><div className="mt-3 break-words text-xs text-zinc-300">{t(`modules.${key}`)}</div></div>)}</div></section>

      <section id="docs" className="border-t border-white/5 bg-gradient-to-b from-transparent to-cyan-950/10"><div className="site-shell section-pad grid gap-8 lg:grid-cols-3">
        <div><h2 className="font-display text-2xl font-semibold sm:text-3xl">{t('docs.why')}</h2><ul className="mt-6 space-y-4 text-sm text-zinc-300">{reasons.map(key => <li key={key} className="flex gap-3"><FiCheckCircle className="mt-0.5 shrink-0 text-emerald-400"/>{t(`docs.reasons.${key}`)}</li>)}</ul></div>
        <Card className="min-w-0 overflow-hidden"><div className="border-b border-white/10 px-4 py-3 font-mono text-xs text-zinc-400 sm:px-5">{t('docs.example')}</div><pre className="max-w-full overflow-x-auto p-4 font-mono text-[11px] leading-6 text-cyan-300 sm:p-5 sm:text-[12px]"><code>{code}</code></pre></Card>
        <div><h2 className="font-display text-2xl font-semibold sm:text-3xl">{t('docs.ready')}</h2><p className="mt-5 text-sm leading-7 text-zinc-400 sm:text-base sm:leading-8">{t('docs.readyText')}</p><Button className="mt-7 w-full sm:w-auto" size="lg" asChild><a href="https://github.com/suissa/AllasCode-Blueprint" target="_blank" rel="noreferrer">{t('docs.quickStart')} <FiArrowRight/></a></Button></div>
      </div></section>
    </main>

    <footer id="comunidade" className="border-t border-white/10 py-8 sm:py-10"><div className="site-shell flex flex-col gap-7 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><img src="/allascode-logo.svg" alt="AllasCode" className="h-10 w-12"/><div><div className="font-display text-xl font-semibold">Allas<span className="text-cyan-300">Code</span></div><div className="max-w-[260px] text-[11px] leading-5 text-zinc-500">Semantic as Code · Intent Driven · Self-Healing by Design</div></div></div><div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-400"><a href="#docs">Docs</a><a href="https://github.com/suissa/AllasCode-Blueprint" target="_blank" rel="noreferrer">GitHub</a><a href="#comunidade">{t('footer.community')}</a><a href="#modulos">{t('footer.roadmap')}</a></div><div className="text-xs text-zinc-600">© 2026 AllasCode.</div></div></footer>
  </div>
}
