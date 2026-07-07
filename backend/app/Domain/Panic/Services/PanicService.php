<?php

namespace App\Domain\Panic\Services;

use App\Domain\Audit\Services\Auditor;
use App\Domain\Panic\DTOs\ActivarAlertaData;
use App\Domain\Panic\Enums\EstadoAlerta;
use App\Domain\Panic\Exceptions\ReglaAlertaException;
use App\Models\AlertaPanico;
use App\Models\Comunidad;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class PanicService
{
    public function __construct(
        private readonly Auditor $auditor,
    ) {}

    /**
     * Idempotente por id_cliente: si el mismo UUID ya llegó (reintento de la
     * cola offline), devuelve la alerta existente en vez de duplicarla.
     */
    public function activar(User $usuario, ActivarAlertaData $datos): AlertaPanico
    {
        $existente = AlertaPanico::query()->where('id_cliente', $datos->idCliente)->first();

        if ($existente) {
            return $existente;
        }

        $comunidadId = $usuario->membresiaActiva()->value('comunidad_id');

        $alerta = AlertaPanico::create([
            'usuario_id' => $usuario->id,
            'comunidad_id' => $comunidadId,
            'id_cliente' => $datos->idCliente,
            'latitud' => $datos->latitud,
            'longitud' => $datos->longitud,
            'estado' => EstadoAlerta::Enviada,
            'creada_en' => $datos->creadaEn,
        ]);

        $this->auditor->registrar('alerta_panico_activada', usuario: $usuario, entidadTipo: AlertaPanico::class, entidadId: $alerta->id);

        return $alerta;
    }

    /**
     * El propio ciudadano cancela su alerta mientras nadie la haya atendido
     * todavía (solo desde "enviada" — una vez reconocida por el líder, ya no
     * se puede autocancelar).
     */
    public function cancelar(AlertaPanico $alerta, User $usuario): AlertaPanico
    {
        if ($alerta->estado !== EstadoAlerta::Enviada) {
            throw new ReglaAlertaException('Esta alerta ya no se puede cancelar.');
        }

        $alerta->update(['estado' => EstadoAlerta::Cancelada]);

        $this->auditor->registrar('alerta_panico_cancelada', usuario: $usuario, entidadTipo: AlertaPanico::class, entidadId: $alerta->id);

        return $alerta;
    }

    /**
     * El emisor elimina su propia alerta del historial (limpieza), en
     * cualquier estado — no reabre ni afecta lo que el líder ya haya hecho.
     */
    public function eliminar(AlertaPanico $alerta, User $usuario): void
    {
        $alerta->delete();

        $this->auditor->registrar('alerta_panico_eliminada', usuario: $usuario, entidadTipo: AlertaPanico::class, entidadId: $alerta->id);
    }

    public function reconocer(AlertaPanico $alerta, User $lider): AlertaPanico
    {
        if ($alerta->estado !== EstadoAlerta::Enviada) {
            throw new ReglaAlertaException('Esta alerta ya fue reconocida o cerrada.');
        }

        $alerta->update([
            'estado' => EstadoAlerta::Reconocida,
            'reconocido_por' => $lider->id,
            'reconocido_en' => now(),
        ]);

        $this->auditor->registrar('alerta_panico_reconocida', usuario: $lider, entidadTipo: AlertaPanico::class, entidadId: $alerta->id);

        return $alerta;
    }

    public function resolver(AlertaPanico $alerta, User $lider, ?string $notas): AlertaPanico
    {
        $this->validarAbierta($alerta);

        $alerta->update([
            'estado' => EstadoAlerta::Resuelta,
            'resuelto_por' => $lider->id,
            'resuelto_en' => now(),
            'notas' => $notas,
        ]);

        $this->auditor->registrar('alerta_panico_resuelta', usuario: $lider, entidadTipo: AlertaPanico::class, entidadId: $alerta->id);

        return $alerta;
    }

    public function marcarFalsaAlarma(AlertaPanico $alerta, User $lider, ?string $notas): AlertaPanico
    {
        $this->validarAbierta($alerta);

        $alerta->update([
            'estado' => EstadoAlerta::FalsaAlarma,
            'resuelto_por' => $lider->id,
            'resuelto_en' => now(),
            'notas' => $notas,
        ]);

        $this->auditor->registrar('alerta_panico_falsa_alarma', usuario: $lider, entidadTipo: AlertaPanico::class, entidadId: $alerta->id);

        return $alerta;
    }

    /**
     * @return Collection<int, AlertaPanico>
     */
    public function listarPropias(User $usuario): Collection
    {
        return AlertaPanico::query()
            ->where('usuario_id', $usuario->id)
            ->orderByDesc('creada_en')
            ->get();
    }

    /**
     * @return Collection<int, AlertaPanico>
     */
    public function listarPorComunidad(Comunidad $comunidad): Collection
    {
        return AlertaPanico::query()
            ->where('comunidad_id', $comunidad->id)
            ->with('usuario')
            ->orderByDesc('creada_en')
            ->get();
    }

    /**
     * Alertas sin comunidad asignada (usuario sin membresía activa) — el
     * admin es el único que puede verlas y gestionarlas.
     *
     * @return Collection<int, AlertaPanico>
     */
    public function listarSinComunidad(): Collection
    {
        return AlertaPanico::query()
            ->whereNull('comunidad_id')
            ->with('usuario')
            ->orderByDesc('creada_en')
            ->get();
    }

    private function validarAbierta(AlertaPanico $alerta): void
    {
        if (! in_array($alerta->estado, [EstadoAlerta::Enviada, EstadoAlerta::Reconocida], true)) {
            throw new ReglaAlertaException('Esta alerta ya fue cerrada.');
        }
    }
}
