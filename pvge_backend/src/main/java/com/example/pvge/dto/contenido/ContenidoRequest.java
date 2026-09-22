package com.example.pvge.dto.contenido;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class ContenidoRequest {
    @NotBlank 
    private String titulo;
    @NotBlank 
    private String descripcion;
    @NotNull 
    private Integer cursoId;
}
