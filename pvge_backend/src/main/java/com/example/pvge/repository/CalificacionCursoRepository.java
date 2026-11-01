package com.example.pvge.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.CalificacionCurso;

public interface CalificacionCursoRepository extends JpaRepository<CalificacionCurso, Integer> {
    Optional<CalificacionCurso> findByCursoIdAndEstudianteId(Integer cursoId, Integer estudianteId);
    List<CalificacionCurso> findByCursoId(Integer cursoId);
}
