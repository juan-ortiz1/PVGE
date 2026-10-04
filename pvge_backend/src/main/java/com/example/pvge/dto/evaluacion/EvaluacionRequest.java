package com.example.pvge.dto.evaluacion;

import java.time.LocalDateTime;
import java.util.List;

import com.example.pvge.dto.pregunta.PreguntaRequest;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
public class EvaluacionRequest {
    private String titulo;
    private String descripcion;
    private Integer cursoId;
    private LocalDateTime fechaPublicacion;
    private LocalDateTime fechaVencimiento;
    private List<PreguntaRequest> preguntas;
}
