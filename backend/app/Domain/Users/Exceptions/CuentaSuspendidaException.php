<?php

namespace App\Domain\Users\Exceptions;

use RuntimeException;

/**
 * Se lanza cuando un usuario con la cuenta suspendida por el administrador
 * intenta iniciar sesión. El controlador la devuelve como 403 con el mensaje
 * en español.
 */
class CuentaSuspendidaException extends RuntimeException {}
