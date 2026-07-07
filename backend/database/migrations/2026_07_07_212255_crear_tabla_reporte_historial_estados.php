<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reporte_historial_estados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporte_id')->constrained('reportes')->cascadeOnDelete();
            $table->enum('estado_anterior', ['abierto', 'en_revision', 'resuelto', 'descartado']);
            $table->enum('estado_nuevo', ['abierto', 'en_revision', 'resuelto', 'descartado']);
            $table->foreignId('cambiado_por')->constrained('users')->cascadeOnDelete();
            $table->text('comentario')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reporte_historial_estados');
    }
};
