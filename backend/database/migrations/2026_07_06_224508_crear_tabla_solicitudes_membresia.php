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
        Schema::create('solicitudes_membresia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->cascadeOnDelete();
            $table->enum('tipo', ['unirse', 'crear']);
            $table->foreignId('comunidad_id')->nullable()->constrained('comunidades')->cascadeOnDelete();

            // Solo para tipo=crear: datos propuestos de la comunidad aún no existente.
            $table->string('nombre_comunidad_propuesto')->nullable();
            $table->text('descripcion_comunidad_propuesta')->nullable();
            $table->string('barrio_comunidad_propuesto')->nullable();

            $table->enum('estado', ['pendiente', 'aprobada', 'rechazada'])->default('pendiente');
            $table->foreignId('revisado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('revisado_en')->nullable();
            $table->text('motivo')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('solicitudes_membresia');
    }
};
