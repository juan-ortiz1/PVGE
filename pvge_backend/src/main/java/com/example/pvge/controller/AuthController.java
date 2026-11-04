package com.example.pvge.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.auth.AuthResponse;
import com.example.pvge.dto.auth.LoginRequest;
import com.example.pvge.dto.auth.OlvidePasswordRequest;
import com.example.pvge.dto.auth.ReenviarVerificacionRequest;
import com.example.pvge.dto.auth.RefreshTokenRequest;
import com.example.pvge.dto.auth.RestablecerPasswordRequest;
import com.example.pvge.dto.auth.VerificarCodigoRequest;
import com.example.pvge.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request.getRefreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.logout(request.getRefreshToken()));
    }

    @PostMapping("/verificar-correo")
    public ResponseEntity<AuthResponse> verificarCorreo(@Valid @RequestBody VerificarCodigoRequest request) {
        return ResponseEntity.ok(authService.verificarCorreo(request));
    }

    @PostMapping("/reenviar-verificacion")
    public ResponseEntity<Map<String, String>> reenviarVerificacion(
            @Valid @RequestBody ReenviarVerificacionRequest request) {
        return ResponseEntity.ok(Map.of("message", authService.reenviarVerificacion(request)));
    }

    @PostMapping("/olvide-password")
    public ResponseEntity<Map<String, String>> olvidePassword(@Valid @RequestBody OlvidePasswordRequest request) {
        return ResponseEntity.ok(Map.of("message", authService.solicitarRecuperacion(request)));
    }

    @PostMapping("/verificar-codigo")
    public ResponseEntity<Map<String, String>> verificarCodigo(@Valid @RequestBody VerificarCodigoRequest request) {
        return ResponseEntity.ok(Map.of("message", authService.verificarCodigo(request)));
    }

    @PostMapping("/restablecer-password")
    public ResponseEntity<Map<String, String>> restablecerPassword(
            @Valid @RequestBody RestablecerPasswordRequest request) {
        return ResponseEntity.ok(Map.of("message", authService.restablecerPassword(request)));
    }
}
