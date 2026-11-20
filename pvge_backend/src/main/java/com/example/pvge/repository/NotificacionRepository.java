package com.example.pvge.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pvge.model.Notificacion;

import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Integer> {
    List<Notificacion> findByEstudianteIdOrderByFechaCreacionDesc(Integer estudianteId);
    List<Notificacion> findByEstudianteIdAndLeidaFalse(Integer estudianteId);
    long countByEstudianteIdAndLeidaFalse(Integer estudianteId);
}
