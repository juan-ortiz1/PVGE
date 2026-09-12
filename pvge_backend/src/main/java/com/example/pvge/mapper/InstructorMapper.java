package com.example.pvge.mapper;

import org.springframework.stereotype.Component;

import com.example.pvge.dto.instructor.InstructorResponse;
import com.example.pvge.model.Instructor;

@Component
public class InstructorMapper {
    public InstructorResponse toResponse(Instructor instructor) {
        return InstructorResponse.builder()
                .id(instructor.getId())
                .nombre(instructor.getNombre())
                .correo(instructor.getUsuario().getCorreo())
                .disciplina(instructor.getDisciplina())
                .tier(instructor.getTier())
                .build();
    }
}
