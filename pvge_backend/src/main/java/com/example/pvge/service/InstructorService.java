package com.example.pvge.service;

import com.example.pvge.repository.InstructorRepository;
import com.example.pvge.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import com.example.pvge.dto.instructor.InstructorRequest;
import com.example.pvge.dto.instructor.InstructorResponse;
import com.example.pvge.model.Instructor;
import com.example.pvge.model.Rol;
import com.example.pvge.model.Usuario;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InstructorService {

    private final UsuarioRepository usuarioRepository;
    private final InstructorRepository instructorRepository;
    private final UsuarioService usuarioService;

    @Transactional
    public InstructorResponse crearInstructor(InstructorRequest request){
        if (usuarioRepository.findByCorreo(request.getCorreo()).isPresent()) {
            throw new RuntimeException("Ya existe un usuario con este correo electrónico");
        }
        Usuario usuario = usuarioService.crearUsuario(request.getCorreo(), request.getPassword(), Rol.INSTRUCTOR);
        Instructor instructor = Instructor.builder()
        .nombre(request.getNombre())
        .disciplina(request.getDisciplina())
        .tier(request.getTier())
        .usuario(usuario)
        .build();
        instructorRepository.save(instructor);
        return buildInstructorResponse(instructor);
    }

    private InstructorResponse buildInstructorResponse(Instructor instructor){
        return InstructorResponse.builder()
        .id(instructor.getId())
        .nombre(instructor.getNombre())
        .correo(instructor.getUsuario().getCorreo())
        .disciplina(instructor.getDisciplina())
        .tier(instructor.getTier())
        .build();
    }
}
