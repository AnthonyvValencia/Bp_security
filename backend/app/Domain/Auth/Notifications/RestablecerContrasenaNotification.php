<?php

namespace App\Domain\Auth\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Correo de recuperación de contraseña adaptado a una API pura: la app móvil
 * pide un "código de recuperación" que el usuario copia del correo, así que se
 * envía el token como código en vez del enlace web por defecto de Laravel
 * (que apuntaba a la ruta `password.reset`, inexistente aquí).
 */
class RestablecerContrasenaNotification extends Notification
{
    public function __construct(public readonly string $token) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $minutosVigencia = (int) config(
            'auth.passwords.'.config('auth.defaults.passwords').'.expire',
            60,
        );

        return (new MailMessage)
            ->subject('BP Security — Código para restablecer tu contraseña')
            ->greeting("Hola {$notifiable->nombres},")
            ->line('Recibimos una solicitud para restablecer la contraseña de tu cuenta.')
            ->line('Copia este código y pégalo en la app, en la pantalla "Restablecer contraseña":')
            ->line("## `{$this->token}`")
            ->line("El código vence en {$minutosVigencia} minutos y solo puede usarse una vez.")
            ->line('Si tú no solicitaste este cambio, ignora este correo: tu contraseña seguirá siendo la misma.')
            ->salutation('— Equipo BP Security');
    }
}
