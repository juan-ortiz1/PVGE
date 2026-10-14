package com.example.pvge.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.progreso.ProgresoCursoResponse;
import com.example.pvge.dto.progreso.ProgresoEstudianteResponse;
import com.example.pvge.service.ProgresoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/progreso")
@RequiredArgsConstructor
public class ProgresoController {
    private final ProgresoService progresoService;

    /**
     * Método GET para obtener el progreso de todos los cursos de un estudiante. 
     * @param authentication
     * @return List<ProgresoCursoResponse> del progreso de un estudiante para todos los cursos
     */
    @GetMapping
    public ResponseEntity<List<ProgresoCursoResponse>> obtenerProgreso(Authentication authentication) {
        return ResponseEntity.ok(progresoService.obtenerProgreso(authentication));
    }

    /**
     * Método GET para obtener el progreso de un curso por su ID para un estudiante
     * @param cursoId
     * @param authentication
     * @return ProgresoCursoResponse de cada estudiante
     */
    @GetMapping("/cursos/{cursoId}")
    public ResponseEntity<ProgresoCursoResponse> obtenerProgresoCurso(@PathVariable Integer cursoId,
            Authentication authentication) {
        return ResponseEntity.ok(progresoService.obtenerProgresoCurso(cursoId, authentication));
    }

    @GetMapping("/instructor/curso/{cursoId}")
    public ResponseEntity<List<ProgresoEstudianteResponse>> obtenerProgresoEstudiante(@PathVariable Integer cursoId, Authentication authentication) {
        return ResponseEntity.ok(progresoService.obtenerProgresoEstudiantes(cursoId, authentication));
    }

}
