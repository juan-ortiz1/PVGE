package com.example.pvge.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.notificacion.NotificacionResponse;
import com.example.pvge.service.NotificacionService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {
    private final NotificacionService notificacionService;

    @GetMapping()
    public ResponseEntity<List<NotificacionResponse>> obtenerMisNotificaciones(Authentication authentication) {
        return ResponseEntity.ok(notificacionService.obtenerMisNotificaciones(authentication));
    }

    @GetMapping("/no-leidas/count")
    public ResponseEntity<Long> contarNoLeidas(Authentication authentication) {
        return ResponseEntity.ok(notificacionService.contarNoLeidas(authentication));
    }

    @PutMapping("/{id}/leida")
    public ResponseEntity<NotificacionResponse> marcarComoLeida(@PathVariable Integer id,
            Authentication authentication) {
        return ResponseEntity.ok(notificacionService.marcarComoLeida(id, authentication));
    }

    @PutMapping("/leer-todas")
    public ResponseEntity<String> marcarTodasComoLeidas(Authentication authentication) {
        return ResponseEntity.ok(notificacionService.marcarTodasComoLeidas(authentication));
    }

}
