<?php

namespace App\Domain\Users\Exceptions;

use RuntimeException;

/**
 * Violación de una regla de negocio en la gestión de usuarios por el admin
 * (ej. intentar suspenderse o cambiarse el rol a sí mismo). Los controllers
 * la capturan y la devuelven como 422 con el mensaje en español.
 */
class ReglaUsuarioException extends RuntimeException {}
