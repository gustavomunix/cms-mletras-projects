import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import { Header } from '@/components/Header/Header'
import { Hero } from '@/components/Hero/Hero'
import { FeatureGrid } from '@/components/FeatureGrid/FeatureGrid'
import { Footer } from '@/components/Footer/Footer'

const features = [
  { title: 'Payload CMS', description: 'Gerenciador de conteúdo headless nativo em TypeScript.' },
  { title: 'D1 Database', description: 'SQLite serverless hospedado no Cloudflare.' },
  { title: 'R2 Storage', description: 'Armazenamento de mídia na nuvem Cloudflare.' },
  { title: 'Next.js', description: 'Framework React moderno com App Router.' },
]

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <>
      <Header userEmail={user?.email} />
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
      <Footer />
    </>
  )
}
