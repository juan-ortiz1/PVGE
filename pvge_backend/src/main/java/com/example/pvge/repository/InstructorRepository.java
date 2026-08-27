package com.example.pvge.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.Instructor;
import java.util.Optional;


public interface InstructorRepository extends JpaRepository<Instructor, Integer> {
    Optional<Instructor> findById(Integer id);
    Optional<Instructor>  findByNombre(String nombre);

}
