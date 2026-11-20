package com.example.pvge.mapper;

import org.springframework.stereotype.Component;

import com.example.pvge.dto.tarea.TareaResponse;
import com.example.pvge.model.Tarea;

@Component
public class TareaMapper {
    public TareaResponse toResponse(Tarea tarea){
        return TareaResponse.builder()
        .id(tarea.getId())
        .titulo(tarea.getTitulo())
        .descripcion(tarea.getDescripcion())
        .fechaCreacion(tarea.getFechaCreacion())
        .fechaEntrega(tarea.getFechaEntrega())
        .cursoId(tarea.getCurso().getId())
        .build();
    }
}
