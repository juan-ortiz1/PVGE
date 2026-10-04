package com.example.pvge.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.Evaluacion;


public interface EvaluacionRepository extends JpaRepository<Evaluacion, Integer>{
    Optional<Evaluacion> findById(Integer id);
    boolean existsByCursoId(Integer id);
}
