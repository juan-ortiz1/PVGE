package com.example.pvge.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.progreso.ProgresoCursoResponse;
import com.example.pvge.service.ProgresoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/progreso")
@RequiredArgsConstructor
public class ProgresoController {
    private final ProgresoService progresoService;

    @GetMapping
    public ResponseEntity<List<ProgresoCursoResponse>> obtenerProgreso(Authentication authentication) {
        return ResponseEntity.ok(progresoService.obtenerProgreso(authentication));
    }

    @GetMapping("/cursos/{cursoId}")
    public ResponseEntity<ProgresoCursoResponse> obtenerProgresoCurso(@PathVariable Integer cursoId, Authentication authentication) {
        return ResponseEntity.ok(progresoService.obtenerProgresoCurso(cursoId, authentication));
    }
}
