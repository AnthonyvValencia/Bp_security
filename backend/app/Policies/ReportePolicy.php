<?php

namespace App\Policies;

use App\Models\Reporte;
use App\Models\User;

class ReportePolicy
{
    /**
     * El dueño del reporte, o el líder de la comunidad a la que pertenece.
     * El admin ya tiene bypass total vía Gate::before.
     */
    public function ver(User $usuario, Reporte $reporte): bool
    {
        if ($reporte->usuario_id === $usuario->id) {
            return true;
        }

        return $usuario->comunidadLiderada?->id === $reporte->comunidad_id;
    }

    /**
     * Cambiar de estado: solo el líder de la comunidad del reporte.
     */
    public function gestionar(User $usuario, Reporte $reporte): bool
    {
        return $usuario->comunidadLiderada?->id === $reporte->comunidad_id;
    }

    /**
     * Eliminar: solo el propio autor del reporte (limpieza de su historial).
     */
    public function eliminar(User $usuario, Reporte $reporte): bool
    {
        return $reporte->usuario_id === $usuario->id;
    }
}
