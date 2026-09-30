package com.example.pvge.dto.recurso;

import org.springframework.web.multipart.MultipartFile;

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
public class RecursoRequest {
    private String nombre;
    private MultipartFile archivo;
    private Integer contenidoId;
}
