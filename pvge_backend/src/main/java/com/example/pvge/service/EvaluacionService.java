package com.example.pvge.service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.pvge.dto.evaluacion.EvaluacionRequest;
import com.example.pvge.dto.evaluacion.EvaluacionResponse;
import com.example.pvge.dto.intento.ResponderEvaluacionRequest;
import com.example.pvge.dto.intento.RespuestaRequest;
import com.example.pvge.dto.intento.ResultadoEvaluacionResponse;
import com.example.pvge.dto.opcion.OpcionRequest;
import com.example.pvge.dto.pregunta.PreguntaRequest;
import com.example.pvge.mapper.EvaluacionMapper;
import com.example.pvge.model.Curso;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.Evaluacion;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.IntentoEvaluacion;
import com.example.pvge.model.Opcion;
import com.example.pvge.model.Pregunta;
import com.example.pvge.model.RespuestaEstudiante;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.CursoRepository;
import com.example.pvge.repository.EstudianteRepository;
import com.example.pvge.repository.EvaluacionRepository;
import com.example.pvge.repository.InscripcionCursoRepository;
import com.example.pvge.repository.InstructorRepository;
import com.example.pvge.repository.IntentoEvaluacionRepository;
import com.example.pvge.repository.OpcionRepository;
import com.example.pvge.repository.PreguntaRepository;
import com.example.pvge.repository.RespuestaEstudianteRepository;
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
        private final IntentoEvaluacionRepository intentoEvaluacionRepository;
        private final RespuestaEstudianteRepository respuestaEstudianteRepository;

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

        @Transactional
        public ResultadoEvaluacionResponse responderEvaluacion(
                        Integer id,
                        ResponderEvaluacionRequest request,
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
                if (estaVencida(evaluacion)) {
                        throw new RuntimeException("La evaluación ya venció");
                }
                if (intentoEvaluacionRepository.existsByEstudianteIdAndEvaluacionId(
                                estudiante.getId(), evaluacion.getId())) {
                        throw new RuntimeException("Ya respondiste esta evaluación");
                }
                if (request.getRespuestas() == null || request.getRespuestas().isEmpty()) {
                        throw new RuntimeException("Debes enviar al menos una respuesta");
                }
                IntentoEvaluacion intento = IntentoEvaluacion.builder()
                                .fechaEnvio(LocalDateTime.now())
                                .puntajeObtenido(0)
                                .puntajeTotal(calcularPuntajeTotal(evaluacion))
                                .estudiante(estudiante)
                                .evaluacion(evaluacion)
                                .build();
                intentoEvaluacionRepository.save(intento);
                int puntajeObtenido = 0;
                Set<Integer> preguntasRespondidas = new HashSet<>();
                for (RespuestaRequest respuestaRequest : request.getRespuestas()) {
                        if (!preguntasRespondidas.add(respuestaRequest.getPreguntaId())) {
                                throw new RuntimeException("No puedes responder la misma pregunta dos veces");
                        }
                        Pregunta pregunta = preguntaRepository.findById(respuestaRequest.getPreguntaId())
                                        .orElseThrow(() -> new RuntimeException("Pregunta no encontrada"));
                        if (!pregunta.getEvaluacion().getId().equals(evaluacion.getId())) {
                                throw new RuntimeException("La pregunta no pertenece a esta evaluación");
                        }
                        Opcion opcion = opcionRepository.findById(respuestaRequest.getOpcionId())
                                        .orElseThrow(() -> new RuntimeException("Opción no encontrada"));
                        if (!opcion.getPregunta().getId().equals(pregunta.getId())) {
                                throw new RuntimeException("La opción no pertenece a la pregunta");
                        }
                        boolean correcta = Boolean.TRUE.equals(opcion.getCorrecta());
                        if (correcta && pregunta.getPuntaje() != null) {
                                puntajeObtenido += pregunta.getPuntaje();
                        }
                        RespuestaEstudiante respuesta = RespuestaEstudiante.builder()
                                        .correcta(correcta)
                                        .intento(intento)
                                        .pregunta(pregunta)
                                        .opcionSeleccionada(opcion)
                                        .build();
                        respuestaEstudianteRepository.save(respuesta);
                        intento.getRespuestas().add(respuesta);
                }
                intento.setPuntajeObtenido(puntajeObtenido);
                intentoEvaluacionRepository.save(intento);
                return ResultadoEvaluacionResponse.builder()
                                .intentoId(intento.getId())
                                .evaluacionId(evaluacion.getId())
                                .puntajeObtenido(intento.getPuntajeObtenido())
                                .puntajeTotal(intento.getPuntajeTotal())
                                .fechaEnvio(intento.getFechaEnvio())
                                .build();
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