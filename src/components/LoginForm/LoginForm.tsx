'use client'

import { useRouter } from 'next/navigation'
import React, { useId, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'

import { cardIn, collapseIn, containerVariants, fadeUp, fades, popIn } from '@/lib/motion'

import './LoginForm.css'

export function LoginForm() {
  const router = useRouter()
  const errorId = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    let response: Response
    try {
      response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    } catch {
      setError('Não foi possível conectar. Verifique sua conexão e tente novamente.')
      setLoading(false)
      return
    }

    if (!response.ok) {
      const data: { errors?: { message: string }[] } | null = await response
        .json()
        .catch((): null => null)
      setError(data?.errors?.[0]?.message ?? 'E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    router.push('/inicio')
    router.refresh()
  }

  const describedBy = error ? errorId : undefined

  return (
    <MotionConfig reducedMotion="user">
      <main className="login-screen">
        <motion.div
          className="login-screen__card"
          variants={cardIn}
          initial="hidden"
          animate="visible"
        >
          <motion.span className="login-screen__mark" variants={popIn} aria-hidden="true">
            <img src="/assets/icons/logomarca.svg" alt="" width={64} height={64} />
          </motion.span>

          <motion.img
            className="login-screen__wordmark"
            src="/assets/icons/logotipo-color.svg"
            alt="Multiverso das Letras"
            width={220}
            height={67}
            variants={fadeUp}
          />

          <motion.p className="login-screen__subtitle" variants={fadeUp}>
            Acesso da equipe
          </motion.p>

          <motion.form
            className="login-screen__form"
            variants={containerVariants}
            onSubmit={handleSubmit}
            aria-busy={loading}
          >
            <motion.label className="login-screen__field" variants={fadeUp}>
              <span>E-mail</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                onChange={(event) => setEmail(event.target.value)}
              />
            </motion.label>

            <motion.label className="login-screen__field" variants={fadeUp}>
              <span>Senha</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                onChange={(event) => setPassword(event.target.value)}
              />
            </motion.label>

            <AnimatePresence initial={false}>
              {error ? (
                <motion.p
                  key="login-error"
                  id={errorId}
                  className="login-screen__error"
                  role="alert"
                  variants={collapseIn}
                  initial="hidden"
                  animate={{ ...collapseIn.visible, x: [0, -5, 5, -3, 0] }}
                  exit="hidden"
                  transition={{ height: fades.collapse, x: { duration: 0.35 } }}
                >
                  {error}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <motion.div className="login-screen__actions" variants={fadeUp}>
              <button type="submit" className="btn btn-pri" disabled={loading}>
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </motion.div>
          </motion.form>
        </motion.div>
      </main>
    </MotionConfig>
  )
}
