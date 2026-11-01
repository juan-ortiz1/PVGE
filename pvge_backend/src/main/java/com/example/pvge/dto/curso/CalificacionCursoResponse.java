package com.example.pvge.dto.curso;

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
public class CalificacionCursoResponse {
    private Integer cursoId;
    private Integer estrellas;
    private Double promedio;
    private Integer totalCalificaciones;
    private boolean puedeCalificar;
}
