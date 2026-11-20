package com.example.pvge.mapper;

import org.springframework.stereotype.Component;

import com.example.pvge.dto.curso.CursoResponse;
import com.example.pvge.model.Curso;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor 
public class CursoMapper {
    private final InstructorMapper instructorMapper;

    public CursoResponse toResponse(Curso curso) {
        return CursoResponse.builder()
                .id(curso.getId())
                .titulo(curso.getTitulo())
                .descripcion(curso.getDescripcion())
                .fechaCreacion(curso.getFechaCreacion())
                .instructor(instructorMapper.toResponse(curso.getInstructor()))
                .build();
    }
}
