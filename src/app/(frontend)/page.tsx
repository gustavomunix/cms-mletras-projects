import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import { LoginForm } from '@/components/LoginForm/LoginForm'

export const metadata = {
  title: 'Entrar · Multiverso das Letras',
  description: 'Acesso restrito à equipe Multiverso das Letras.',
}

export default async function LoginPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect('/inicio')
  }

  return <LoginForm />
}
