package com.example.pvge.mapper;

import org.springframework.stereotype.Component;

import com.example.pvge.dto.recurso.RecursoResponse;
import com.example.pvge.model.Recurso;

@Component 
public class RecursoMapper {
    public RecursoResponse toResponse(Recurso recurso){
        return RecursoResponse.builder()
        .id(recurso.getId())
        .nombre(recurso.getNombre())
        .url(recurso.getUrl())
        .tipo(recurso.getTipo())
        .fechaSubida(recurso.getFechaSubida())
        .contenidoId(recurso.getContenido().getId())
        .build();
    }
}
