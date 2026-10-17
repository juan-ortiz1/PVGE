package com.example.pvge.dto.tarea;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EntregaTareaResponse {
    private Integer id;
    private Integer tareaId;
    private String nombreArchivo;
    private String urlArchivo;
    private String tipoContenido;
    private LocalDateTime fechaEntrega;

    private BigDecimal calificacion;
    private String observaciones;
    private LocalDateTime fechaCalificacion;

    private Integer estudianteId;
    private String correoEstudiante;
    private String tareaTitulo;
}
