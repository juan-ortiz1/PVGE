package com.example.pvge.service;

import com.example.pvge.repository.InstructorRepository;
import org.springframework.stereotype.Service;

import com.example.pvge.dto.instructor.InstructorRequest;
import com.example.pvge.dto.instructor.InstructorResponse;
import com.example.pvge.dto.usuario.PerfilRequest;
import com.example.pvge.mapper.InstructorMapper;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.Rol;
import com.example.pvge.model.TipoCodigo;
import com.example.pvge.model.Usuario;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InstructorService {

    private final InstructorRepository instructorRepository;
    private final UsuarioService usuarioService;
    private final CodigoVerificacionService codigoVerificacionService;
    private final InstructorMapper instructorMapper;

    @Transactional
    public InstructorResponse crearInstructor(InstructorRequest request){
        Usuario usuario = usuarioService.crearUsuario(request.getCorreo(), request.getPassword(), Rol.INSTRUCTOR);
        // Si se reutilizó una cuenta pendiente de verificación, se actualiza su instructor en vez de crear otro
        Instructor instructor = instructorRepository.findByUsuarioId(usuario.getId())
        .orElseGet(() -> Instructor.builder().usuario(usuario).build());
        instructor.setNombre(request.getNombre());
        instructor.setDisciplina(request.getDisciplina());
        instructor.setTier(request.getTier());
        instructorRepository.save(instructor);
        codigoVerificacionService.generarYEnviar(usuario, TipoCodigo.VERIFICACION_CORREO);
        return instructorMapper.toResponse(instructor);
    }

}
