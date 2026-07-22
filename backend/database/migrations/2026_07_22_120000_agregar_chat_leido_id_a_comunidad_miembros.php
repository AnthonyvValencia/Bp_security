<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Marca hasta qué mensaje leyó el chat cada miembro. Se guarda el id del
     * último mensaje visto —no una fecha— porque las columnas de tiempo tienen
     * precisión de segundos: un mensaje que llegara en el mismo segundo que la
     * lectura quedaría por debajo del corte y no se contaría nunca.
     * Nulo = nunca abrió el chat (todos los mensajes ajenos cuentan).
     */
    public function up(): void
    {
        Schema::table('comunidad_miembros', function (Blueprint $table) {
            $table->unsignedBigInteger('chat_leido_id')->nullable()->after('fecha_ingreso');
        });
    }

    public function down(): void
    {
        Schema::table('comunidad_miembros', function (Blueprint $table) {
            $table->dropColumn('chat_leido_id');
        });
    }
};
