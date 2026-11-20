package com.example.pvge.mapper;

import org.springframework.stereotype.Component;

import com.example.pvge.dto.pregunta.PreguntaResponse;
import com.example.pvge.model.Pregunta;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor  
public class PreguntaMapper {

    private final OpcionMapper opcionMapper;
    public PreguntaResponse toResponse(Pregunta pregunta){
        return PreguntaResponse.builder()
        .id(pregunta.getId())
        .enunciado(pregunta.getEnunciado())
        .puntaje(pregunta.getPuntaje())
        .opciones(pregunta.getOpciones().stream().map(opcionMapper::toResponse).toList())
        .build();
    }
}
