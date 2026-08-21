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
  ArrowRight,
  CaretDown,
  House,
  InstagramLogo,
  LinkedinLogo,
  List,
  MagnifyingGlass,
  MapPin,
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

import './Header.css'

type NavItem = {
  label: string
  href: string
  cta?: boolean
}

type SocialItem = {
  label: string
  url: string
  icon: 'linkedin' | 'instagram'
}

type RedeItem = {
  label: string
  href: string
}

type AnnouncementBadge = 'novidade' | 'mensagem' | 'aviso' | 'alerta'

type Announcement = {
  label: string
  badge?: AnnouncementBadge
  ctaLabel?: string
  ctaHref?: string
}

type HeaderProps = {
  nav?: NavItem[]
  social?: SocialItem[]
  redes?: RedeItem[]
  announcements?: Announcement[]
  announcementIntervalSeconds?: number
  userEmail?: string
}

const DEFAULT_NAV: NavItem[] = [
  { label: 'Sobre', href: '/sobre' },
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contato', href: '/contato' },
  { label: 'Fale conosco', href: '/contato', cta: true },
]

const DEFAULT_SOCIAL: SocialItem[] = [
  {
    label: 'LinkedIn',
    url: 'https://linkedin.com/company/multiverso-das-letras/',
    icon: 'linkedin',
  },
  { label: 'Instagram', url: 'https://instagram.com/multiversodasletras', icon: 'instagram' },
]

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    label: 'Confira as novidades do Multiverso das Letras',
    badge: 'novidade',
    ctaLabel: 'Ver novidades',
    ctaHref: '/novidades',
  },
]

const DEFAULT_ANNOUNCEMENT_INTERVAL_SECONDS = 5

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

const BADGE_LABELS: Record<AnnouncementBadge, string> = {
  novidade: 'Novidades',
  mensagem: 'Mensagem',
  aviso: 'Aviso',
  alerta: 'Alerta',
}

const SCROLL_DISTANCE = 80
const SCROLL_HIDE_THRESHOLD = 80

