package com.example.pvge.mapper;

import org.springframework.stereotype.Component;

import com.example.pvge.dto.evaluacion.EvaluacionResponse;
import com.example.pvge.model.Evaluacion;

import lombok.RequiredArgsConstructor;

@Component 
@RequiredArgsConstructor 
public class EvaluacionMapper {
    private final CursoMapper cursoMapper;
    private final PreguntaMapper preguntaMapper;
    public EvaluacionResponse toResponse(Evaluacion evaluacion){
        return EvaluacionResponse.builder()
        .id(evaluacion.getId())
        .titulo(evaluacion.getTitulo())
        .descripcion(evaluacion.getDescripcion())
        .fechaPublicacion(evaluacion.getFechaPublicacion())
        .fechaVencimiento(evaluacion.getFechaVencimiento())
        .cursoResponse(cursoMapper.toResponse(evaluacion.getCurso()))
        .preguntas(evaluacion.getPreguntas().stream().map(preguntaMapper::toResponse).toList())
        .build();
    }
}
