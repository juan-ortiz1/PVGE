package com.example.pvge.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String remitente;

    @Value("${codigo.expiracion-minutos}")
    private int expiracionMinutos;

    @Async
    public void enviarCodigoRecuperacion(String destino, String codigo) {
        enviar(destino, "PVGE - Recuperación de contraseña", "Tu código de recuperación es: " + codigo
                + "\n\nCaduca en " + expiracionMinutos + " minutos. Si no lo solicitaste, ignora este correo.");
    }

    @Async
    public void enviarCodigoVerificacion(String destino, String codigo) {
        enviar(destino, "PVGE - Verifica tu correo", "Tu código de verificación es: " + codigo
                + "\n\nCaduca en " + expiracionMinutos + " minutos. Si no creaste una cuenta en PVGE, ignora este correo.");
    }

    private void enviar(String destino, String asunto, String texto) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(remitente);
        mensaje.setTo(destino);
        mensaje.setSubject(asunto);
        mensaje.setText(texto);
        mailSender.send(mensaje);
    }
}
