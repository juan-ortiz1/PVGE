package com.example.pvge.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.InscripcionCurso;
import java.util.Optional;


public interface InscripcionCursoRepository extends JpaRepository<InscripcionCurso, Integer> {
    Optional<InscripcionCurso> findById(Integer id);
    Boolean existsByEstudianteIdAndCursoId(Integer estudianteId, Integer cursoId);
}
