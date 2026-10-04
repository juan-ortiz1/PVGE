package com.example.pvge.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.Opcion;


public interface OpcionRepository extends JpaRepository<Opcion, Integer>{
    Optional<Opcion> findById(Integer id);
}
