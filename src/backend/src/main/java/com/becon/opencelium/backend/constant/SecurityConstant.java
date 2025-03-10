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

package com.becon.opencelium.backend.constant;

public interface SecurityConstant {
    public static final String SECRET = "84bbce3d33de467b47b7e76c256376943f9aff968def8ef2674856f67ae8a93f";
    public static final long EXPIRATION_TIME = 24 * 60 * 60;
    public static final long ACTIVITY_TIME = 5 * 60 * 60;
    public static final String BEARER = "Bearer";
    public static final char LOCKED = '1';
    int CONN_REQ_TIMEOUT = 5 * 1000; //milliseconds
    int READ_TIMEOUT = 5 * 1000; //milliseconds
    int CONN_TIMEOUT = 5 * 1000; //milliseconds

    // License and Extra Ops Public key
    String PUBLIC_KEY ="MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAnj2andeiYdgRAp1jkLej" +
            "/xgslVEN+qodRNjguHNBV2gKHim9VXCvakAZveUqXN7/L7R+wlDrlnjLDWV5cN4a" +
            "WDQFPKK0YcH+A1oSI7m/SbBaeyQSwH5PT/kYG0AU3C1FItoshhDKDhvSMk5iUJc6" +
            "6ZXRg4xBH9x3jOfKHRrvJlLRx8NX+WLPJNLpVog/an2lmDqWw2AsJYgf8p18baCa" +
            "vHKil39e8gDNizAQhQdC1yEK4RLgtsmGFGnrhCjNaZ/+NriYE4D/CK71QT4d//eF" +
            "4LNgBqIGEPRb4ekt9qUH2T6F5XqiR90BFRLTyMv0ASos+k25GQqHS7WRjUHUOu0F" +
            "1UL9POtjLCVj39q9U9ip6G3UYTNJ7gF6wUpzwmqQuLID4Bx3YOT7GeaiPc2AdlQl" +
            "T5MbFSBMqHXcsScHfEQU2IPb2iYowLoKH7nqrCHOtR83/CDbzKKCHm0R072QmFh+" +
            "67YPL3U1Vg+zrT4emlEYSM3gdOrcb4Wgm85+sUs3aoWmRPsDITUG+vqAbZ2C/gxg" +
            "EmlVZzbKgH4NpFIO/eh7oW7cWXyJ+2Fc07T/NRs1UBAR6cjpZBFeVKIgIsWay6sF" +
            "ffOyv1lUM0DRvtM53BgaXV2V5TUbOzKlM+d2jBqlrCeq6TpJVG6FCrJsaaOgSq6Z" +
            "gt5JLtdbtZqZtnYndk3FT78CAwEAAQ==";
}
