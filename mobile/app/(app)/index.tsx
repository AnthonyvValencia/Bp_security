import { PanelAdmin } from '@/src/features/admin/components/PanelAdmin';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { HomeCiudadano } from '@/src/features/home/HomeCiudadano';

export default function HomeScreen() {
  const usuario = useAuthStore((state) => state.usuario);

  // El administrador no participa como vecino (sin comunidad, sin botón de
  // pánico ni reportes): entra directo a su panel de gestión.
  if (usuario?.rol === 'administrador') {
    return <PanelAdmin />;
  }

  return <HomeCiudadano />;
}
