package com.example.pvge.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.curso.CalificacionCursoRequest;
import com.example.pvge.dto.curso.CalificacionCursoResponse;
import com.example.pvge.service.CalificacionCursoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/calificaciones/cursos")
@RequiredArgsConstructor
public class CalificacionCursoController {
    private final CalificacionCursoService calificacionCursoService;

    @GetMapping("/{cursoId}")
    public ResponseEntity<CalificacionCursoResponse> obtenerCalificacion(
            @PathVariable Integer cursoId,
            Authentication authentication) {
        return ResponseEntity.ok(calificacionCursoService.obtenerCalificacion(cursoId, authentication));
    }

    @PostMapping("/{cursoId}")
    public ResponseEntity<CalificacionCursoResponse> calificar(
            @PathVariable Integer cursoId,
            @Valid @RequestBody CalificacionCursoRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(calificacionCursoService.calificar(cursoId, request, authentication));
    }
}
