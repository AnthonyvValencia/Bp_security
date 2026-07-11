<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mensajes_chat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comunidad_id')->constrained('comunidades')->cascadeOnDelete();
            $table->foreignId('usuario_id')->constrained('users')->cascadeOnDelete();
            $table->text('contenido');
            $table->timestamps();
            // Soft delete: el líder modera ocultando mensajes sin borrarlos
            // físicamente (queda rastro para auditoría).
            $table->softDeletes();

            $table->index(['comunidad_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mensajes_chat');
    }
};
