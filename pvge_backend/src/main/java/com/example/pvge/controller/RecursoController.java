package com.example.pvge.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.recurso.RecursoRequest;
import com.example.pvge.dto.recurso.RecursoResponse;
import com.example.pvge.service.RecursoService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;



@RestController
@RequestMapping("/api/recursos")
@RequiredArgsConstructor
public class RecursoController {
    private final RecursoService recursoService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RecursoResponse> addRecurso(@ModelAttribute RecursoRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(recursoService.addRecurso(request, authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecursoResponse> getRecursoById(@PathVariable Integer id, Authentication authentication) {
        return ResponseEntity.ok(recursoService.getRecursoById(id, authentication));
    }

    @GetMapping("/contenido/{contenidoId}")
    public ResponseEntity<List<RecursoResponse>> getRecursosByContenido(@PathVariable Integer contenidoId, Authentication authentication) {
        return ResponseEntity.ok(recursoService.getRecursosByContenido(contenidoId, authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteRecurso(@PathVariable Integer id, Authentication authentication){
        return ResponseEntity.ok(recursoService.deleteRecurso(id, authentication));
    }
    
    
}
