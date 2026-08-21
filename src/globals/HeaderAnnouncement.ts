import type { GlobalConfig } from 'payload'

export const HeaderAnnouncement: GlobalConfig = {
  slug: 'header-announcement',
  label: 'Avisos do Header',
  access: {
    read: () => true,
  },
  admin: {
    description:
      'Faixa interna no topo: palestra, parceria, projeto de time, lembrete, número da semana. Sem botão de conversão — se tiver destino, a linha inteira é o link.',
  },
  fields: [
    {
      name: 'messages',
      type: 'array',
      label: 'Avisos',
      labels: { singular: 'Aviso', plural: 'Avisos' },
      admin: {
        description:
          'Ordem aqui é a ordem do loop. Só itens marcados como Ativo entram. Kicker e métrica são livres — não há tipos pré-definidos.',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Ativo',
          defaultValue: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'kicker',
              type: 'text',
              label: 'Kicker',
              maxLength: 32,
              admin: {
                width: '40%',
                placeholder: 'Palestra, Parceria, Editorial…',
                description: 'Opcional. Livre: setor, campanha, lembrete, palestra.',
              },
            },
            {
              name: 'metric',
              type: 'text',
              label: 'Métrica',
              maxLength: 16,
              admin: {
                width: '30%',
                placeholder: '+18%, 12 mil, 14h',
                description: 'Opcional. O número em evidência.',
              },
            },
            {
              name: 'href',
              type: 'text',
              label: 'Link',
              admin: {
                width: '30%',
                placeholder: '/inicio',
                description: 'Opcional. Sem botão — a faixa inteira leva até aqui.',
              },
            },
          ],
        },
        {
          name: 'text',
          type: 'text',
          label: 'Texto',
          required: true,
          admin: {
            placeholder: 'Lançamento com a editora X na sexta, 16h no auditório',
          },
        },
      ],
    },
    {
      name: 'intervalSeconds',
      type: 'number',
      label: 'Intervalo entre avisos (segundos)',
      defaultValue: 8,
      min: 2,
      max: 30,
      admin: {
        condition: (_, siblingData) => (siblingData?.messages?.length ?? 0) > 1,
        description: 'Só importa quando há mais de um aviso ativo.',
      },
      validate: (value: number | null | undefined) => {
        if (value != null && (value < 2 || value > 30)) {
          return 'Use um intervalo entre 2 e 30 segundos.'
        }
        return true
      },
    },
  ],
}
