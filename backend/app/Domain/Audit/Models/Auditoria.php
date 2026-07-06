<?php

namespace App\Domain\Audit\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['usuario_id', 'accion', 'entidad_tipo', 'entidad_id', 'metadatos', 'ip'])]
class Auditoria extends Model
{
    protected $table = 'auditorias';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadatos' => 'array',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
