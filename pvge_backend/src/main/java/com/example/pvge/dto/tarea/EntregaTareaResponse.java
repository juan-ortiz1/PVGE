package com.example.pvge.dto.tarea;

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
}
