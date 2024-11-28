package com.becon.opencelium.backend.utility.crypto;

public interface HmacValidator {
    boolean verify(String hmac);
}
