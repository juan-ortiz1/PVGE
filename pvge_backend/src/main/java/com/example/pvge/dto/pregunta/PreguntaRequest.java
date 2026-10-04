package com.example.pvge.dto.pregunta;

import java.util.List;

import com.example.pvge.dto.OpcionRequest;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
public class PreguntaRequest {
    private String enunciado;
    private Integer puntaje;
    private List<OpcionRequest> opciones;
}
