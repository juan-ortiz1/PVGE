package com.example.pvge.mapper;

import org.springframework.stereotype.Component;

import com.example.pvge.dto.notificacion.NotificacionResponse;
import com.example.pvge.model.Notificacion;

@Component
public class NotificacionMapper {
    public NotificacionResponse toResponse(Notificacion notificacion){
        return NotificacionResponse.builder()
        .id(notificacion.getId())
        .cursoId(notificacion.getCurso().getId())
        .cursoTitulo(notificacion.getCurso().getTitulo())
        .tipo(notificacion.getTipo())
        .titulo(notificacion.getTitulo())
        .mensaje(notificacion.getMensaje())
        .referenciaId(notificacion.getReferenciaId())
        .leida(notificacion.getLeida())
        .fechaCreacion(notificacion.getFechaCreacion())
        .build();
    }
}
