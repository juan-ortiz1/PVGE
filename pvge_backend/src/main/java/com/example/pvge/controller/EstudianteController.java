package com.example.pvge.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.estudiante.EstudianteRequest;
import com.example.pvge.dto.estudiante.EstudianteResponse;
import com.example.pvge.service.EstudianteService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RequestMapping("/api/estudiantes")
@RestController
@RequiredArgsConstructor
public class EstudianteController {
    private final EstudianteService estudianteService;
    @PostMapping()
    public ResponseEntity<EstudianteResponse> crearEstudiante(@RequestBody EstudianteRequest request) {
        return ResponseEntity.ok(estudianteService.crearEstudiante(request));
    }
    
}
