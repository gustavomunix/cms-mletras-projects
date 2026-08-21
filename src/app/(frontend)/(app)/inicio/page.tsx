import React from 'react'

import config from '@/payload.config'
import { Hero } from '@/components/Hero/Hero'
import { FeatureGrid } from '@/components/FeatureGrid/FeatureGrid'

const features = [
  { title: 'Payload CMS', description: 'Gerenciador de conteúdo headless nativo em TypeScript.' },
  { title: 'D1 Database', description: 'SQLite serverless hospedado no Cloudflare.' },
  { title: 'R2 Storage', description: 'Armazenamento de mídia na nuvem Cloudflare.' },
  { title: 'Next.js', description: 'Framework React moderno com App Router.' },
]

export default async function InicioPage() {
  const payloadConfig = await config

  return (
    <>
      <Hero
        title="Bem-vindo ao Frontend"
        lead="Página placeholder — conteúdo dinâmico via Payload (em breve)."
        actions={[
          { href: payloadConfig.routes.admin, label: 'Ir para Admin', variant: 'pri' },
          {
            href: 'https://payloadcms.com/docs',
            label: 'Documentação',
            variant: 'ghost',
            external: true,
          },
        ]}
      />
      <FeatureGrid features={features} />
    </>
  )
}