function useDismiss(active: boolean, ref: RefObject<HTMLElement | null>, onDismiss: () => void) {
  useEffect(() => {
    if (!active) return

    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss()
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [active, ref, onDismiss])
}

export function Header({
  nav = DEFAULT_NAV,
  social = DEFAULT_SOCIAL,
  redes = DEFAULT_REDES,
  announcements = DEFAULT_ANNOUNCEMENTS,
  announcementIntervalSeconds = DEFAULT_ANNOUNCEMENT_INTERVAL_SECONDS,
  userEmail,
}: HeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    try {
      await fetch('/api/users/logout', { method: 'POST' })
    } catch {}
    router.push('/')
    router.refresh()
  }

  const [isOpen, setIsOpen] = useState(false)
  const [isRedesOpen, setIsRedesOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [announceIndex, setAnnounceIndex] = useState(0)
  const isAnnouncePausedRef = useRef(false)

  const headerRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const redesRef = useRef<HTMLLIElement>(null)
  const searchRef = useRef<HTMLFormElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isOpenRef = useRef(false)
  const lastY = useRef(0)

  const shouldReduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const rawProgress = useTransform(scrollY, [0, SCROLL_DISTANCE], [0, 1], { clamp: true })
  const progress = useSpring(rawProgress, {
    stiffness: shouldReduceMotion ? 1000 : 260,
    damping: shouldReduceMotion ? 100 : 32,
    mass: 0.4,
  })

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  useMotionValueEvent(progress, 'change', (v) => {
    const header = headerRef.current
    if (!header) return
    header.style.setProperty('--header-progress', String(v))
    header.style.setProperty('--header-progress-pct', `${v * 100}%`)
  })

  useMotionValueEvent(scrollY, 'change', (y) => {
    const header = headerRef.current
    if (!header) return

    if (!isOpenRef.current) {
      header.toggleAttribute('data-hidden', y > SCROLL_HIDE_THRESHOLD && y > lastY.current)
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

  const closeRedes = useCallback(() => setIsRedesOpen(false), [])
  const closeSearch = useCallback(() => setIsSearchOpen(false), [])
  useDismiss(isRedesOpen, redesRef, closeRedes)
  useDismiss(isSearchOpen, searchRef, closeSearch)

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus()
  }, [isSearchOpen])

  useEffect(() => {
    if (announcements.length <= 1) return

    const id = window.setInterval(() => {
      if (isAnnouncePausedRef.current) return
      setAnnounceIndex((i) => (i + 1) % announcements.length)
    }, announcementIntervalSeconds * 1000)

    return () => window.clearInterval(id)
  }, [announcements.length, announcementIntervalSeconds])

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
        'a[href], button:not([disabled])',
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

  const navLinks = nav.filter((item) => !item.cta)
  const ctaItem = nav.find((item) => item.cta)

  return (
    <MotionConfig reducedMotion="user">
      <a href="#main" className="skip-link">
        Pular para o conteúdo principal
      </a>

      <header className="site-header" role="banner" ref={headerRef}>
        <div className="site-header__top-bar">
          <div className="site-header__top-bar-inner">
            {announcements.length > 0 && (
              <div
                className="site-header__announce-slot"
                role="status"
                onMouseEnter={() => (isAnnouncePausedRef.current = true)}
                onMouseLeave={() => (isAnnouncePausedRef.current = false)}
                onFocus={() => (isAnnouncePausedRef.current = true)}
                onBlur={() => (isAnnouncePausedRef.current = false)}
              >
                <AnimatePresence mode="wait">
                  {(() => {
                    const current = announcements[announceIndex % announcements.length]
                    return (
                      <motion.div
                        key={announceIndex}
                        className="site-header__announce"
                        data-badge={current.badge ?? 'novidade'}
                        initial={{ opacity: 0, y: travel.nudge }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -travel.nudge }}
                        transition={fades.crossfade}
                      >
                        <span className="site-header__announce-dot" aria-hidden="true" />
                        <span className="site-header__announce-label">
                          {BADGE_LABELS[current.badge ?? 'novidade']}
                        </span>
                        <span className="site-header__announce-text">{current.label}</span>
                        {current.ctaLabel && current.ctaHref && (
                          <a href={current.ctaHref} className="site-header__announce-cta">
                            {current.ctaLabel}
                          </a>
                        )}
                      </motion.div>
                    )
                  })()}
                </AnimatePresence>
              </div>
            )}

            {userEmail && (
              <div className="site-header__account">
                <p className="site-header__user">Olá, {userEmail}</p>
                <button type="button" className="site-header__logout" onClick={handleLogout}>
                  Sair
                </button>
              </div>
            )}

            <form
              className={`site-header__search${isSearchOpen ? ' is-open' : ''}`}
              role="search"
              action="/busca"
              method="get"
              ref={searchRef}
            >
              <button
                type="button"
                className="site-header__search-toggle"
                aria-expanded={isSearchOpen}
                aria-controls="site-header-search-input"
                aria-label={isSearchOpen ? 'Fechar busca' : 'Abrir busca'}
                onClick={() => setIsSearchOpen((v) => !v)}
              >
                <MagnifyingGlass size={16} weight="bold" aria-hidden="true" />
              </button>
              <input
                ref={searchInputRef}
                id="site-header-search-input"
                className="site-header__search-input"
                type="search"
                name="q"
                placeholder="Buscar no site…"
                aria-hidden={!isSearchOpen}
                tabIndex={isSearchOpen ? 0 : -1}
              />
            </form>

            <ul className="site-header__social" role="list" aria-label="Redes sociais">
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
                      <SocialIcon size={16} weight="fill" aria-hidden="true" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="site-header__navbar">
          <div className="site-header__navbar-inner">
            <div className="site-header__logo">
              <Link
                href="/"
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

            <nav className="site-nav" aria-label="Navegação principal">
              <ul role="list">
                {navLinks.map((item) => (
                  <li key={item.href}>
                    <a href={item.href}>
                      <span className="site-nav__label">{item.label}</span>
                      <span className="site-nav__underline" aria-hidden="true" />
                    </a>
                  </li>
                ))}

                <li className="site-nav__redes" ref={redesRef}>
                  <button
                    type="button"
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
                          onClick={closeRedes}
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
                              onClick={closeRedes}
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
              {ctaItem && (
                <div className="site-header__cta">
                  <a href={ctaItem.href} className="btn btn-acc site-nav__cta">
                    {ctaItem.label}
                  </a>
                </div>
              )}

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
              href="/"
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

          <nav className="nav-offcanvas__nav" aria-label="Menu principal">
            <ul role="list">
              {navLinks.map((item) => (
                <motion.li key={item.href} variants={panelItemInlineEnd}>
                  <a href={item.href}>
                    <span>{item.label}</span>
                    <ArrowRight
                      className="nav-offcanvas__arrow"
                      size={20}
                      weight="regular"
                      aria-hidden="true"
                    />
                  </a>
                </motion.li>
              ))}
            </ul>
          </nav>

          <motion.div className="nav-offcanvas__ft" variants={panelItemInlineEnd}>
            {ctaItem && (
              <a href={ctaItem.href} className="btn btn-acc nav-offcanvas__cta">
                {ctaItem.label}
              </a>
            )}

            <p className="nav-offcanvas__tagline">O começo, o meio e o infinito.</p>

            <ul className="nav-offcanvas__social" role="list" aria-label="Redes sociais">
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
            </ul>
          </motion.div>
        </div>
      </motion.aside>
    </MotionConfig>
  )
}
