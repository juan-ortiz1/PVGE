package com.example.pvge.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.Estudiante;
import java.util.Optional;


public interface EstudianteRepository extends JpaRepository<Estudiante, Integer> {
    Optional<Estudiante> findById(Integer id);
    Optional<Estudiante> findByNickname(String nickname);
}
