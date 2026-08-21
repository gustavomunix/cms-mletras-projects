import Link from 'next/link'
import * as motion from 'motion/react-client'

import { containerVariants, fadeUp, inViewOnce } from '@/lib/motion'

import './Footer.css'

type FooterLink = {
  label: string
  url: string
}

type SocialItem = {
  label: string
  url: string
  icon: 'linkedin' | 'instagram'
}

type FooterProps = {
  footerLinks?: FooterLink[]
  social?: SocialItem[]
}

const DEFAULT_SOCIAL: SocialItem[] = [
  {
    label: 'LinkedIn',
    url: 'https://linkedin.com/company/multiverso-das-letras/',
    icon: 'linkedin',
  },
  { label: 'Instagram', url: 'https://instagram.com/multiversodasletras', icon: 'instagram' },
]

export function Footer({ footerLinks = [], social = DEFAULT_SOCIAL }: FooterProps) {
  return (
    <footer className="site-footer" role="contentinfo" aria-label="Rodapé">
      <div className="site-footer__body">
        <motion.div
          className="site-footer__inner"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={inViewOnce}
        >
          <motion.div className="site-footer__brand" variants={fadeUp}>
            <Link
              href="/"
              className="site-footer__logo"
              aria-label="Multiverso das Letras — Página inicial"
            >
              <img
                src="/assets/icons/logo.svg"
                alt="Multiverso das Letras"
                width={220}
                height={59}
                loading="lazy"
              />
            </Link>

            <p className="site-footer__tagline">O começo, o meio e o infinito.</p>

            <address className="site-footer__address">
              Av. Paulista, 2.300, cj.&nbsp;151
              <br />
              Bela Vista · São Paulo – SP · 01310-300
            </address>

            <ul
              className="site-footer__social"
              role="list"
              aria-label="Redes sociais da Multiverso das Letras"
            >
              {social.map((s) => (
                <li key={s.icon}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener"
                    className="social-link"
                    aria-label={`${s.label} (abre em nova aba)`}
                  >
                    <img
                      src={`/assets/icons/${s.icon}.svg`}
                      width={18}
                      height={18}
                      alt=""
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div className="site-footer__divider" aria-hidden="true" variants={fadeUp} />

          {footerLinks.length > 0 ? (
            <motion.div className="site-footer__group" variants={fadeUp}>
              <p className="site-footer__group-title">Conheça as empresas do Grupo</p>

              <ul className="site-footer__group-links" role="list">
                {footerLinks.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener"
                      className="site-footer__group-link"
                      aria-label={`${link.label} (abre em nova aba)`}
                    >
                      <svg
                        className="site-footer__link-arrow"
                        width={12}
                        height={12}
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="site-footer__contact-cta">
                <p className="site-footer__contact-text">Quer falar com o grupo?</p>
                <a href="/contato" className="site-footer__contact-link">
                  Fale com nossa equipe
                </a>
              </div>
            </motion.div>
          ) : null}
        </motion.div>
      </div>

      <div className="site-footer__bar">
        <motion.div
          className="site-footer__bar-inner"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={inViewOnce}
        >
          <p className="site-footer__bar-copy">
            &copy; {new Date().getFullYear()} Grupo Multiverso das Letras. Todos os direitos
            reservados.
          </p>
          <nav aria-label="Links institucionais do rodapé">
            <ul className="site-footer__bar-nav" role="list">
              <li>
                <a href="/sobre" className="site-footer__bar-link">
                  Sobre nós
                </a>
              </li>
              <li aria-hidden="true" className="site-footer__bar-sep">
                ·
              </li>
              <li>
                <a href="/pnld" className="site-footer__bar-link">
                  PNLD
                </a>
              </li>
              <li aria-hidden="true" className="site-footer__bar-sep">
                ·
              </li>
              <li>
                <a href="/contato" className="site-footer__bar-link">
                  Contato
                </a>
              </li>
            </ul>
          </nav>
        </motion.div>
      </div>
    </footer>
  )
}
