package com.example.pvge.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.pvge.dto.contenido.ContenidoRequest;
import com.example.pvge.dto.contenido.ContenidoResponse;
import com.example.pvge.mapper.ContenidoMapper;
import com.example.pvge.model.Contenido;
import com.example.pvge.model.Curso;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.Rol;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.ContenidoRepository;
import com.example.pvge.repository.CursoRepository;
import com.example.pvge.repository.EstudianteRepository;
import com.example.pvge.repository.InscripcionCursoRepository;
import com.example.pvge.repository.InstructorRepository;
import com.example.pvge.repository.UsuarioRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContenidoService {
        private final ContenidoRepository contenidoRepository;
        private final UsuarioRepository usuarioRepository;
        private final InstructorRepository instructorRepository;
        private final EstudianteRepository estudianteRepository;
        private final CursoRepository cursoRepository;
        private final ContenidoMapper contenidoMapper;
        private final InscripcionCursoRepository inscripcionCursoRepository;

        @Transactional
        public ContenidoResponse crearContenido(ContenidoRequest request, Authentication authentication) {
                Usuario usuario = findUsuarioByCorreo(authentication.getName());
                Instructor instructor = findInstructorByUsuarioId(usuario.getId());
                Curso curso = findCursoById(request.getCursoId());
                if (Boolean.FALSE.equals(curso.getActivo())) {
                        throw new RuntimeException("El curso no está activo");
                }
                if (!curso.getInstructor().getId().equals(instructor.getId())) {
                        throw new RuntimeException("No puedes crear contenido en un curso que no es tuyo");
                }
                Contenido contenido = Contenido.builder()
                                .titulo(request.getTitulo())
                                .descripcion(request.getDescripcion())
                                .fechaCreacion(LocalDateTime.now())
                                .curso(curso)
                                .build();
                contenidoRepository.save(contenido);
                return contenidoMapper.toResponse(contenido);
        }

        public ContenidoResponse getContenidoById(Integer id, Authentication authentication) {
                Usuario usuario = findUsuarioByCorreo(authentication.getName());
                Contenido contenido = contenidoRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Contenido no encontrado"));
                Curso curso = findCursoById(contenido.getCurso().getId());
                if (usuario.getRol() == Rol.ESTUDIANTE) {
                        Estudiante estudiante = findEstudianteByUsuarioId(usuario.getId());
                        Boolean inscrito = existsByEstudianteIdAndCursoId(estudiante.getId(), curso.getId());
                        if (Boolean.FALSE.equals(inscrito)) {
                                throw new RuntimeException("El estudiante no puede ver contenidos de un curso al que no está inscrito");
                        }
                }
                if (usuario.getRol() == Rol.INSTRUCTOR) {
                        Instructor instructor = findInstructorByUsuarioId(usuario.getId());
                        Boolean propietario = esPropietarioCurso(instructor.getId(), curso);
                        if (Boolean.FALSE.equals(propietario)) {
                                throw new RuntimeException("No puedes ver contenidos de un curso que no es tuyo.");
                        }
                }
                return contenidoMapper.toResponse(contenido);
        }

        public List<ContenidoResponse> getListaContenidos(Integer cursoId, Authentication authentication){
                return null; //TODO
        }
        private boolean esPropietarioCurso(Integer instructorId, Curso curso){
                return curso.getInstructor().getId().equals(instructorId);
        }
        private boolean existsByEstudianteIdAndCursoId(Integer estudianteId, Integer cursoId){
                return inscripcionCursoRepository.existsByEstudianteIdAndCursoId(estudianteId, cursoId);
        }
        private Usuario findUsuarioByCorreo(String correo) {
                return usuarioRepository.findByCorreo(correo)
                                .orElseThrow(() -> new RuntimeException("El usuario no ha sido encontrado"));
        }

        private Instructor findInstructorByUsuarioId(Integer userId) {
                return instructorRepository.findByUsuarioId(userId)
                                .orElseThrow(() -> new RuntimeException("El instructor no ha sido encontrado"));
        }

        private Estudiante findEstudianteByUsuarioId(Integer userId) {
                return estudianteRepository.findByUsuarioId(userId)
                                .orElseThrow(() -> new RuntimeException("El estudiante no ha sido encontrado"));
        }

        private Curso findCursoById(Integer cursoId) {
                return cursoRepository.findById(cursoId)
                                .orElseThrow(() -> new RuntimeException("Curso no encontrado"));
        }

}
