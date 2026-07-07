<?php

namespace App\Domain\Panic\Exceptions;

use RuntimeException;

/**
 * Violación de una regla de negocio de alertas de pánico (ej. transición de
 * estado inválida). El controller la captura y la devuelve como 422.
 */
class ReglaAlertaException extends RuntimeException {}
