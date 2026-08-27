package com.example.pvge.service;

import org.springframework.stereotype.Service;

import com.example.pvge.dto.estudiante.EstudianteRequest;
import com.example.pvge.dto.estudiante.EstudianteResponse;
import com.example.pvge.model.Estudiante;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EstudianteService {
    private final EstudianteService estudianteService;

    public EstudianteResponse crearCuenta(EstudianteRequest request){
        Estudiante estudiante = Estudiante.builder()
        .nickname(request.getNickname())
        .nombre(request.getNombre())
        .apellido(request.getApellido())
        .correo(request.getCorreo())
        .build();

        return null;
    }
}
