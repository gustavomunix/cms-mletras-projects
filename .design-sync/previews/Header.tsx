import { Header } from 'mletras'

export function Default() {
  return (
    <Header
      userEmail="ana.editorial@mletras.com"
      userSetor="editorial"
      announcements={[
        {
          kicker: 'Palestra',
          metric: '16h',
          text: 'Lançamento com a editora X na sexta, auditório',
          href: '/inicio',
        },
      ]}
    />
  )
}
