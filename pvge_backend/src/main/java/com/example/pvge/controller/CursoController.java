package com.example.pvge.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.curso.CursoRequest;
import com.example.pvge.dto.curso.CursoResponse;
import com.example.pvge.service.CursoService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;




@RestController 
@RequestMapping("/api/cursos")
@RequiredArgsConstructor 
public class CursoController {
    private final CursoService cursoService;

    @PostMapping()
    public ResponseEntity<CursoResponse> addCurso(@RequestBody CursoRequest request, Authentication authentication) {
        return ResponseEntity.ok(cursoService.addCurso(request, authentication));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CursoResponse> actualizarCurso(@PathVariable Integer id, @RequestBody CursoRequest request, Authentication authentication) {
        return ResponseEntity.ok(cursoService.actualizarCurso(id, request, authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CursoResponse> getCursoById(@PathVariable Integer id) {
        return ResponseEntity.ok(cursoService.getCursoById(id));
    }
    
    @GetMapping()
    public ResponseEntity<List<CursoResponse>> getListaCursos(@RequestParam(required = false) String titulo, Authentication authentication) {
        return ResponseEntity.ok(cursoService.getListaCursos(titulo, authentication));
    }
    
    @PostMapping("/inscribir/{id}")
    public ResponseEntity<String> inscribirCurso(@PathVariable Integer id, Authentication authentication) {
        return ResponseEntity.ok(cursoService.inscribirCurso(id, authentication));
    }
    
    
}
