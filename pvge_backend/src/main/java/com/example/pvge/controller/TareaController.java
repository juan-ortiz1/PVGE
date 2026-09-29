package com.example.pvge.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.tarea.TareaRequest;
import com.example.pvge.dto.tarea.TareaResponse;
import com.example.pvge.service.TareaService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/tareas")
@RequiredArgsConstructor
public class TareaController {
    private final TareaService tareaService;

    @GetMapping("/{id}")
    public ResponseEntity<TareaResponse> getTareaById(@PathVariable Integer id, Authentication authentication) {
        return ResponseEntity.ok(tareaService.getTareaById(id, authentication));
    }

    @GetMapping("/curso/{cursoId}")
    public ResponseEntity<List<TareaResponse>> getListaTareas(@PathVariable Integer cursoId, Authentication authentication) {
        return ResponseEntity.ok(tareaService.getListaTareas(cursoId, authentication));
    }
    
    @PostMapping()
    public ResponseEntity<TareaResponse> crearTarea(@RequestBody TareaRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(tareaService.crearTarea(request, authentication));
    }

}