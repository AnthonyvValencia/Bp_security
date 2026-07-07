<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * La migración anterior (convertir_estados_enum_a_string) cambió el tipo
     * de columna con `->change()`, pero en Postgres eso NO elimina el CHECK
     * constraint que Laravel había creado para el enum original — quedó
     * huérfano bloqueando valores nuevos como "cancelada" o las categorías
     * de reporte del mockup. En SQLite no aplica: `->change()` reconstruye
     * la tabla entera sin el check viejo.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE alertas_panico DROP CONSTRAINT IF EXISTS alertas_panico_estado_check');
        DB::statement('ALTER TABLE reportes DROP CONSTRAINT IF EXISTS reportes_categoria_check');
        DB::statement('ALTER TABLE reportes DROP CONSTRAINT IF EXISTS reportes_estado_check');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Intencionalmente sin rollback: recrear los CHECK viejos reintroduciría el bug.
    }
};
