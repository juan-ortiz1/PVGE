package com.example.pvge.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.Tarea;

public interface TareaRepository extends JpaRepository<Tarea, Integer> {
    List<Tarea> findByCursoIdOrderByFechaEntregaAsc(Integer cursoId);
}
