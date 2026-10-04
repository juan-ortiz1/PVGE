package com.example.pvge.dto.evaluacion;

import java.time.LocalDateTime;
import java.util.List;

import com.example.pvge.dto.curso.CursoResponse;
import com.example.pvge.dto.pregunta.PreguntaResponse;

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
public class EvaluacionResponse {
    private Integer id;
    private String titulo;
    private String descripcion;
    private LocalDateTime fechaPublicacion;
    private LocalDateTime fechaVencimiento;
    private CursoResponse cursoResponse;
    private List<PreguntaResponse> preguntas;
}
