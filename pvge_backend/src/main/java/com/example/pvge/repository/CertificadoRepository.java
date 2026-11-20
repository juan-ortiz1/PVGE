package com.example.pvge.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.Certificado;

import java.util.List;
import java.util.Optional;

public interface CertificadoRepository extends JpaRepository<Certificado, Integer> {
    boolean existsByInscripcionCursoId(Integer inscripcionCursoId);
    Optional<Certificado> findByInscripcionCursoId(Integer inscripcionCursoId);
    List<Certificado> findByInscripcionCursoEstudianteIdOrderByFechaEmisionDesc(Integer estudianteId);

}
