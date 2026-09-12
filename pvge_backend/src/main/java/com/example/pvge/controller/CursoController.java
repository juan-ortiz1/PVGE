package com.example.pvge.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.curso.CursoRequest;
import com.example.pvge.dto.curso.CursoResponse;
import com.example.pvge.service.CursoService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController 
@RequestMapping("/api/cursos")
@RequiredArgsConstructor 
public class CursoController {
    private final CursoService cursoService;

    @PostMapping()
    public ResponseEntity<CursoResponse> addCurso(@RequestBody CursoRequest request, Authentication authentication) {
        return ResponseEntity.ok(cursoService.addCurso(request, authentication));
    }
    
}
