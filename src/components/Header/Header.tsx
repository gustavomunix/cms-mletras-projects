import React from 'react'

import './Header.css'

type HeaderProps = {
  userEmail?: string
}

export function Header({ userEmail }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <h1 className="site-header__logo">Multiverso das Letras</h1>
        <p className="site-header__tagline">CMS Payload + Cloudflare</p>
      </div>
      {userEmail && <p className="site-header__user">Olá, {userEmail}</p>}
    </header>
  )
}
