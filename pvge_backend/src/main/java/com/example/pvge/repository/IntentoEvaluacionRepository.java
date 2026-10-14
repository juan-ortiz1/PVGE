package com.example.pvge.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.IntentoEvaluacion;

public interface IntentoEvaluacionRepository extends JpaRepository<IntentoEvaluacion, Integer> {
    boolean existsByEstudianteIdAndEvaluacionId(Integer estudianteId, Integer evaluacionId);
    List<IntentoEvaluacion> findByEstudianteId(Integer estudianteId);
    List<IntentoEvaluacion> findByEstudianteIdAndEvaluacionId(Integer estudianteId, Integer evaluacionId);
}
