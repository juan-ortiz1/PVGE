package com.example.pvge.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.pvge.dto.evaluacion.EvaluacionRequest;
import com.example.pvge.dto.evaluacion.EvaluacionResponse;
import com.example.pvge.dto.opcion.OpcionRequest;
import com.example.pvge.dto.pregunta.PreguntaRequest;
import com.example.pvge.mapper.EvaluacionMapper;
import com.example.pvge.model.Curso;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.Evaluacion;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.Opcion;
import com.example.pvge.model.Pregunta;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.CursoRepository;
import com.example.pvge.repository.EstudianteRepository;
import com.example.pvge.repository.EvaluacionRepository;
import com.example.pvge.repository.InscripcionCursoRepository;
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
        private final EvaluacionMapper evaluacionMapper;

        private final UsuarioRepository usuarioRepository;
        private final InstructorRepository instructorRepository;
        private final EstudianteRepository estudianteRepository;
        private final InscripcionCursoRepository inscripcionCursoRepository;

        @Transactional
        public EvaluacionResponse crearEvaluacion(
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
                        evaluacion.getPreguntas().add(pregunta);
                        for (OpcionRequest opcionRequest : preguntaRequest.getOpciones()) {
                                Opcion opcion = Opcion.builder()
                                                .texto(opcionRequest.getTexto())
                                                .correcta(opcionRequest.isCorrecta())
                                                .pregunta(pregunta)
                                                .build();
                                opcionRepository.save(opcion);
                                pregunta.getOpciones().add(opcion);
                        }
                }
                EvaluacionResponse response = evaluacionMapper.toResponse(evaluacion);
                response.setPuntajeTotal(calcularPuntajeTotal(evaluacion));
                return response;
        }

        @Transactional(readOnly = true)
        public List<EvaluacionResponse> listarEvaluacionesPorCurso(
                        Integer cursoId,
                        Authentication authentication) {
                Estudiante estudiante = obtenerEstudiante(authentication);
                if (!inscripcionCursoRepository.existsByEstudianteIdAndCursoId(estudiante.getId(), cursoId)) {
                        throw new RuntimeException("No estás inscrito en este curso");
                }
                return evaluacionRepository.findByCursoId(cursoId).stream()
                                .filter(this::estaPublicada)
                                .map(evaluacionMapper::toResponse)
                                .toList();
        }

        @Transactional(readOnly = true)
        public EvaluacionResponse obtenerEvaluacion(
                        Integer id,
                        Authentication authentication) {
                Estudiante estudiante = obtenerEstudiante(authentication);
                Evaluacion evaluacion = evaluacionRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Evaluación no encontrada"));
                if (!inscripcionCursoRepository.existsByEstudianteIdAndCursoId(
                                estudiante.getId(), evaluacion.getCurso().getId())) {
                        throw new RuntimeException("No estás inscrito en este curso");
                }
                if (!estaPublicada(evaluacion)) {
                        throw new RuntimeException("Evaluación no disponible");
                }
                return evaluacionMapper.toResponse(evaluacion);
        }

        private Estudiante obtenerEstudiante(Authentication authentication) {
                Usuario usuario = usuarioRepository.findByCorreo(authentication.getName())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
                return estudianteRepository.findByUsuarioId(usuario.getId())
                                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado"));
        }

        private boolean estaPublicada(Evaluacion evaluacion) {
                return evaluacion.getFechaPublicacion() == null
                                || !evaluacion.getFechaPublicacion().isAfter(LocalDateTime.now());
        }

        private boolean estaVencida(Evaluacion evaluacion) {
                return evaluacion.getFechaVencimiento() != null
                                && LocalDateTime.now().isAfter(evaluacion.getFechaVencimiento());
        }

        private Integer calcularPuntajeTotal(Evaluacion evaluacion) {
                return evaluacion.getPreguntas()
                                .stream()
                                .mapToInt(Pregunta::getPuntaje)
                                .sum();
        }
}