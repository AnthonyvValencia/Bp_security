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
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('name');

            $table->string('nombres')->after('id');
            $table->string('apellidos')->after('nombres');
            $table->string('telefono')->after('email_verified_at');
            $table->string('direccion')->after('telefono');
            $table->string('barrio')->after('direccion');
            $table->string('numero_casa')->after('barrio');
            $table->text('referencias_domicilio')->nullable()->after('numero_casa');
            $table->string('foto')->nullable()->after('referencias_domicilio');
            $table->enum('rol', ['administrador', 'lider', 'ciudadano'])->default('ciudadano')->after('foto');
            $table->enum('estado', ['activo', 'suspendido'])->default('activo')->after('rol');
            $table->enum('tipo_sangre', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
                ->nullable()->after('estado');
            $table->text('condiciones_medicas')->nullable()->after('tipo_sangre');
            $table->decimal('latitud', 10, 7)->nullable()->after('condiciones_medicas');
            $table->decimal('longitud', 10, 7)->nullable()->after('latitud');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'nombres',
                'apellidos',
                'telefono',
                'direccion',
                'barrio',
                'numero_casa',
                'referencias_domicilio',
                'foto',
                'rol',
                'estado',
                'tipo_sangre',
                'condiciones_medicas',
                'latitud',
                'longitud',
            ]);

            $table->string('name')->after('id');
        });
    }
};
