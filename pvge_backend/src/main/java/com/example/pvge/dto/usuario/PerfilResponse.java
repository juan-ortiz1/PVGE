package com.example.pvge.dto.usuario;

import com.example.pvge.dto.estudiante.EstudianteResponse;
import com.example.pvge.dto.instructor.InstructorResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerfilResponse {
    private UsuarioResponse usuario;
    private EstudianteResponse estudiante;
    private InstructorResponse instructor;
}
