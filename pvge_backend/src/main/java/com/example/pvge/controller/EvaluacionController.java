package com.example.pvge.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.evaluacion.EvaluacionRequest;
import com.example.pvge.model.Evaluacion;
import com.example.pvge.service.EvaluacionService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController 
@RequestMapping("/api/evaluaciones")
@RequiredArgsConstructor 
public class EvaluacionController {

    private final EvaluacionService evaluacionService;

    @PostMapping
    public ResponseEntity<Evaluacion> crearEvaluacion(@RequestBody EvaluacionRequest request, Authentication authentication) {
        return ResponseEntity.ok(evaluacionService.crearEvaluacion(request, authentication));
    }
}
