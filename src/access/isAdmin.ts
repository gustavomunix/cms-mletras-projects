import type { Access, FieldAccess } from 'payload'

export const isAdmin: Access = ({ req: { user } }) => user?.role === 'administrador'

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

export const isAdminOrSelf: Access = ({ req: { user }, id }) =>
  user?.role === 'administrador' || user?.id === id

export const isAdminNotSelf: Access = ({ req: { user }, id }) =>
  user?.role === 'administrador' && user?.id !== id

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) =>
  user?.role === 'administrador'

export const isAdminNotSelfFieldLevel: FieldAccess = ({ req: { user }, id }) =>
  user?.role === 'administrador' && user?.id !== id
