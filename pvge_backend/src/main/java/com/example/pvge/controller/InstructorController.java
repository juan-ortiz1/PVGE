package com.example.pvge.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.pvge.dto.instructor.InstructorRequest;
import com.example.pvge.dto.instructor.InstructorResponse;
import com.example.pvge.service.InstructorService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/instructores")
@RequiredArgsConstructor
public class InstructorController {
    private final InstructorService instructorService;

    @PostMapping()
    public ResponseEntity<InstructorResponse> crearInstructor(@RequestBody InstructorRequest request) {
        return ResponseEntity.ok(instructorService.crearInstructor(request));
    }
    
}
