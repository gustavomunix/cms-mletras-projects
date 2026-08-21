import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    create: ({ req: { user } }) => user?.setor === 'administrador',
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user }, id }) => user?.setor === 'administrador' || user?.id === id,
    delete: ({ req: { user } }) => user?.setor === 'administrador',
  },
  fields: [
    // Email added by default
    {
      name: 'setor',
      type: 'select',
      required: true,
      saveToJWT: true,
      options: [
        { label: 'Administrador', value: 'administrador' },
        { label: 'Equipe de TI', value: 'ti' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Ecommerce', value: 'ecommerce' },
        { label: 'Relações com mercado', value: 'relacoes-mercado' },
        { label: 'Editorial', value: 'editorial' },
      ],
      access: {
        create: ({ req: { user } }) => user?.setor === 'administrador',
        update: ({ req: { user } }) => user?.setor === 'administrador',
      },
    },
  ],
}
