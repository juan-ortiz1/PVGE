package com.example.pvge.dto.tarea;

import java.time.LocalDateTime;

import com.example.pvge.model.EstadoTarea;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class TareaResponse {
    private Integer id;
    private String titulo;
    private String descripcion;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaEntrega;
    private Integer cursoId;
    private EstadoTarea estado;
}
