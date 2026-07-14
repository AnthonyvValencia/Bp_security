<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Hasta ahora aprobar una comunidad asignaba `comunidades.lider_id` pero nunca
 * promovía al usuario a rol `lider`, así que los líderes existentes figuran como
 * ciudadanos en el panel del admin. Esto alinea los datos ya guardados con la
 * regla que el servicio pasa a mantener de aquí en adelante.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where('rol', 'ciudadano')
            ->whereIn('id', function ($query) {
                $query->select('lider_id')
                    ->from('comunidades')
                    ->whereNull('deleted_at')
                    ->whereNotNull('lider_id');
            })
            ->update(['rol' => 'lider']);

        // Y el caso inverso: quien tenga el rol pero ya no lidere nada vivo
        // (p. ej. su comunidad fue eliminada) vuelve a ciudadano.
        DB::table('users')
            ->where('rol', 'lider')
            ->whereNotIn('id', function ($query) {
                $query->select('lider_id')
                    ->from('comunidades')
                    ->whereNull('deleted_at')
                    ->whereNotNull('lider_id');
            })
            ->update(['rol' => 'ciudadano']);
    }

    public function down(): void
    {
        DB::table('users')->where('rol', 'lider')->update(['rol' => 'ciudadano']);
    }
};
