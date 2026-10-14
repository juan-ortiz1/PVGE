
package com.example.pvge.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.EntregaTarea;

public interface EntregaTareaRepository extends JpaRepository<EntregaTarea, Integer> {
Optional<EntregaTarea> findByTareaIdAndEstudianteId(Integer tareaId, Integer estudianteId);
boolean existsByTareaIdAndEstudianteId(Integer tareaId, Integer estudianteId);
}
