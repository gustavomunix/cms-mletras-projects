import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import { Header } from '@/components/Header/Header'
import { Footer } from '@/components/Footer/Footer'

export default async function AppLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/')
  }

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
    <>
      <Header
        userEmail={user.email}
        announcements={announcements}
        announcementIntervalSeconds={headerAnnouncement.intervalSeconds ?? undefined}
      />
      <main>{children}</main>
      <Footer />
    </>
  )
}
