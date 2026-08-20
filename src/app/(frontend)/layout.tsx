import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import './styles.css'
import { Header } from '@/components/Header/Header'
import { Footer } from '@/components/Footer/Footer'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const headerAnnouncement = await payload.findGlobal({ slug: 'header-announcement' })
  const announcements = (headerAnnouncement.messages ?? [])
    .filter((message) => message.enabled && message.text)
    .map((message) => ({
      label: message.text,
      badge: message.badge ?? 'novidade',
      ctaLabel: message.ctaLabel || undefined,
      ctaHref: message.ctaHref || undefined,
    }))

  return (
    <html lang="en">
      <body>
        <Header
          userEmail={user?.email}
          announcements={announcements}
          announcementIntervalSeconds={headerAnnouncement.intervalSeconds ?? undefined}
        />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
