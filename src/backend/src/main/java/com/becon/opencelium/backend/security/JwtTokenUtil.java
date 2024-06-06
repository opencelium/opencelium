/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.security;

import com.becon.opencelium.backend.database.mysql.entity.Activity;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.utility.TokenUtility;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtTokenUtil {

    @Autowired
    private TokenUtility tokenUtility;

    public String getEmailFromToken(String token) {
        return getClaimFromToken(token, JWTClaimsSet::getSubject);
    }

    public String getTokenId(String token) {
        return getClaimFromToken(token, JWTClaimsSet::getJWTID);
    }

    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, JWTClaimsSet::getExpirationTime);
    }

    public Object getClaim(String token, String name){
        final JWTClaimsSet claims = getAllClaimsFromToken(token);
        return claims.getClaim(name);
    }

    public <T> T getClaimFromToken(String token, Function<JWTClaimsSet, T> claimsResolver) {
        final JWTClaimsSet claims = getAllClaimsFromToken(token);
        return  claimsResolver.apply(claims);
    }

    public String generateToken(UserPrincipals userDetails) {
        User user = userDetails.getUser();
        String token = UUID.randomUUID().toString();
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
            .claim("userId", user.getId())
            .claim("role", user.getUserRole().getName())
            .claim("sessionTime", tokenUtility.getActivityTime())
            .expirationTime(new Date(System.currentTimeMillis() + tokenUtility.getExpirationTime() * 1000))
            .issueTime(new Date(System.currentTimeMillis()))
            .subject(user.getEmail())
            .jwtID(token)
            .build();

        return doGenerateToken(claimsSet);
    }

    public Boolean validateToken(String token, UserPrincipals userDetails) {
        Activity activity = userDetails.getUser().getActivity();
        String tokenId = getTokenId(token);
        if (activity.isLocked()){
            return false;
        }
        final String email = getEmailFromToken(token);

        long inactiveTime = new Date().getTime() - activity.getRequestTime().getTime();
        if (inactiveTime > tokenUtility.getActivityTime()){
            return false;
        }

        return (email.equals(userDetails.getUsername())
                && !isTokenExpired(token)
                && tokenId.equals(activity.getTokenId()));
    }

    public JWTClaimsSet getAllClaimsFromToken(String token) {
        try {
            return SignedJWT.parse(token).getJWTClaimsSet();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }


    }

    private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }


    public String doGenerateToken(JWTClaimsSet claims) {
            try {
                RSAKey rsaJWK = new RSAKeyGenerator(2048)
                        .keyID("123")
                        .generate();
                // Create RSA-signer with the private key
                JWSSigner signer = new RSASSASigner(rsaJWK);
                SignedJWT signedJWT = new SignedJWT(
                        new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(rsaJWK.getKeyID()).build(),
                        claims);
                signedJWT.sign(signer);

                return signedJWT.serialize();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
    }
}
