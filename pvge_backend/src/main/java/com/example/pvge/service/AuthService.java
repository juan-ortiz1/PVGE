package com.example.pvge.service;

import java.time.LocalDateTime;

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
import com.example.pvge.dto.auth.ReenviarVerificacionRequest;
import com.example.pvge.dto.auth.RestablecerPasswordRequest;
import com.example.pvge.dto.auth.VerificarCodigoRequest;
import com.example.pvge.jwt.JWTService;
import com.example.pvge.model.CodigoVerificacion;
import com.example.pvge.model.RefreshToken;
import com.example.pvge.model.TipoCodigo;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.RefreshTokenRepository;
import com.example.pvge.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final JWTService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final CodigoVerificacionService codigoVerificacionService;

    public AuthResponse login(LoginRequest request) {
        authenticationManager
                .authenticate(new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getPassword()));
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo()).orElseThrow();
        // Se comprueba después de la contraseña, para no revelar qué correos están sin verificar
        if (usuario.isPendienteVerificacion()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Correo no verificado");
        }
        return generarAuthResponse(usuario);
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
        return generarAuthResponse(usuario);
    }

    public String logout(String token){
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token).orElseThrow(()-> new RuntimeException("Refresh token inválido"));
        refreshToken.setRevocado(true);
        refreshTokenRepository.save(refreshToken);
        return "Cierre de sesión exitoso";
    }

    // noRollbackFor: si el código es incorrecto, el intento consumido se guarda igualmente
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public AuthResponse verificarCorreo(VerificarCodigoRequest request) {
        CodigoVerificacion token = codigoVerificacionService.validar(
                request.getCorreo(), request.getCodigo(), TipoCodigo.VERIFICACION_CORREO);
        Usuario usuario = token.getUsuario();

        usuario.setCorreoVerificado(true);
        usuarioRepository.save(usuario);
        codigoVerificacionService.marcarUsado(token);
        return generarAuthResponse(usuario);
    }

    public String reenviarVerificacion(ReenviarVerificacionRequest request) {
        usuarioRepository.findByCorreo(request.getCorreo())
                .filter(Usuario::isPendienteVerificacion)
                .ifPresent(usuario -> codigoVerificacionService.generarYEnviar(usuario, TipoCodigo.VERIFICACION_CORREO));
        // Misma respuesta en todos los casos, para no revelar qué cuentas existen
        return "Si la cuenta está pendiente de verificación, recibirás un nuevo código";
    }

    public String solicitarRecuperacion(OlvidePasswordRequest request) {
        usuarioRepository.findByCorreo(request.getCorreo())
                .ifPresent(usuario -> codigoVerificacionService.generarYEnviar(usuario, TipoCodigo.RECUPERACION));
        // Misma respuesta exista o no el correo, para no revelar qué cuentas existen
        return "Si el correo está registrado, recibirás un código de recuperación";
    }

    public String verificarCodigo(VerificarCodigoRequest request) {
        codigoVerificacionService.validar(request.getCorreo(), request.getCodigo(), TipoCodigo.RECUPERACION);
        return "Código válido";
    }

    // noRollbackFor: si el código es incorrecto, el intento consumido se guarda igualmente
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public String restablecerPassword(RestablecerPasswordRequest request) {
        CodigoVerificacion token = codigoVerificacionService.validar(
                request.getCorreo(), request.getCodigo(), TipoCodigo.RECUPERACION);
        Usuario usuario = token.getUsuario();

        usuario.setPassword(passwordEncoder.encode(request.getNuevaPassword()));
        // Recibir el código también demuestra que el correo es suyo
        usuario.setCorreoVerificado(true);
        usuarioRepository.save(usuario);
        codigoVerificacionService.marcarUsado(token);

        // Cierra todas las sesiones abiertas del usuario
        refreshTokenRepository.deleteByUsuario(usuario);
        return "Contraseña actualizada correctamente";
    }

    private AuthResponse generarAuthResponse(Usuario usuario) {
        String accessToken = jwtService.getToken(usuario);
        String refreshToken = jwtService.getRefreshToken(usuario);
        guardarRefreshToken(usuario, refreshToken);
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .rol(usuario.getRol())
                .build();
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
