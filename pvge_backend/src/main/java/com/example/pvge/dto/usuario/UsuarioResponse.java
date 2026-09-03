package com.example.pvge.dto.usuario;

import com.example.pvge.model.Rol;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioResponse {
    private Integer id;
    private String nombre;
    private String correo;
    private Rol rol;
    private Boolean activo;
}
