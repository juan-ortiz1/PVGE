package com.example.pvge.service;

import java.time.LocalDateTime;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import com.example.pvge.dto.auth.AuthResponse;
import com.example.pvge.dto.auth.LoginRequest;
import com.example.pvge.jwt.JWTService;
import com.example.pvge.model.RefreshToken;
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
                .build();
    }

    public String logout(String token){
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token).orElseThrow(()-> new RuntimeException("Refresh token inválido"));
        refreshToken.setRevocado(true);
        refreshTokenRepository.save(refreshToken);
        return "Cierre de sesión exitoso";
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
