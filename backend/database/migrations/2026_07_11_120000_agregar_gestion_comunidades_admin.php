<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Habilita la gestión administrativa de comunidades:
     * - `estado` pasa de enum nativo a varchar para admitir el nuevo valor
     *   "suspendida" sin cirugía de enum en Postgres (mismo criterio ya usado
     *   en alertas_panico/reportes: la validez la garantizan el cast a enum de
     *   PHP y los Form Requests).
     * - `softDeletes` para que "eliminar" una comunidad conserve el historial.
     */
    public function up(): void
    {
        Schema::table('comunidades', function (Blueprint $table) {
            $table->string('estado')->default('pendiente')->change();
        });

        // En Postgres `->change()` no elimina el CHECK constraint que Laravel
        // creó para el enum original; queda huérfano bloqueando "suspendida".
        // (En SQLite no aplica: `->change()` reconstruye la tabla sin el check.)
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE comunidades DROP CONSTRAINT IF EXISTS comunidades_estado_check');
        }

        Schema::table('comunidades', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('comunidades', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('comunidades', function (Blueprint $table) {
            $table->enum('estado', ['pendiente', 'aprobada', 'rechazada'])->default('pendiente')->change();
        });
    }
};
