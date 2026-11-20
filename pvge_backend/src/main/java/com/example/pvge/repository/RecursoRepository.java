package com.example.pvge.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.Recurso;

public interface RecursoRepository extends JpaRepository<Recurso, Integer>{
    Optional<Recurso> findById(Integer id);
    List<Recurso> findByContenidoId(Integer contenidoId);
}
