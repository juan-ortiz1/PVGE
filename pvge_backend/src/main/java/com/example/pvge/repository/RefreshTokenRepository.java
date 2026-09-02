package com.example.pvge.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.RefreshToken;
import com.example.pvge.model.Usuario;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUsuario(Usuario usuario);
}
