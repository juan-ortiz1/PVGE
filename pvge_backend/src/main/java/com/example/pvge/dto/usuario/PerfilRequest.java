package com.example.pvge.dto.usuario;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
public class PerfilRequest {
    private String correo;
    private String nombre;
    private String apellido;
    private String nickname;
}
