import type { CollectionConfig } from 'payload'

import {
  isAdmin,
  isAdminFieldLevel,
  isAdminNotSelf,
  isAdminNotSelfFieldLevel,
  isAdminOrSelf,
  isAuthenticated,
} from '@/access/isAdmin'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'setor'],
  },
  auth: true,
  access: {
    create: isAdmin,
    read: isAuthenticated,
    update: isAdminOrSelf,
    delete: isAdminNotSelf,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data

        // Primeiro usuário do sistema vira admin explicitamente: o fluxo nativo do
        // Payload libera o create com a tabela vazia, mas não define o papel.
        const { totalDocs } = await req.payload.count({ collection: 'users', req })
        if (totalDocs === 0) {
          data.role = 'administrador'
        }

        return data
      },
    ],
  },
  fields: [
    // Email added by default
    {
      name: 'role',
      type: 'select',
      required: true,
      saveToJWT: true,
      defaultValue: 'colaborador',
      options: [
        { label: 'Administrador', value: 'administrador' },
        { label: 'Colaborador', value: 'colaborador' },
      ],
      label: 'Permissão',
      admin: {
        width: '50%',
        description: 'Só o administrador cria, edita e remove outros usuários.',
      },
      access: {
        create: isAdminFieldLevel,
        update: isAdminNotSelfFieldLevel,
      },
    },
    {
      name: 'setor',
      type: 'select',
      required: true,
      saveToJWT: true,
      options: [
        { label: 'Equipe de TI', value: 'ti' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Ecommerce', value: 'ecommerce' },
        { label: 'Relações com mercado', value: 'relacoes-mercado' },
        { label: 'Editorial', value: 'editorial' },
      ],
      admin: {
        width: '50%',
        description:
          'Departamento da pessoa. Não afeta a permissão — administrador pode ser de qualquer setor.',
      },
      access: {
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
    },
  ],
}
