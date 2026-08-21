'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import {
  CaretDown,
  House,
  InstagramLogo,
  LinkedinLogo,
  List,
  MagnifyingGlass,
  MapPin,
  Pause,
  Play,
  X,
} from '@phosphor-icons/react'

import {
  dropdownVariants,
  fades,
  panelInlineEnd,
  panelItemInlineEnd,
  scrimVariants,
  travel,
} from '@/lib/motion'

import type { WeatherSnapshot } from '@/lib/weather'

import { HeaderStatus } from './HeaderStatus'
import './Header.css'

type SocialItem = {
  label: string
  url: string
  icon: 'linkedin' | 'instagram'
}

type RedeItem = {
  label: string
  href: string
}

type Announcement = {
  text: string
  kicker?: string
  metric?: string
  href?: string
}

type UserSetor =
  'administrador' | 'ti' | 'marketing' | 'ecommerce' | 'relacoes-mercado' | 'editorial'

type HeaderProps = {
  social?: SocialItem[]
  redes?: RedeItem[]
  announcements?: Announcement[]
  announcementIntervalSeconds?: number
  userEmail?: string
  userSetor?: UserSetor
  weather?: WeatherSnapshot | null
}

const DEFAULT_SOCIAL: SocialItem[] = [
  {
    label: 'LinkedIn',
    url: 'https://linkedin.com/company/multiverso-das-letras/',
    icon: 'linkedin',
  },
  { label: 'Instagram', url: 'https://instagram.com/multiversodasletras', icon: 'instagram' },
]

const DEFAULT_ANNOUNCEMENT_INTERVAL_SECONDS = 8

const DEFAULT_REDES: RedeItem[] = [
  { label: 'Home MLetras & Redes Públicas', href: '/redes' },
  { label: 'Santa Catarina', href: '/projetos/santa-catarina' },
  { label: 'Mato Grosso', href: '/projetos/mato-grosso' },
  { label: 'Cuiabá-MT', href: '/projetos/cuiaba-mt' },
  { label: 'Natal-RN', href: '/projetos/natal-rn' },
  { label: 'Tocantins', href: '/projetos/tocantins' },
  { label: 'Amazonas', href: '/projetos/amazonas' },
  { label: 'Araguaína-TO', href: '/projetos/araguaina-to' },
  { label: 'Pará', href: '/projetos/para' },
  { label: 'João Pessoa-PB', href: '/projetos/joao-pessoa-pb' },
  { label: 'Rondônia', href: '/projetos/rondonia' },
  { label: 'Iaçu-BA', href: '/projetos/iacu-ba' },
  { label: 'Brasília-DF', href: '/projetos/brasilia-df' },
]

const SOCIAL_ICONS = {
  linkedin: LinkedinLogo,
  instagram: InstagramLogo,
} as const

const SETOR_LABELS: Record<UserSetor, string> = {
  administrador: 'Administrador',
  ti: 'Equipe de TI',
  marketing: 'Marketing',
  ecommerce: 'Ecommerce',
  'relacoes-mercado': 'Relações com mercado',
  editorial: 'Editorial',
}

const SCROLL_DISTANCE = 80
const SCROLL_HIDE_THRESHOLD = 80
const TAP_SCALE = { scale: 0.94 }
const ACCOUNT_PANEL_ORIGIN = { originX: 1, originY: 0 }

function initialsFromEmail(email: string) {
  const local = email.split('@')[0] ?? ''
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }
  return local.slice(0, 2).toUpperCase()
}

