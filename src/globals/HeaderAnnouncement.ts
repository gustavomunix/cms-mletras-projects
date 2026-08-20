import type { GlobalConfig, Validate } from 'payload'

export const HeaderAnnouncement: GlobalConfig = {
  slug: 'header-announcement',
  label: 'Avisos do Header',
  access: {
    read: () => true,
  },
  admin: {
    description: 'Mensagens em loop na barra superior do header, cada uma com badge de tipo.',
  },
  fields: [
    {
      name: 'messages',
      type: 'array',
      label: 'Mensagens',
      labels: { singular: 'Mensagem', plural: 'Mensagens' },
      admin: {
        description: 'Ordem aqui define a ordem do loop. Só mensagens marcadas como "Ativa" entram no loop.',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Ativa',
          defaultValue: true,
        },
        {
          name: 'badge',
          type: 'select',
          label: 'Tipo',
          defaultValue: 'novidade',
          options: [
            { label: 'Novidade', value: 'novidade' },
            { label: 'Mensagem', value: 'mensagem' },
            { label: 'Aviso', value: 'aviso' },
            { label: 'Alerta', value: 'alerta' },
          ],
        },
        {
          name: 'text',
          type: 'text',
          label: 'Texto',
          required: true,
        },
        {
          name: 'ctaLabel',
          type: 'text',
          label: 'Texto do botão (CTA)',
          admin: {
            description: 'Opcional. Deixe em branco pra mensagem não ter botão/link.',
          },
        },
        {
          name: 'ctaHref',
          type: 'text',
          label: 'Link do botão (CTA)',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.ctaLabel),
            description: 'Ex: /novidades. Obrigatório quando o texto do botão está preenchido.',
          },
          validate: ((value, { siblingData }) => {
            if ((siblingData as { ctaLabel?: string })?.ctaLabel && !value) {
              return 'Informe o link quando houver texto do botão.'
            }
            return true
          }) as Validate<string | null | undefined>,
        },
      ],
    },
    {
      name: 'intervalSeconds',
      type: 'number',
      label: 'Intervalo entre mensagens (segundos)',
      defaultValue: 5,
      min: 2,
      max: 30,
      admin: {
        condition: (_, siblingData) => (siblingData?.messages?.length ?? 0) > 1,
        description: 'Só importa quando há mais de uma mensagem ativa.',
      },
      validate: ((value) => {
        if (value != null && (value < 2 || value > 30)) {
          return 'Use um intervalo entre 2 e 30 segundos.'
        }
        return true
      }) as Validate<number | null | undefined>,
    },
  ],
}
