<?php

namespace App\Domain\Reports\Exceptions;

use RuntimeException;

/**
 * Violación de una regla de negocio de reportes (ej. no pertenece a ninguna
 * comunidad, transición de estado inválida). El controller la captura y la
 * devuelve como 422.
 */
class ReglaReporteException extends RuntimeException {}