function useDismiss(
  active: boolean,
  ref: RefObject<HTMLElement | null>,
  onDismiss: (fromKeyboard: boolean) => void,
) {
  useEffect(() => {
    if (!active) return

    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss(true)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [active, ref, onDismiss])
}

function AnnounceBody({ current }: { current: Announcement }) {
  return (
    <>
      {current.kicker ? (
        <span className="site-header__announce-kicker">{current.kicker}</span>
      ) : null}
      {current.metric ? (
        <span className="site-header__announce-metric">{current.metric}</span>
      ) : null}
      {current.metric && current.text ? (
        <span className="site-header__announce-sep" aria-hidden="true">
          ·
        </span>
      ) : null}
      <span className="site-header__announce-text">{current.text}</span>
    </>
  )
}

export function Header({
  social = DEFAULT_SOCIAL,
  redes = DEFAULT_REDES,
  announcements = [],
  announcementIntervalSeconds = DEFAULT_ANNOUNCEMENT_INTERVAL_SECONDS,
  userEmail,
  userSetor,
  weather = null,
}: HeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    let response: Response | null = null
    try {
      response = await fetch('/api/users/logout', { method: 'POST' })
    } catch {}
    if (!response?.ok) return
    router.push('/')
    router.refresh()
  }

  const [isOpen, setIsOpen] = useState(false)
  const [isRedesOpen, setIsRedesOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [announceIndex, setAnnounceIndex] = useState(0)
  const [isAnnouncePaused, setIsAnnouncePaused] = useState(false)
  const isAnnouncePausedRef = useRef(false)

  const headerRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const redesRef = useRef<HTMLLIElement>(null)
  const searchRef = useRef<HTMLFormElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchToggleRef = useRef<HTMLButtonElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)
  const accountToggleRef = useRef<HTMLButtonElement>(null)
  const redesTriggerRef = useRef<HTMLButtonElement>(null)
  const isOpenRef = useRef(false)
  const lastY = useRef(0)

  const shouldReduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const rawProgress = useTransform(scrollY, [0, SCROLL_DISTANCE], [0, 1], { clamp: true })
  const progress = useSpring(rawProgress, {
    stiffness: shouldReduceMotion ? 1000 : 700,
    damping: shouldReduceMotion ? 100 : 48,
    mass: 0.2,
  })

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  useMotionValueEvent(progress, 'change', (v) => {
    const header = headerRef.current
    if (!header) return
    header.style.setProperty('--header-progress', String(v))
    header.style.setProperty('--header-progress-pct', `${v * 100}%`)
    header.toggleAttribute('data-collapsed', v > 0.99)
  })

  useMotionValueEvent(scrollY, 'change', (y) => {
    const header = headerRef.current
    if (!header) return

    const hide = !isOpenRef.current && y > SCROLL_HIDE_THRESHOLD && y > lastY.current
    const wasHidden = header.hasAttribute('data-hidden')
    header.toggleAttribute('data-hidden', hide)
    if (hide && !wasHidden) {
      setIsAccountOpen(false)
      setIsSearchOpen(false)
      setIsRedesOpen(false)
    }
    lastY.current = y
  })

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const root = document.documentElement
    const observer = new ResizeObserver(([entry]) => {
      const blockSize = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height
      root.style.setProperty('--offset', `${blockSize}px`)
    })
    observer.observe(header, { box: 'border-box' })

    return () => observer.disconnect()
  }, [])

  const closeRedes = useCallback((fromKeyboard = false) => {
    setIsRedesOpen(false)
    if (fromKeyboard) redesTriggerRef.current?.focus()
  }, [])
  const closeSearch = useCallback((fromKeyboard = false) => {
    setIsSearchOpen(false)
    if (fromKeyboard) searchToggleRef.current?.focus()
  }, [])
  const closeAccount = useCallback((fromKeyboard = false) => {
    setIsAccountOpen(false)
    if (fromKeyboard) accountToggleRef.current?.focus()
  }, [])
  useDismiss(isRedesOpen, redesRef, closeRedes)
  useDismiss(isSearchOpen, searchRef, closeSearch)
  useDismiss(isAccountOpen, accountRef, closeAccount)

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus()
  }, [isSearchOpen])

  useEffect(() => {
    if (announcements.length <= 1 || isAnnouncePaused) return

    const id = window.setInterval(() => {
      if (isAnnouncePausedRef.current) return
      setAnnounceIndex((i) => (i + 1) % announcements.length)
    }, announcementIntervalSeconds * 1000)

    return () => window.clearInterval(id)
  }, [announcements.length, announcementIntervalSeconds, isAnnouncePaused])

  useEffect(() => {
    if (!isOpen) return

    document.body.classList.add('no-scroll')

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
        return
      }

      if (e.key !== 'Tab' || !panelRef.current) return

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled])',
      )
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const closeBtn = panelRef.current?.querySelector<HTMLElement>('.nav-offcanvas__close')
    const focusTimer = window.setTimeout(() => closeBtn?.focus(), 50)

    return () => {
      document.body.classList.remove('no-scroll')
      document.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [isOpen])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 48em)')
    function onChange(e: MediaQueryListEvent) {
      if (e.matches) setIsOpen(false)
    }
    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
  }, [])

  function closeMenu() {
    setIsOpen(false)
    toggleRef.current?.focus()
  }

  const current = announcements[announceIndex % Math.max(announcements.length, 1)]
  const setorLabel = userSetor ? SETOR_LABELS[userSetor] : undefined
  const initials = userEmail ? initialsFromEmail(userEmail) : ''

  const search = (
    <form
      className="site-header__search"
      role="search"
      action="/busca"
      method="get"
      ref={searchRef}
    >
      <motion.button
        type="button"
        ref={searchToggleRef}
        className="site-header__search-toggle"
        aria-expanded={isSearchOpen}
        aria-controls="site-header-search-input"
        aria-label={isSearchOpen ? 'Fechar busca' : 'Abrir busca'}
        whileTap={TAP_SCALE}
        transition={fades.swap}
        onClick={() => {
          setIsSearchOpen((open) => !open)
          setIsAccountOpen(false)
        }}
      >
        <MagnifyingGlass size={16} weight="bold" aria-hidden="true" />
      </motion.button>
      <input
        ref={searchInputRef}
        id="site-header-search-input"
        className="site-header__search-input"
        type="search"
        name="q"
        placeholder="Buscar projetos e setores…"
        aria-label="Buscar projetos e setores"
        aria-hidden={!isSearchOpen}
        tabIndex={isSearchOpen ? 0 : -1}
      />
    </form>
  )

  const account = userEmail ? (
    <div className="site-header__account" ref={accountRef}>
      <motion.button
        type="button"
        ref={accountToggleRef}
        className="site-header__account-toggle"
        aria-expanded={isAccountOpen}
        aria-controls="site-header-account-panel"
        aria-haspopup="menu"
        aria-label={`Conta, ${userEmail}`}
        whileTap={TAP_SCALE}
        transition={fades.swap}
        onClick={() => {
          setIsAccountOpen((open) => !open)
          setIsSearchOpen(false)
        }}
      >
        <span className="site-header__avatar" aria-hidden="true">
          {initials}
        </span>
      </motion.button>
      <AnimatePresence>
        {isAccountOpen ? (
          <motion.div
            key="account-panel"
            id="site-header-account-panel"
            className="site-header__account-panel"
            role="menu"
            aria-label="Conta"
            style={ACCOUNT_PANEL_ORIGIN}
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="site-header__account-stack">
              <p className="site-header__account-email">{userEmail}</p>
              {setorLabel ? <p className="site-header__account-setor">{setorLabel}</p> : null}
              <motion.button
                type="button"
                className="site-header__logout"
                role="menuitem"
                whileTap={TAP_SCALE}
                transition={fades.swap}
                onClick={handleLogout}
              >
                Sair
              </motion.button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  ) : null

  return (
    <MotionConfig reducedMotion="user">
      <a href="#main" className="skip-link">
        Pular para o conteúdo principal
      </a>

      <header className="site-header" role="banner" ref={headerRef}>
        <div className="site-header__top-bar">
          <div className="site-header__top-bar-inner">
            <div className="site-header__brief">
              {announcements.length > 0 && current ? (
                <div
                  className="site-header__announce-slot"
                  role="status"
                  onMouseEnter={() => (isAnnouncePausedRef.current = true)}
                  onMouseLeave={() => (isAnnouncePausedRef.current = false)}
                  onFocus={() => (isAnnouncePausedRef.current = true)}
                  onBlur={() => (isAnnouncePausedRef.current = false)}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {current.href ? (
                      <motion.a
                        key={announceIndex}
                        href={current.href}
                        className="site-header__announce"
                        initial={{ opacity: 0, y: travel.nudge }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -travel.nudge }}
                        transition={fades.crossfade}
                      >
                        <AnnounceBody current={current} />
                      </motion.a>
                    ) : (
                      <motion.div
                        key={announceIndex}
                        className="site-header__announce"
                        initial={{ opacity: 0, y: travel.nudge }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -travel.nudge }}
                        transition={fades.crossfade}
                      >
                        <AnnounceBody current={current} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {announcements.length > 1 ? (
                    <button
                      type="button"
                      className="site-header__announce-toggle"
                      aria-pressed={isAnnouncePaused}
                      aria-label={isAnnouncePaused ? 'Retomar avisos' : 'Pausar avisos'}
                      onClick={() => setIsAnnouncePaused((paused) => !paused)}
                    >
                      {isAnnouncePaused ? (
                        <Play size={12} weight="fill" aria-hidden="true" />
                      ) : (
                        <Pause size={12} weight="fill" aria-hidden="true" />
                      )}
                    </button>
                  ) : null}
                </div>
              ) : null}

              <HeaderStatus weather={weather} />
            </div>

            <div className="site-header__utils">
              {search}
              {account}
            </div>
          </div>
        </div>

        <div className="site-header__navbar">
          <div className="site-header__navbar-inner">
            <div className="site-header__logo">
              <Link
                href="/inicio"
                className="site-logo"
                aria-label="Multiverso das Letras — Página inicial"
              >
                <img
                  src="/assets/icons/logo.svg"
                  alt="Multiverso das Letras"
                  className="site-logo__img site-logo__img--white"
                />
                <img
                  src="/assets/icons/logo-color.svg"
                  alt=""
                  className="site-logo__img site-logo__img--color"
                  aria-hidden="true"
                />
              </Link>
            </div>

            <div className="site-header__nav-cluster">
              <nav className="site-nav" aria-label="Redes">
                <ul role="list">
                  <li className="site-nav__redes" ref={redesRef}>
                    <button
                      type="button"
                      ref={redesTriggerRef}
                      className="site-nav__redes-trigger"
                      aria-expanded={isRedesOpen}
                      aria-controls="site-nav-redes-panel"
                      onClick={() => setIsRedesOpen((v) => !v)}
                    >
                      <span className="site-nav__label">Redes</span>
                      <CaretDown
                        className="site-nav__redes-chevron"
                        size={12}
                        weight="bold"
                        aria-hidden="true"
                      />
                    </button>

                    <AnimatePresence>
                      {isRedesOpen && redes.length > 0 && (
                        <motion.div
                          id="site-nav-redes-panel"
                          className="site-nav__redes-panel"
                          role="menu"
                          aria-label="Redes públicas e projetos regionais da Multiverso"
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <a
                            href={redes[0].href}
                            role="menuitem"
                            className="site-nav__redes-item site-nav__redes-item--home"
                            onClick={() => closeRedes()}
                          >
                            <House size={16} weight="fill" aria-hidden="true" />
                            <span>{redes[0].label}</span>
                          </a>

                          <div className="site-nav__redes-grid">
                            {redes.slice(1).map((r) => (
                              <a
                                key={r.href}
                                href={r.href}
                                role="menuitem"
                                className="site-nav__redes-item"
                                onClick={() => closeRedes()}
                              >
                                <MapPin size={14} weight="regular" aria-hidden="true" />
                                <span>{r.label}</span>
                              </a>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                </ul>
              </nav>

              <div className="site-header__actions">
                <button
                  className="site-header__toggle"
                  type="button"
                  ref={toggleRef}
                  aria-expanded={isOpen}
                  aria-controls="nav-offcanvas"
                  aria-label={isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
                  onClick={() => setIsOpen((v) => !v)}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isOpen ? (
                      <motion.span
                        key="close"
                        className="site-header__toggle-icon"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={fades.swap}
                      >
                        <X size={22} weight="bold" aria-hidden="true" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="open"
                        className="site-header__toggle-icon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={fades.swap}
                      >
                        <List size={22} weight="bold" aria-hidden="true" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <motion.div
        className="nav-overlay"
        variants={scrimVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        aria-hidden={!isOpen}
        inert={!isOpen}
        onClick={closeMenu}
      />

      <motion.aside
        className="nav-offcanvas"
        id="nav-offcanvas"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        aria-hidden={!isOpen}
        inert={!isOpen}
        ref={panelRef}
        variants={panelInlineEnd}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
      >
        <div className="nav-offcanvas__inner">
          <div className="nav-offcanvas__hd">
            <Link
              href="/inicio"
              className="nav-offcanvas__logo"
              aria-label="Multiverso das Letras — Página inicial"
            >
              <img src="/assets/icons/logo.svg" alt="Multiverso das Letras" height={36} />
            </Link>
            <button
              className="nav-offcanvas__close"
              type="button"
              aria-label="Fechar menu de navegação"
              onClick={closeMenu}
            >
              <X size={18} weight="bold" aria-hidden="true" />
            </button>
          </div>

          <div className="nav-offcanvas__ft">
            <motion.form
              className="nav-offcanvas__search"
              role="search"
              action="/busca"
              method="get"
              variants={panelItemInlineEnd}
            >
              <label className="nav-offcanvas__search-label" htmlFor="nav-offcanvas-search-input">
                <MagnifyingGlass size={16} weight="bold" aria-hidden="true" />
              </label>
              <input
                id="nav-offcanvas-search-input"
                className="nav-offcanvas__search-input"
                type="search"
                name="q"
                placeholder="Buscar projetos e setores…"
                aria-label="Buscar projetos e setores"
              />
            </motion.form>

            {userEmail ? (
              <motion.div className="nav-offcanvas__account" variants={panelItemInlineEnd}>
                <span className="nav-offcanvas__avatar" aria-hidden="true">
                  {initials}
                </span>
                <span className="nav-offcanvas__user-meta">
                  <span className="nav-offcanvas__user">{userEmail}</span>
                  {setorLabel ? <span className="nav-offcanvas__setor">{setorLabel}</span> : null}
                </span>
                <motion.button
                  type="button"
                  className="nav-offcanvas__logout"
                  whileTap={TAP_SCALE}
                  transition={fades.swap}
                  onClick={handleLogout}
                >
                  Sair
                </motion.button>
              </motion.div>
            ) : null}

            <motion.p className="nav-offcanvas__tagline" variants={panelItemInlineEnd}>
              O começo, o meio e o infinito.
            </motion.p>

            <motion.ul
              className="nav-offcanvas__social"
              role="list"
              aria-label="Redes sociais"
              variants={panelItemInlineEnd}
            >
              {social.map((s) => {
                const SocialIcon = SOCIAL_ICONS[s.icon]
                return (
                  <li key={s.icon}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener"
                      className="social-link"
                      aria-label={`${s.label} (abre em nova aba)`}
                    >
                      <SocialIcon size={18} weight="fill" aria-hidden="true" />
                    </a>
                  </li>
                )
              })}
            </motion.ul>
          </div>
        </div>
      </motion.aside>
    </MotionConfig>
  )
}
