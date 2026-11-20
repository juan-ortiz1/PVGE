package com.example.pvge.dto.intento;

import java.time.LocalDateTime;

import com.example.pvge.model.EstadoEvaluacion;

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
public class ResultadoEvaluacionResponse {
    private Integer intentoId;
    private Integer evaluacionId;
    private Integer puntajeObtenido;
    private Integer puntajeTotal;
    private EstadoEvaluacion estado;
    private LocalDateTime fechaEnvio;
}
