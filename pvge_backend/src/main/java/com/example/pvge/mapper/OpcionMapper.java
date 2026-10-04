package com.example.pvge.mapper;

import org.springframework.stereotype.Component;

import com.example.pvge.dto.opcion.OpcionResponse;
import com.example.pvge.model.Opcion;

@Component 
public class OpcionMapper {
    public OpcionResponse toResponse(Opcion opcion){
        return OpcionResponse.builder()
                .id(opcion.getId())
                .texto(opcion.getTexto())
                .build();
    }
}
