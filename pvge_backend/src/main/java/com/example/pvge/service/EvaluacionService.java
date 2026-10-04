package com.example.pvge.service;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.pvge.dto.OpcionRequest;
import com.example.pvge.dto.evaluacion.EvaluacionRequest;
import com.example.pvge.dto.pregunta.PreguntaRequest;
import com.example.pvge.model.Curso;
import com.example.pvge.model.Evaluacion;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.Opcion;
import com.example.pvge.model.Pregunta;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.CursoRepository;
import com.example.pvge.repository.EvaluacionRepository;
import com.example.pvge.repository.InstructorRepository;
import com.example.pvge.repository.OpcionRepository;
import com.example.pvge.repository.PreguntaRepository;
import com.example.pvge.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EvaluacionService {

    private final EvaluacionRepository evaluacionRepository;
    private final CursoRepository cursoRepository;
    private final PreguntaRepository preguntaRepository;
    private final OpcionRepository opcionRepository;

    private final UsuarioRepository usuarioRepository;
    private final InstructorRepository instructorRepository;

    @Transactional
    public Evaluacion crearEvaluacion(
            EvaluacionRequest request,
            Authentication authentication) {
        Usuario usuario = usuarioRepository.findByCorreo(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Instructor instructor = instructorRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Instructor no encontrado"));
        Curso curso = cursoRepository.findById(request.getCursoId())
                .orElseThrow(() -> new RuntimeException("Curso no encontrado"));
        if (!curso.getInstructor().getId().equals(instructor.getId())) {
            throw new RuntimeException(
                    "No puedes crear una evaluación para un curso que no es tuyo");
        }
        Evaluacion evaluacion = Evaluacion.builder()
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .fechaPublicacion(request.getFechaPublicacion())
                .fechaVencimiento(request.getFechaVencimiento())
                .curso(curso)
                .build();
        evaluacionRepository.save(evaluacion);
        for (PreguntaRequest preguntaRequest : request.getPreguntas()) {
            Pregunta pregunta = Pregunta.builder()
                    .enunciado(preguntaRequest.getEnunciado())
                    .puntaje(preguntaRequest.getPuntaje())
                    .evaluacion(evaluacion)
                    .build();
            preguntaRepository.save(pregunta);
            for (OpcionRequest opcionRequest : preguntaRequest.getOpciones()) {
                Opcion opcion = Opcion.builder()
                        .texto(opcionRequest.getTexto())
                        .correcta(opcionRequest.isCorrecta())
                        .pregunta(pregunta)
                        .build();
                opcionRepository.save(opcion);
            }
        }
        return evaluacion;
    }
}