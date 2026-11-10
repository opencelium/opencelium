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

import com.becon.opencelium.backend.database.mysql.entity.Session;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.utility.TokenUtility;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.text.ParseException;
import java.util.Date;
import java.util.Optional;

@Component
public class JwtTokenUtil {

    private static final String USER_ID_CLAIM = "userId";

    @Autowired
    private TokenUtility tokenUtility;

    public String generateToken(User user) {
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
            .claim(USER_ID_CLAIM, user.getId())
            .claim("role", user.getUserRole().getName())
            .claim("sessionTime", tokenUtility.getActivityTime())
            .expirationTime(new Date(System.currentTimeMillis() + tokenUtility.getExpirationTime() * 1000))
            .issueTime(new Date(System.currentTimeMillis()))
            .subject(user.getPrincipal())
            .jwtID(user.getSession().getId())
            .build();

        return generateToken(claimsSet);
    }

    public String generateToken(JWTClaimsSet claims) {
        try {
            MACSigner signer = new MACSigner(tokenUtility.getSecret());
            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims); // Create signed JWT
            signedJWT.sign(signer); // Sign the JWT

            return signedJWT.serialize();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Parses {@code token} and verifies its signature against this server's secret.
     *
     * @return the claims when the token is well-formed and was issued by this server, otherwise
     *     empty. Nothing in an unverified token can be trusted, so callers read claims and touch
     *     the database only after this has returned a value.
     */
    public Optional<JWTClaimsSet> verify(String token) {
        try {
            SignedJWT signedJwt = SignedJWT.parse(token);
            if (!signedJwt.verify(new MACVerifier(tokenUtility.getSecret()))) {
                return Optional.empty();
            }
            return Optional.of(signedJwt.getJWTClaimsSet());
        } catch (ParseException | JOSEException e) {
            return Optional.empty();
        }
    }

    /**
     * Returns the id of the user a token was issued for, or empty when the claim is missing or not
     * numeric. The claim is written as a number; a numeric string is accepted as well.
     */
    public Optional<Integer> userIdOf(JWTClaimsSet claims) {
        Object userId = claims.getClaim(USER_ID_CLAIM);
        if (userId instanceof Number number) {
            return Optional.of(number.intValue());
        }
        if (userId instanceof String text) {
            try {
                return Optional.of(Integer.parseInt(text));
            } catch (NumberFormatException e) {
                return Optional.empty();
            }
        }
        return Optional.empty();
    }

    /**
     * Whether a verified token still grants {@code user} access: it has not expired, the user's
     * current session is the one it was issued for, that session is active, and it has been used
     * within the configured inactivity window.
     */
    public boolean belongsToActiveSession(JWTClaimsSet claims, User user) {
        Session session = user.getSession();
        if (session == null || !session.isActive()) {
            return false;
        }

        long inactiveTime = System.currentTimeMillis() - session.getLastAccessed().getTime();
        if (inactiveTime > tokenUtility.getActivityTime()) {
            return false;
        }

        Date expiration = claims.getExpirationTime();
        if (expiration == null || !expiration.after(new Date())) {
            return false;
        }

        return session.getId().equals(claims.getJWTID());
    }

    /**
     * Parses the claims of a token without verifying its signature. Used by the webhook token
     * flow; authentication goes through {@link #verify(String)}.
     */
    public JWTClaimsSet getAllClaimsFromToken(String token) {
        try {
            return SignedJWT.parse(token).getJWTClaimsSet();
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
    }
}
