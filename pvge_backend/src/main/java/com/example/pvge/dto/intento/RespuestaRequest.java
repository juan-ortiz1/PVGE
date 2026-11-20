package com.example.pvge.dto.intento;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RespuestaRequest {
    private Integer preguntaId;
    private Integer opcionId;
}
