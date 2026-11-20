package com.example.pvge.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.example.pvge.model.CodigoVerificacion;
import com.example.pvge.model.TipoCodigo;
import com.example.pvge.model.Usuario;

public interface CodigoVerificacionRepository extends JpaRepository<CodigoVerificacion, Integer> {
    Optional<CodigoVerificacion> findTopByUsuarioAndTipoAndUsadoFalseOrderByFechaCreacionDesc(Usuario usuario, TipoCodigo tipo);

    Optional<CodigoVerificacion> findTopByUsuarioAndTipoOrderByFechaCreacionDesc(Usuario usuario, TipoCodigo tipo);

    List<CodigoVerificacion> findByUsuarioAndTipoAndUsadoFalse(Usuario usuario, TipoCodigo tipo);

    long countByUsuarioAndTipoAndFechaCreacionAfter(Usuario usuario, TipoCodigo tipo, LocalDateTime fecha);

    // Suma un intento solo si quedan intentos; devuelve 0 si ya se alcanzó el máximo
    @Modifying
    @Transactional
    @Query("UPDATE CodigoVerificacion c SET c.intentos = c.intentos + 1 WHERE c.id = :id AND c.intentos < :max")
    int consumirIntento(@Param("id") Integer id, @Param("max") int max);
}
