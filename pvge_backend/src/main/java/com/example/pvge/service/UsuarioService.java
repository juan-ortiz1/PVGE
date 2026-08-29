package com.example.pvge.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.pvge.model.Rol;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.UsuarioRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final PasswordEncoder passwordEncoder;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public Usuario crearUsuario(String correo, String contraseña, Rol rol) {
        Usuario usuario = Usuario.builder()
                .correo(correo).password(passwordEncoder.encode(contraseña)).rol(rol).activo(true).build();
        return usuarioRepository.save(usuario);
    }
}
