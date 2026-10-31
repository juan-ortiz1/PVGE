package com.example.pvge.dto.certificado;

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
public class CertificadoResponse {
    private Integer id;
    private String codigo;
    private LocalDateTime fechaEmision;
    private String url;
    private String cursoTitulo;
    private String estudianteNombre;
}
