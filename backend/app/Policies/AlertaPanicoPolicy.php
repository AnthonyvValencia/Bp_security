<?php

namespace App\Policies;

use App\Models\AlertaPanico;
use App\Models\User;

class AlertaPanicoPolicy
{
    /**
     * El dueño de la alerta, o el líder de la comunidad a la que pertenece.
     * El admin ya tiene bypass total vía Gate::before.
     */
    public function ver(User $usuario, AlertaPanico $alerta): bool
    {
        if ($alerta->usuario_id === $usuario->id) {
            return true;
        }

        return $alerta->comunidad_id !== null
            && $usuario->comunidadLiderada?->id === $alerta->comunidad_id;
    }

    /**
     * Reconocer/resolver/marcar falsa alarma: solo el líder de la comunidad
     * de la alerta. Las alertas sin comunidad solo las gestiona el admin.
     */
    public function gestionar(User $usuario, AlertaPanico $alerta): bool
    {
        return $alerta->comunidad_id !== null
            && $usuario->comunidadLiderada?->id === $alerta->comunidad_id;
    }

    /**
     * Cancelar: solo el propio emisor de la alerta (el líder nunca "cancela"
     * a nombre de otro — para eso están reconocer/resolver/falsa alarma).
     */
    public function cancelar(User $usuario, AlertaPanico $alerta): bool
    {
        return $alerta->usuario_id === $usuario->id;
    }

    /**
     * Eliminar: solo el propio emisor, en cualquier estado — es limpieza de
     * su historial personal, no afecta la capacidad del líder de haber
     * actuado sobre ella mientras existió.
     */
    public function eliminar(User $usuario, AlertaPanico $alerta): bool
    {
        return $alerta->usuario_id === $usuario->id;
    }
}
