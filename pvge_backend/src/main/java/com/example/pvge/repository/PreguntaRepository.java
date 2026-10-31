package com.example.pvge.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.Pregunta;

public interface PreguntaRepository extends JpaRepository<Pregunta, Integer> {
    Optional<Pregunta> findById(Integer id);
    List<Pregunta> findByEvaluacionId(Integer evaluacionId);
}
