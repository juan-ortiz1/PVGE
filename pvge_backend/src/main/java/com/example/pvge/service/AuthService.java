package com.example.pvge.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.example.pvge.dto.auth.AuthResponse;
import com.example.pvge.dto.auth.LoginRequest;
import com.example.pvge.jwt.JWTService;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UsuarioRepository usuarioRepository;
    private final AuthenticationManager authenticationManager;
    private final JWTService jwtService;

    public AuthResponse login(LoginRequest request) {
        authenticationManager
                .authenticate(new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getPassword()));
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo()).orElseThrow();
        String token = jwtService.getToken(usuario);
        String refreshToken = jwtService.getRefreshToken(usuario);
        return AuthResponse.builder()
                .accessToken(token)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtService.getTokenType(refreshToken).equals("refresh")) {
            throw new RuntimeException("Token inválido");
        }
        String correo = jwtService.getUsernameFromToken(refreshToken);
        UserDetails usuario = usuarioRepository.findByCorreo(correo).orElseThrow();
        if (jwtService.isTokenValid(refreshToken, usuario)) {
            String token = jwtService.getToken(usuario);
            String newRefreshToken = jwtService.getRefreshToken(usuario);
            return AuthResponse.builder()
                    .accessToken(token)
                    .refreshToken(newRefreshToken)
                    .build();
        } else {
            throw new RuntimeException("Refresh Token inválido");
        }
    }

}
