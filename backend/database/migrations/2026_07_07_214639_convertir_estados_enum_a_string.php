<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Convierte las columnas enum (con CHECK constraint fijo) a varchar simple.
     * La validez de los valores ya la garantizan el cast a enum de PHP y los
     * Form Requests — el CHECK a nivel de BD solo estorbaba para agregar
     * nuevos valores (ej. "cancelada") sin una migración distinta por motor.
     */
    public function up(): void
    {
        Schema::table('alertas_panico', function (Blueprint $table) {
            $table->string('estado')->default('enviada')->change();
        });

        Schema::table('reportes', function (Blueprint $table) {
            $table->string('categoria')->default('otro')->change();
            $table->string('estado')->default('abierto')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('alertas_panico', function (Blueprint $table) {
            $table->enum('estado', ['enviada', 'reconocida', 'resuelta', 'falsa_alarma'])->default('enviada')->change();
        });

        Schema::table('reportes', function (Blueprint $table) {
            $table->enum('categoria', ['robo', 'sospechoso', 'vandalismo', 'accidente', 'otro'])->default('otro')->change();
            $table->enum('estado', ['abierto', 'en_revision', 'resuelto', 'descartado'])->default('abierto')->change();
        });
    }
};
