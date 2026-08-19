import React from 'react'

import './Hero.css'

type HeroAction = {
  href: string
  label: string
  variant: 'pri' | 'ghost'
  external?: boolean
}

type HeroProps = {
  title: string
  lead: string
  actions: HeroAction[]
}

export function Hero({ title, lead, actions }: HeroProps) {
  return (
    <section className="hero-section">
      <h1 className="hero">{title}</h1>
      <p className="hero-section__subtitle">{lead}</p>
      <div className="hero-section__actions">
        {actions.map((action) => (
          <a
            key={action.href}
            className={`btn btn-${action.variant}`}
            href={action.href}
            {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {action.label}
          </a>
        ))}
      </div>
    </section>
  )
}
