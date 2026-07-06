<?php

namespace App\Domain\Communities\Exceptions;

use RuntimeException;

/**
 * Violación de una regla de negocio de comunidades (ej. ya pertenece a una
 * comunidad activa, la solicitud ya fue revisada, etc.). Los controllers la
 * capturan y la devuelven como 422 con el mensaje en español.
 */
class ReglaComunidadException extends RuntimeException {}
