import { AccessDenied } from '@/components/auth/access-denied'

export default function AccessDeniedPage() {
  return (
    <AccessDenied
      message="No tienes los permisos necesarios para acceder a esta página. Contacta al administrador de tu organización si crees que esto es un error."
    />
  )
}
