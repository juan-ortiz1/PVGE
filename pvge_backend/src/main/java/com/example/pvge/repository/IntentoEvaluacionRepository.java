package com.example.pvge.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.IntentoEvaluacion;

public interface IntentoEvaluacionRepository extends JpaRepository<IntentoEvaluacion, Integer> {
    boolean existsByEstudianteIdAndEvaluacionId(Integer estudianteId, Integer evaluacionId);
}
