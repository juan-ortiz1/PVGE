package com.example.pvge.dto.progreso;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Clase DTO que retorna el progreso de un estudiante en un curso para un
 * instructor
 * ProgresoEstudianteResponse
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgresoEstudianteResponse {
    private Integer estudianteId;
    private String correoEstudiante;
    private Integer tareasTotales;
    private Integer tareasCompletadas;
    private Integer tareasPendientes;
    private Integer evaluacionesTotales;
    private Integer evaluacionesCompletadas;
    private Integer evaluacionesPendientes;
    private double porcentajeCompletado;
    private Integer puntajeObtenido;
    private Integer puntajeTotal;
}
