package com.example.pvge.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.Usuario;
import java.util.Optional;


public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByCorreo(String correo);
}
