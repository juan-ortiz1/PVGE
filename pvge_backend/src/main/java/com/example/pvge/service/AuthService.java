package com.example.pvge.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.pvge.dto.auth.AuthResponse;
import com.example.pvge.dto.auth.LoginRequest;
import com.example.pvge.dto.auth.OlvidePasswordRequest;
import com.example.pvge.dto.auth.RestablecerPasswordRequest;
import com.example.pvge.dto.auth.VerificarCodigoRequest;
import com.example.pvge.jwt.JWTService;
import com.example.pvge.model.PasswordResetToken;
import com.example.pvge.model.RefreshToken;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.PasswordResetTokenRepository;
import com.example.pvge.repository.RefreshTokenRepository;
import com.example.pvge.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final JWTService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${recuperacion.expiracion-minutos}")
    private int expiracionMinutos;

    @Value("${recuperacion.max-intentos}")
    private int maxIntentos;

    public AuthResponse login(LoginRequest request) {
        authenticationManager
                .authenticate(new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getPassword()));
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo()).orElseThrow();
        String token = jwtService.getToken(usuario);
        String refreshToken = jwtService.getRefreshToken(usuario);
        guardarRefreshToken(usuario, refreshToken);
        return AuthResponse.builder()
                .accessToken(token)
                .refreshToken(refreshToken)
                .rol(usuario.getRol())
                .build();
    }

    public AuthResponse refreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token inválido"));
        if (refreshToken.isRevocado()) {
            throw new RuntimeException("Refresh token revocado");
        }
        if (refreshToken.getFechaExpiracion().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Refresh token expirado");
        }
        Usuario usuario = refreshToken.getUsuario();
        if (!jwtService.isTokenValid(token, usuario)) {
            throw new RuntimeException("Refresh token inválido");
        }
        refreshToken.setRevocado(true);
        refreshTokenRepository.save(refreshToken);

        String accessToken = jwtService.getToken(usuario);
        String newRefreshToken = jwtService.getRefreshToken(usuario);
        guardarRefreshToken(usuario, newRefreshToken);
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshToken)
                .rol(usuario.getRol())
                .build();
    }

    public String logout(String token){
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token).orElseThrow(()-> new RuntimeException("Refresh token inválido"));
        refreshToken.setRevocado(true);
        refreshTokenRepository.save(refreshToken);
        return "Cierre de sesión exitoso";
    }

    public String solicitarRecuperacion(OlvidePasswordRequest request) {
        usuarioRepository.findByCorreo(request.getCorreo()).ifPresent(usuario -> {
            List<PasswordResetToken> anteriores = passwordResetTokenRepository.findByUsuarioAndUsadoFalse(usuario);
            anteriores.forEach(t -> t.setUsado(true));
            passwordResetTokenRepository.saveAll(anteriores);

            String codigo = String.format("%06d", RANDOM.nextInt(1_000_000));
            passwordResetTokenRepository.save(PasswordResetToken.builder()
                    .codigoHash(passwordEncoder.encode(codigo))
                    .fechaCreacion(LocalDateTime.now())
                    .fechaExpiracion(LocalDateTime.now().plusMinutes(expiracionMinutos))
                    .usado(false)
                    .intentos(0)
                    .usuario(usuario)
                    .build());

            emailService.enviarCodigoRecuperacion(usuario.getCorreo(), codigo);
        });
        // Misma respuesta exista o no el correo, para no revelar qué cuentas existen
        return "Si el correo está registrado, recibirás un código de recuperación";
    }

    public String verificarCodigo(VerificarCodigoRequest request) {
        validarCodigo(request.getCorreo(), request.getCodigo());
        return "Código válido";
    }

    // noRollbackFor: si el código es incorrecto, el aumento de intentos se guarda igualmente
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public String restablecerPassword(RestablecerPasswordRequest request) {
        PasswordResetToken token = validarCodigo(request.getCorreo(), request.getCodigo());
        Usuario usuario = token.getUsuario();

        usuario.setPassword(passwordEncoder.encode(request.getNuevaPassword()));
        usuarioRepository.save(usuario);

        token.setUsado(true);
        passwordResetTokenRepository.save(token);

        // Cierra todas las sesiones abiertas del usuario
        refreshTokenRepository.deleteByUsuario(usuario);
        return "Contraseña actualizada correctamente";
    }

    private PasswordResetToken validarCodigo(String correo, String codigo) {
        Usuario usuario = usuarioRepository.findByCorreo(correo).orElseThrow(this::codigoInvalido);
        PasswordResetToken token = passwordResetTokenRepository
                .findTopByUsuarioAndUsadoFalseOrderByFechaCreacionDesc(usuario)
                .orElseThrow(this::codigoInvalido);

        if (token.getFechaExpiracion().isBefore(LocalDateTime.now())) {
            throw codigoInvalido();
        }
        if (token.getIntentos() >= maxIntentos) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Demasiados intentos, solicita un nuevo código");
        }
        if (!passwordEncoder.matches(codigo, token.getCodigoHash())) {
            token.setIntentos(token.getIntentos() + 1);
            passwordResetTokenRepository.save(token);
            throw codigoInvalido();
        }
        return token;
    }

    private ResponseStatusException codigoInvalido() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código inválido o expirado");
    }

    private void guardarRefreshToken(Usuario usuario, String token) {
        RefreshToken refreshToken = RefreshToken.builder()
                .token(token)
                .usuario(usuario)
                .fechaExpiracion(LocalDateTime.now().plusDays(7))
                .revocado(false)
                .build();

        refreshTokenRepository.save(refreshToken);
    }

}
