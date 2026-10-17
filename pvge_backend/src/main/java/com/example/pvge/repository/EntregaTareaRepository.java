
package com.example.pvge.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.EntregaTarea;

public interface EntregaTareaRepository extends JpaRepository<EntregaTarea, Integer> {
    Optional<EntregaTarea> findByTareaIdAndEstudianteId(Integer tareaId, Integer estudianteId);
    boolean existsByTareaIdAndEstudianteId(Integer tareaId, Integer estudianteId);
    List<EntregaTarea> findByEstudianteIdAndTareaCursoId(Integer estudianteId, Integer cursoId);
    List<EntregaTarea> findByTareaIdOrderByFechaEntregaAsc(Integer tareaId);

    List<EntregaTarea> findByEstudianteIdOrderByFechaEntregaDesc(Integer estudianteId);
    List<EntregaTarea> findByTareaCursoId(Integer cursoId);
}
