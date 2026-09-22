package com.example.pvge.mapper;

import org.springframework.stereotype.Component;

import com.example.pvge.dto.usuario.UsuarioResponse;
import com.example.pvge.model.Usuario;

@Component
public class UsuarioMapper {
    public UsuarioResponse toResponse(Usuario usuario) {
        return UsuarioResponse.builder()
                .id(usuario.getId())
                .nombre(usuario.getUsername())
                .correo(usuario.getCorreo())
                .rol(usuario.getRol())
                .activo(usuario.getActivo())
                .build();
    }
        public UsuarioResponse toResponse(Usuario usuario, String nombre) {
        return UsuarioResponse.builder()
                .id(usuario.getId())
                .nombre(nombre)
                .correo(usuario.getCorreo())
                .rol(usuario.getRol())
                .activo(usuario.getActivo())
                .build();
    }
}
