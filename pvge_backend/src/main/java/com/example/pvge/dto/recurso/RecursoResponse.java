package com.example.pvge.dto.recurso;

import java.time.LocalDateTime;

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
public class RecursoResponse {
    private Integer id;
    private String nombre;
    private String tipo;
    private String url;
    private LocalDateTime fechaSubida;
    private Integer contenidoId;
}
