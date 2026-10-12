package com.example.pvge.dto.progreso;

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
public class ProgresoCursoResponse {
    private Integer cursoId;
    private String cursoTitulo;
    private Integer evaluacionesTotales;
    private Integer evaluacionesCompletadas;
    private Integer evaluacionesPendientes;

    private double porcentajeCompletado;

    private Integer puntajeObtenido;
    private Integer puntajeTotal;
}
