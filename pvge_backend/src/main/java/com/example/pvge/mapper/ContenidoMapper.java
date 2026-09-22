package com.example.pvge.mapper;

import org.springframework.stereotype.Component;

import com.example.pvge.dto.contenido.ContenidoResponse;
import com.example.pvge.model.Contenido;

@Component 
public class ContenidoMapper {
    public ContenidoResponse toResponse(Contenido contenido){
        return ContenidoResponse.builder()
        .id(contenido.getId())
        .nombre(contenido.getTitulo())
        .descripcion(contenido.getDescripcion())
        .fechaCreacion(contenido.getFechaCreacion())
        .cursoId(contenido.getCurso().getId())
        .build();
    }
}
