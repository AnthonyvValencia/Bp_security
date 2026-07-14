<?php

namespace App\Domain\Audit\Services;

use App\Domain\Audit\Events\PanelAdminActualizado;
use App\Domain\Audit\Models\Auditoria;
use App\Models\User;
use Illuminate\Http\Request;

class Auditor
{
    /**
     * @param  array<string, mixed>  $metadatos
     */
    public function registrar(
        string $accion,
        ?User $usuario = null,
        ?string $entidadTipo = null,
        ?int $entidadId = null,
        array $metadatos = [],
        ?Request $request = null,
    ): void {
        Auditoria::create([
            'usuario_id' => $usuario?->id,
            'accion' => $accion,
            'entidad_tipo' => $entidadTipo,
            'entidad_id' => $entidadId,
            'metadatos' => $metadatos,
            'ip' => $request?->ip(),
        ]);

        // Toda acción sensible pasa por aquí, así que este es el único punto
        // que necesita avisar al panel del admin para mantenerlo en vivo.
        PanelAdminActualizado::dispatch();
    }
}
