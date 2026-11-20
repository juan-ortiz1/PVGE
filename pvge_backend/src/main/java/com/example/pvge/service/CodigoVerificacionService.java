package com.example.pvge.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.pvge.model.CodigoVerificacion;
import com.example.pvge.model.TipoCodigo;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.CodigoVerificacionRepository;
import com.example.pvge.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CodigoVerificacionService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final CodigoVerificacionRepository codigoVerificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${codigo.expiracion-minutos}")
    private int expiracionMinutos;

    @Value("${codigo.max-intentos}")
    private int maxIntentos;

    @Value("${codigo.espera-reenvio-segundos}")
    private int esperaReenvioSegundos;

    @Value("${codigo.max-envios-por-hora}")
    private int maxEnviosPorHora;

    // Si el usuario superó el límite de envíos no se genera nada, para que nadie pueda saturar un buzón ajeno
    public void generarYEnviar(Usuario usuario, TipoCodigo tipo) {
        if (!puedeEnviar(usuario, tipo)) {
            return;
        }
        List<CodigoVerificacion> anteriores = codigoVerificacionRepository.findByUsuarioAndTipoAndUsadoFalse(usuario, tipo);
        anteriores.forEach(c -> c.setUsado(true));
        codigoVerificacionRepository.saveAll(anteriores);

        String codigo = String.format("%06d", RANDOM.nextInt(1_000_000));
        codigoVerificacionRepository.save(CodigoVerificacion.builder()
                .tipo(tipo)
                .codigoHash(passwordEncoder.encode(codigo))
                .fechaCreacion(LocalDateTime.now())
                .fechaExpiracion(LocalDateTime.now().plusMinutes(expiracionMinutos))
                .usado(false)
                .intentos(0)
                .usuario(usuario)
                .build());

        if (tipo == TipoCodigo.RECUPERACION) {
            emailService.enviarCodigoRecuperacion(usuario.getCorreo(), codigo);
        } else {
            emailService.enviarCodigoVerificacion(usuario.getCorreo(), codigo);
        }
    }

    public CodigoVerificacion validar(String correo, String codigo, TipoCodigo tipo) {
        Usuario usuario = usuarioRepository.findByCorreo(correo).orElseThrow(this::codigoInvalido);
        CodigoVerificacion token = codigoVerificacionRepository
                .findTopByUsuarioAndTipoAndUsadoFalseOrderByFechaCreacionDesc(usuario, tipo)
                .orElseThrow(this::codigoInvalido);

        if (token.getFechaExpiracion().isBefore(LocalDateTime.now())) {
            throw codigoInvalido();
        }
        // El intento se consume antes de comparar: así las peticiones en paralelo no pueden saltarse el límite
        if (codigoVerificacionRepository.consumirIntento(token.getId(), maxIntentos) == 0) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Demasiados intentos, solicita un nuevo código");
        }
        if (!passwordEncoder.matches(codigo, token.getCodigoHash())) {
            throw codigoInvalido();
        }
        return token;
    }

    public void marcarUsado(CodigoVerificacion token) {
        token.setUsado(true);
        codigoVerificacionRepository.save(token);
    }

    private boolean puedeEnviar(Usuario usuario, TipoCodigo tipo) {
        LocalDateTime ahora = LocalDateTime.now();
        boolean muyPronto = codigoVerificacionRepository.findTopByUsuarioAndTipoOrderByFechaCreacionDesc(usuario, tipo)
                .map(c -> c.getFechaCreacion().isAfter(ahora.minusSeconds(esperaReenvioSegundos)))
                .orElse(false);
        long enviosUltimaHora = codigoVerificacionRepository
                .countByUsuarioAndTipoAndFechaCreacionAfter(usuario, tipo, ahora.minusHours(1));
        return !muyPronto && enviosUltimaHora < maxEnviosPorHora;
    }

    private ResponseStatusException codigoInvalido() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código inválido o expirado");
    }
}
