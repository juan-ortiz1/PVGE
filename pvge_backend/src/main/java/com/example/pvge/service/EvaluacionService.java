package com.example.pvge.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
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
import com.example.pvge.model.EstadoEvaluacion;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.Evaluacion;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.IntentoEvaluacion;
import com.example.pvge.model.Opcion;
import com.example.pvge.model.Pregunta;
import com.example.pvge.model.RespuestaEstudiante;
import com.example.pvge.model.Rol;
import com.example.pvge.model.TipoNotificacion;
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
        private final NotificacionService notificacionService;

        @Value("${evaluacion.porcentaje-aprobacion:60}")
        private int porcentajeAprobacion;

        @Transactional
        public EvaluacionResponse crearEvaluacion(EvaluacionRequest request, Authentication authentication) {
                validarSolicitud(request);
                Usuario usuario = obtenerUsuarioByCorreo(authentication);
                Instructor instructor = obtenerInstructor(usuario);
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
                notificacionService.notificarInscritos(curso, TipoNotificacion.NUEVA_EVALUACION,
                                "Nueva evaluación en " + curso.getTitulo(), evaluacion.getTitulo(), evaluacion.getId());
                EvaluacionResponse response = evaluacionMapper.toResponse(evaluacion);
                response.setPuntajeTotal(calcularPuntajeTotal(evaluacion));
                return response;
        }

        @Transactional(readOnly = true)
        public EvaluacionRequest obtenerParaEdicion(Integer id, Authentication authentication) {
                Evaluacion evaluacion = obtenerEvaluacionPropia(id, authentication);
                EvaluacionRequest request = new EvaluacionRequest();
                request.setTitulo(evaluacion.getTitulo());
                request.setDescripcion(evaluacion.getDescripcion());
                request.setCursoId(evaluacion.getCurso().getId());
                request.setFechaPublicacion(evaluacion.getFechaPublicacion());
                request.setFechaVencimiento(evaluacion.getFechaVencimiento());
                request.setPreguntas(evaluacion.getPreguntas().stream().map(pregunta -> {
                        PreguntaRequest preguntaRequest = new PreguntaRequest();
                        preguntaRequest.setEnunciado(pregunta.getEnunciado());
                        preguntaRequest.setPuntaje(pregunta.getPuntaje());
                        preguntaRequest.setOpciones(pregunta.getOpciones().stream().map(opcion -> {
                                OpcionRequest opcionRequest = new OpcionRequest();
                                opcionRequest.setTexto(opcion.getTexto());
                                opcionRequest.setCorrecta(Boolean.TRUE.equals(opcion.getCorrecta()));
                                return opcionRequest;
                        }).toList());
                        return preguntaRequest;
                }).toList());
                return request;
        }

        @Transactional
        public EvaluacionResponse actualizarEvaluacion(Integer id, EvaluacionRequest request,
                        Authentication authentication) {
                validarSolicitud(request);
                Evaluacion evaluacion = obtenerEvaluacionPropia(id, authentication);
                if (!evaluacion.getCurso().getId().equals(request.getCursoId())) {
                        throw new RuntimeException("No puedes mover una evaluación a otro curso");
                }
                if (intentoEvaluacionRepository.existsByEvaluacionId(id)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                        "No se puede modificar una evaluación que ya tiene respuestas");
                }
                evaluacion.setTitulo(request.getTitulo());
                evaluacion.setDescripcion(request.getDescripcion());
                evaluacion.setFechaPublicacion(request.getFechaPublicacion());
                evaluacion.setFechaVencimiento(request.getFechaVencimiento());
                reemplazarPreguntas(evaluacion, request);
                EvaluacionResponse response = evaluacionMapper.toResponse(evaluacion);
                response.setPuntajeTotal(calcularPuntajeTotal(evaluacion));
                return response;
        }

        @Transactional
        public void eliminarEvaluacion(Integer id, Authentication authentication) {
                Evaluacion evaluacion = obtenerEvaluacionPropia(id, authentication);
                if (intentoEvaluacionRepository.existsByEvaluacionId(id)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                        "No se puede eliminar una evaluación que ya tiene respuestas");
                }
                eliminarPreguntas(evaluacion);
                evaluacionRepository.delete(evaluacion);
        }

        private Evaluacion obtenerEvaluacionPropia(Integer id, Authentication authentication) {
                Usuario usuario = obtenerUsuarioByCorreo(authentication);
                Instructor instructor = obtenerInstructor(usuario);
                Evaluacion evaluacion = evaluacionRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Evaluación no encontrada"));
                if (!evaluacion.getCurso().getInstructor().getId().equals(instructor.getId())) {
                        throw new RuntimeException("No puedes administrar evaluaciones de un curso que no es tuyo");
                }
                return evaluacion;
        }

        private void reemplazarPreguntas(Evaluacion evaluacion, EvaluacionRequest request) {
                eliminarPreguntas(evaluacion);
                evaluacion.getPreguntas().clear();
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
        }

        private void eliminarPreguntas(Evaluacion evaluacion) {
                List<Pregunta> preguntas = preguntaRepository.findByEvaluacionId(evaluacion.getId());
                for (Pregunta pregunta : preguntas) {
                        opcionRepository.deleteAll(opcionRepository.findByPreguntaId(pregunta.getId()));
                }
                preguntaRepository.deleteAll(preguntas);
        }

        private void validarSolicitud(EvaluacionRequest request) {
                if (request == null || request.getTitulo() == null || request.getTitulo().isBlank()
                                || request.getDescripcion() == null || request.getDescripcion().isBlank()
                                || request.getCursoId() == null || request.getPreguntas() == null
                                || request.getPreguntas().isEmpty()) {
                        throw new RuntimeException("Completa los datos de la evaluación y agrega al menos una pregunta");
                }
                if (request.getFechaVencimiento() == null
                                || (request.getFechaPublicacion() != null
                                                && !request.getFechaVencimiento().isAfter(request.getFechaPublicacion()))) {
                        throw new RuntimeException("La fecha de vencimiento debe ser posterior a la publicación");
                }
                for (PreguntaRequest pregunta : request.getPreguntas()) {
                        if (pregunta.getEnunciado() == null || pregunta.getEnunciado().isBlank()
                                        || pregunta.getPuntaje() == null || pregunta.getPuntaje() < 1
                                        || pregunta.getOpciones() == null || pregunta.getOpciones().size() < 2
                                        || pregunta.getOpciones().stream().anyMatch(
                                                        opcion -> opcion.getTexto() == null
                                                                        || opcion.getTexto().isBlank())
                                        || pregunta.getOpciones().stream()
                                                        .filter(OpcionRequest::isCorrecta).count() != 1) {
                                throw new RuntimeException(
                                                "Cada pregunta debe tener puntaje positivo, al menos dos opciones y una sola respuesta correcta");
                        }
                }
        }

        @Transactional(readOnly = true)
        public List<EvaluacionResponse> listarEvaluacionesPorCurso(Integer cursoId, Authentication authentication) {
                Usuario usuario = obtenerUsuarioByCorreo(authentication);
                Estudiante estudiante = null;
                if (usuario.getRol() == Rol.ESTUDIANTE) {
                        estudiante = obtenerEstudiante(usuario);
                        if (!inscripcionCursoRepository.existsByEstudianteIdAndCursoId(estudiante.getId(), cursoId)) {
                                throw new RuntimeException("No estás inscrito en este curso");
                        }
                } else if (usuario.getRol() == Rol.INSTRUCTOR) {
                        Instructor instructor = obtenerInstructor(usuario);
                        Curso curso = cursoRepository.findById(cursoId).orElseThrow(() -> new RuntimeException("Curso no encontrado"));
                        if (!curso.getInstructor().getId().equals(instructor.getId())) {
                                throw new RuntimeException("No puedes listar evaluaciones en un curso que no es tuyo.");
                        }
                }
                Map<Integer, IntentoEvaluacion> intentosPorEvaluacion = new HashMap<>();
                if (estudiante != null) {
                        for (IntentoEvaluacion intento : intentoEvaluacionRepository.findByEstudianteId(estudiante.getId())) {
                                intentosPorEvaluacion.merge(intento.getEvaluacion().getId(), intento,
                                                (actual, nuevo) -> nuevo.getPuntajeObtenido() > actual.getPuntajeObtenido() ? nuevo : actual);
                        }
                }
                final boolean esEstudiante = estudiante != null;
                return evaluacionRepository.findByCursoId(cursoId).stream()
                                .filter(this::estaPublicada)
                                .map(evaluacion -> {
                                        EvaluacionResponse response = evaluacionMapper.toResponse(evaluacion);
                                        if (esEstudiante) {
                                                aplicarEstado(response, intentosPorEvaluacion.get(evaluacion.getId()));
                                        }
                                        return response;
                                })
                                .toList();
        }

        @Transactional(readOnly = true)
        public EvaluacionResponse obtenerEvaluacion(Integer id, Authentication authentication) {
                Usuario usuario = obtenerUsuarioByCorreo(authentication);
                Evaluacion evaluacion = evaluacionRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Evaluación no encontrada"));
                Estudiante estudiante = null;
                if (usuario.getRol() == Rol.ESTUDIANTE) {
                        estudiante = obtenerEstudiante(usuario);
                        if (!inscripcionCursoRepository.existsByEstudianteIdAndCursoId(estudiante.getId(), evaluacion.getCurso().getId())) {
                                throw new RuntimeException("No estás inscrito en este curso");
                        }
                } else if (usuario.getRol() == Rol.INSTRUCTOR) {
                        Instructor instructor = obtenerInstructor(usuario);
                        if (!evaluacion.getCurso().getInstructor().getId().equals(instructor.getId())) {
                                throw new RuntimeException("No puedes listar evaluaciones por id en un curso que no es tuyo.");
                        }
                }
                if (!estaPublicada(evaluacion)) {
                        throw new RuntimeException("Evaluación no disponible");
                }
                EvaluacionResponse response = evaluacionMapper.toResponse(evaluacion);
                if (estudiante != null) {
                        IntentoEvaluacion mejorIntento = intentoEvaluacionRepository
                                        .findByEstudianteIdAndEvaluacionId(estudiante.getId(), evaluacion.getId())
                                        .stream()
                                        .max((a, b) -> Integer.compare(a.getPuntajeObtenido(), b.getPuntajeObtenido()))
                                        .orElse(null);
                        aplicarEstado(response, mejorIntento);
                }
                return response;
        }

        @Transactional
        public ResultadoEvaluacionResponse responderEvaluacion(
                        Integer id,
                        ResponderEvaluacionRequest request,
                        Authentication authentication) {
                Usuario usuario = obtenerUsuarioByCorreo(authentication);
                Estudiante estudiante = obtenerEstudiante(usuario);
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
                                .estado(calcularEstado(intento))
                                .fechaEnvio(intento.getFechaEnvio())
                                .build();
        }

        private Usuario obtenerUsuarioByCorreo(Authentication authentication) {
                return usuarioRepository.findByCorreo(authentication.getName())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        }

        private Estudiante obtenerEstudiante(Usuario usuario) {
                return estudianteRepository.findByUsuarioId(usuario.getId())
                                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado"));
        }

        private Instructor obtenerInstructor(Usuario usuario) {
                return instructorRepository.findByUsuarioId(usuario.getId())
                                .orElseThrow(() -> new RuntimeException("Instructor no encontrado"));
        }

        private boolean estaPublicada(Evaluacion evaluacion) {
                return evaluacion.getFechaPublicacion() == null
                                || !evaluacion.getFechaPublicacion().isAfter(LocalDateTime.now());
        }

        private boolean estaVencida(Evaluacion evaluacion) {
                return evaluacion.getFechaVencimiento() != null
                                && LocalDateTime.now().isAfter(evaluacion.getFechaVencimiento());
        }

        private EstadoEvaluacion calcularEstado(IntentoEvaluacion intento) {
                if (intento == null) {
                        return EstadoEvaluacion.PENDIENTE;
                }
                int obtenido = intento.getPuntajeObtenido() != null ? intento.getPuntajeObtenido() : 0;
                int total = intento.getPuntajeTotal() != null ? intento.getPuntajeTotal() : 0;
                return obtenido * 100 >= total * porcentajeAprobacion
                                ? EstadoEvaluacion.APROBADA
                                : EstadoEvaluacion.REPROBADA;
        }

        private void aplicarEstado(EvaluacionResponse response, IntentoEvaluacion intento) {
                response.setEstado(calcularEstado(intento));
                response.setPuntajeObtenido(intento != null ? intento.getPuntajeObtenido() : null);
                if (intento != null) {
                        response.setPuntajeTotal(intento.getPuntajeTotal());
                }
        }

        private Integer calcularPuntajeTotal(Evaluacion evaluacion) {
                return evaluacion.getPreguntas()
                                .stream()
                                .mapToInt(Pregunta::getPuntaje)
                                .sum();
        }
}