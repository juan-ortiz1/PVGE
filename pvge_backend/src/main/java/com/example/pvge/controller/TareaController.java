package com.example.pvge.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.pvge.dto.tarea.CalificacionEntregaRequest;
import com.example.pvge.dto.tarea.EntregaTareaResponse;
import com.example.pvge.dto.tarea.TareaRequest;
import com.example.pvge.dto.tarea.TareaResponse;
import com.example.pvge.service.TareaService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
    public ResponseEntity<List<TareaResponse>> getListaTareas(@PathVariable Integer cursoId,
            Authentication authentication) {
        return ResponseEntity.ok(tareaService.getListaTareas(cursoId, authentication));
    }

    @PostMapping()
    public ResponseEntity<TareaResponse> crearTarea(@RequestBody TareaRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(tareaService.crearTarea(request, authentication));
    }

    @PostMapping(value = "/{tareaId}/entregas", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EntregaTareaResponse> entregarTarea(@PathVariable Integer tareaId,
            @RequestParam("archivo") MultipartFile archivo, Authentication authentication) {
        return ResponseEntity.ok(tareaService.entregarTarea(tareaId, archivo, authentication));
    }

    @PutMapping("/entregas/{entregaId}/calificacion")
    public ResponseEntity<EntregaTareaResponse> calificarTarea(@PathVariable Integer entregaId,
            @RequestBody CalificacionEntregaRequest request, Authentication authentication) {
        return ResponseEntity.ok(tareaService.calificarTarea(entregaId, request, authentication));
    }

    @GetMapping("/curso/{cursoId}/entregas")
    public ResponseEntity<List<EntregaTareaResponse>> obtenerEntregasCurso(
            @PathVariable Integer cursoId,
            Authentication authentication) {

        return ResponseEntity.ok(
                tareaService.obtenerEntregasCurso(cursoId, authentication));
    }

    @GetMapping("/{tareaId}/mis-entregas")
    public ResponseEntity<EntregaTareaResponse> obtenerMiEntrega(
            @PathVariable Integer tareaId,
            Authentication authentication) {

        return ResponseEntity.ok(
                tareaService.obtenerMiEntrega(tareaId, authentication));
    }

    @GetMapping("/mis-calificaciones")
    public ResponseEntity<List<EntregaTareaResponse>> obtenerMisCalificaciones(
            Authentication authentication) {

        return ResponseEntity.ok(
                tareaService.obtenerMisCalificaciones(authentication));
    }

}