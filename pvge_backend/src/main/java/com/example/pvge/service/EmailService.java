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

    @Value("${recuperacion.expiracion-minutos}")
    private int expiracionMinutos;

    @Async
    public void enviarCodigoRecuperacion(String destino, String codigo) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(remitente);
        mensaje.setTo(destino);
        mensaje.setSubject("PVGE - Recuperación de contraseña");
        mensaje.setText("Tu código de recuperación es: " + codigo
                + "\n\nCaduca en " + expiracionMinutos + " minutos. Si no lo solicitaste, ignora este correo.");
        mailSender.send(mensaje);
    }
}
