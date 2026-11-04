package com.example.pvge.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.PasswordResetToken;
import com.example.pvge.model.Usuario;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Integer> {
    Optional<PasswordResetToken> findTopByUsuarioAndUsadoFalseOrderByFechaCreacionDesc(Usuario usuario);
    List<PasswordResetToken> findByUsuarioAndUsadoFalse(Usuario usuario);
}
