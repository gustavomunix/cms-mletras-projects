import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import { Header } from '@/components/Header/Header'
import { Footer } from '@/components/Footer/Footer'
import { getOfficeWeather } from '@/lib/weather'

export default async function AppLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/')
  }

  const [headerAnnouncement, weather] = await Promise.all([
    payload.findGlobal({ slug: 'header-announcement' }),
    getOfficeWeather(),
  ])
  const announcements = (headerAnnouncement.messages ?? [])
    .filter((message) => message.enabled && message.text)
    .map((message) => ({
      text: message.text,
      kicker: message.kicker || undefined,
      metric: message.metric || undefined,
      href: message.href || undefined,
    }))

  return (
    <>
      <Header
        userEmail={user.email}
        userSetor={user.setor}
        announcements={announcements}
        announcementIntervalSeconds={headerAnnouncement.intervalSeconds ?? undefined}
        weather={weather}
      />
      <main id="main">{children}</main>
      <Footer />
    </>
  )
}
