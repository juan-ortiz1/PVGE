package com.example.pvge.dto.estudiante;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EstudianteResponse {
    private Integer id;
    private String nickname;
    private String nombre;
    private String apellido;
    private String correo;
    private LocalDateTime fechaRegistro;
    private String pais;
}
