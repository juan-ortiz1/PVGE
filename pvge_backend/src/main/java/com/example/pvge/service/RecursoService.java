package com.example.pvge.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.pvge.dto.recurso.RecursoRequest;
import com.example.pvge.dto.recurso.RecursoResponse;
import com.example.pvge.mapper.RecursoMapper;
import com.example.pvge.model.Contenido;
import com.example.pvge.model.Estudiante;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.Recurso;
import com.example.pvge.model.Rol;
import com.example.pvge.model.Usuario;
import com.example.pvge.repository.ContenidoRepository;
import com.example.pvge.repository.EstudianteRepository;
import com.example.pvge.repository.InscripcionCursoRepository;
import com.example.pvge.repository.InstructorRepository;
import com.example.pvge.repository.RecursoRepository;
import com.example.pvge.repository.UsuarioRepository;
import com.example.pvge.storage.FileStorageService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecursoService {
        private final RecursoRepository recursoRepository;
        private final UsuarioRepository usuarioRepository;
        private final InstructorRepository instructorRepository;
        private final ContenidoRepository contenidoRepository;
        private final RecursoMapper recursoMapper;
        private final EstudianteRepository estudianteRepository;
        private final FileStorageService fileStorageService;
        private final InscripcionCursoRepository inscripcionCursoRepository;

        @Transactional
        public RecursoResponse addRecurso(RecursoRequest request, Authentication authentication) {
                Usuario usuario = usuarioRepository.findByCorreo(authentication.getName())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
                Instructor instructor = instructorRepository.findByUsuarioId(usuario.getId())
                                .orElseThrow(() -> new RuntimeException("Instructor no encontrado"));
                Contenido contenido = contenidoRepository.findById(request.getContenidoId())
                                .orElseThrow(() -> new RuntimeException("Contenido no encontrado"));

                if (!contenido.getCurso().getInstructor().getId().equals(instructor.getId())) {
                        throw new RuntimeException("No puedes agregar recursos a un contenido que no es tuyo");
                }
                String url = fileStorageService.upload(request.getArchivo());
                Recurso recurso = Recurso.builder()
                                .nombre(request.getNombre())
                                .tipo(request.getArchivo().getContentType())
                                .url(url)
                                .fechaSubida(LocalDateTime.now())
                                .contenido(contenido)
                                .build();
                recursoRepository.save(recurso);
                return recursoMapper.toResponse(recurso);
        }

        public RecursoResponse getRecursoById(Integer id, Authentication authentication) {
                Usuario usuario = usuarioRepository.findByCorreo(authentication.getName())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
                Recurso recurso = recursoRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Recurso no encontrado"));
                verificarAcceso(usuario, recurso);
                return recursoMapper.toResponse(recurso);
        }

        public List<RecursoResponse> getRecursosByContenido(Integer contenidoId, Authentication authentication) {
                Usuario usuario = usuarioRepository.findByCorreo(authentication.getName())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
                Contenido contenido = contenidoRepository.findById(contenidoId)
                                .orElseThrow(() -> new RuntimeException("Contenido no encontrado"));
                verificarAcceso(usuario, contenido);
                List<Recurso> recursos = recursoRepository.findByContenidoId(contenidoId);
                return recursos.stream().map(recursoMapper::toResponse).toList();
        }

        /**
         * Verificar acceso a un recurso
         * 
         * @param usuario
         * @param recurso
         */
        private void verificarAcceso(Usuario usuario, Recurso recurso) {
                verificarAcceso(usuario, recurso.getContenido());
        }

        /**
         * Verificar acceso a un contenido
         * 
         * @param usuario
         * @param contenido
         */
        private void verificarAcceso(Usuario usuario, Contenido contenido) {
                if (usuario.getRol() == Rol.INSTRUCTOR) {
                        Instructor instructor = instructorRepository.findByUsuarioId(usuario.getId())
                                        .orElseThrow(() -> new RuntimeException("Instructor no encontrado"));
                        if (!contenido.getCurso().getInstructor().getId().equals(instructor.getId())) {
                                throw new RuntimeException("No puedes acceder a recursos de un curso que no es tuyo");
                        }
                }
                if (usuario.getRol() == Rol.ESTUDIANTE) {
                        Estudiante estudiante = estudianteRepository.findByUsuarioId(usuario.getId())
                                        .orElseThrow(() -> new RuntimeException("Estudiante no encontrado"));
                        boolean inscrito = inscripcionCursoRepository.existsByEstudianteIdAndCursoId(estudiante.getId(),
                                        contenido.getCurso().getId());
                        if (!inscrito) {
                                throw new RuntimeException(
                                                "No puedes acceder a recursos de un curso al que no estás inscrito");
                        }
                }

        }
}
