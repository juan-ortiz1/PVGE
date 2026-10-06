package com.example.pvge.dto.intento;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResponderEvaluacionRequest {
    private List<RespuestaRequest> respuestas;
}
