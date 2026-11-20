package com.example.pvge.dto.pregunta;

import java.util.List;

import com.example.pvge.dto.opcion.OpcionResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreguntaResponse {

    private Integer id;
    private String enunciado;
    private Integer puntaje;
    private List<OpcionResponse> opciones;
}
