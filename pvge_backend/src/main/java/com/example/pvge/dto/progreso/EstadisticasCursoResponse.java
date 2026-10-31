package com.example.pvge.dto.progreso;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EstadisticasCursoResponse {
    private int totalEstudiantes;
    private int totalTareas;
    private int totalEntregas;
    private int entregasCalificadas;
    private BigDecimal promedioCalificacionTareas;
    private int totalEvaluaciones;
    private int intentosEvaluacion;
    private int evaluacionesAprobadas;
    private BigDecimal promedioEvaluacionesPorcentaje;
    private BigDecimal porcentajeAprobacion;
}
