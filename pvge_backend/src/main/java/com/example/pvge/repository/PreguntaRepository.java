package com.example.pvge.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.Pregunta;

public interface PreguntaRepository extends JpaRepository<Pregunta, Integer> {
    Optional<Pregunta> findById(Integer id);
}
