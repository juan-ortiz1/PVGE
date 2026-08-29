package com.example.pvge.jwt;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

/**
 * JWTService
 * Clase que genera el AccessToken, el RefreshToken, extrae información de JWT y valida JWT (Json Web Token)
**/
@Service
public class JWTService {

    @Value("${jwt.secret}")
    private String jwtKey;

    /**
     * @param user
     * @return
     * Invoca el método privado getToken()
     */
    public String getToken(UserDetails user) {
        return getToken(new HashMap<>(), user);
    }


    public String getRefreshToken(UserDetails user) {
        return getRefreshToken(new HashMap<>(), user);
    }

    /**
     * 
     * @param extraClaims
     * @param user
     * @return
     * Genera accessToken invocando buildToken y pasando como parámetro extraClaims como Access + el usuario + la duración del token
     */
    private String getToken(Map<String, Object> extraClaims, UserDetails user) {
        extraClaims.put("type", "access");
        return buildToken(extraClaims, user, 1000 * 60 * 15L); // 15 minutes
    }

    private String getRefreshToken(Map<String, Object> extraClaims, UserDetails user) {
        extraClaims.put("type", "refresh");
        return buildToken(extraClaims, user, 1000L * 60 * 60 * 24 * 7); // 7 days
    }

    public String getTokenType(String token) {
        return getClaim(token, claims -> claims.get("type", String.class));
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails user, Long expiration) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(user.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key getKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String getUsernameFromToken(String token) {
        return getClaim(token, Claims::getSubject);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = getUsernameFromToken(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private Claims getAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public <T> T getClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Date getExpiration(String token) {
        return getClaim(token, Claims::getExpiration);
    }

    private boolean isTokenExpired(String token) {
        return getExpiration(token).before(new Date());
    }
}
