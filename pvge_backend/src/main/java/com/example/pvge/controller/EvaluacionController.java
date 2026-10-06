package com.example.pvge.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.evaluacion.EvaluacionRequest;
import com.example.pvge.dto.evaluacion.EvaluacionResponse;
import com.example.pvge.dto.intento.ResponderEvaluacionRequest;
import com.example.pvge.dto.intento.ResultadoEvaluacionResponse;
import com.example.pvge.service.EvaluacionService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/evaluaciones")
@RequiredArgsConstructor
public class EvaluacionController {

    private final EvaluacionService evaluacionService;

    @PostMapping
    public ResponseEntity<EvaluacionResponse> crearEvaluacion(@RequestBody EvaluacionRequest request, Authentication authentication) {
        return ResponseEntity.ok(evaluacionService.crearEvaluacion(request, authentication));
    }

    @GetMapping("/curso/{cursoId}")
    public ResponseEntity<List<EvaluacionResponse>> listarEvaluacionesPorCurso(@PathVariable Integer cursoId, Authentication authentication) {
        return ResponseEntity.ok(evaluacionService.listarEvaluacionesPorCurso(cursoId, authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvaluacionResponse> obtenerEvaluacion(@PathVariable Integer id, Authentication authentication) {
        return ResponseEntity.ok(evaluacionService.obtenerEvaluacion(id, authentication));
    }

    @PostMapping("/{id}/responder")
    public ResponseEntity<ResultadoEvaluacionResponse> responderEvaluacion(@PathVariable Integer id, @RequestBody ResponderEvaluacionRequest request, Authentication authentication) {
        return ResponseEntity.ok(evaluacionService.responderEvaluacion(id, request, authentication));
    }
}
