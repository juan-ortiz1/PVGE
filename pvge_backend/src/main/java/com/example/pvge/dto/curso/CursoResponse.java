package com.example.pvge.dto.curso;

import java.time.LocalDateTime;

import com.example.pvge.dto.instructor.InstructorResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CursoResponse {
    private Integer id;
    private String titulo;
    private String descripcion;
    private LocalDateTime fechaCreacion;
    private InstructorResponse instructor;
}
