package com.example.pvge.dto.notificacion;

import java.time.LocalDateTime;

import com.example.pvge.model.TipoNotificacion;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class NotificacionResponse {
    private Integer id;
    private Integer cursoId;
    private String cursoTitulo;
    private TipoNotificacion tipo;
    private String titulo;
    private String mensaje;
    private Integer referenciaId;
    private Boolean leida;
    private LocalDateTime fechaCreacion;
}
