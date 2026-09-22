package com.example.pvge.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.Contenido;

public interface ContenidoRepository extends JpaRepository<Contenido, Integer> {
    Optional<Contenido> findById(Integer id);
}
