package com.example.pvge.dto.estudiante;

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
public class EstudianteRequest {
    private String nickname;
    private String nombre;
    private String apellido;
    private String correo;
    private String password;
    private String pais;
}
