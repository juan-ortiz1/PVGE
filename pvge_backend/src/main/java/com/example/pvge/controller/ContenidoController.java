package com.example.pvge.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.contenido.ContenidoRequest;
import com.example.pvge.dto.contenido.ContenidoResponse;
import com.example.pvge.service.ContenidoService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/contenidos")
@RequiredArgsConstructor
public class ContenidoController {
    private final ContenidoService contenidoService;

    @GetMapping("/{id}")
    public ResponseEntity<ContenidoResponse> getContenidoById(@PathVariable Integer id, Authentication authentication) {
        return ResponseEntity.ok(contenidoService.getContenidoById(id, authentication));
    }

    @GetMapping("/{cursoId}")
    public ResponseEntity<List<ContenidoResponse>> getListaContenidos(@PathVariable Integer cursoId, Authentication authentication) {
        return ResponseEntity.ok(contenidoService.getListaContenidos(cursoId,authentication));
    }
    
    @PostMapping()
    public ResponseEntity<ContenidoResponse> crearContenido(@RequestBody ContenidoRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(contenidoService.crearContenido(request, authentication));
    }

}
