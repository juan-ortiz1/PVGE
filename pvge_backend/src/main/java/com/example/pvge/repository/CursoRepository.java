package com.example.pvge.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.Curso;


public interface CursoRepository extends JpaRepository<Curso, Integer>{
    Optional<Curso> findById(Integer id);
}
