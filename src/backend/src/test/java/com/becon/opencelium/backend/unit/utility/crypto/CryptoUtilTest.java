package com.becon.opencelium.backend.unit.utility.crypto;

import com.becon.opencelium.backend.utility.crypto.CryptoUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.Cipher;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.util.ArrayList;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link CryptoUtil}.
 *
 * In tests real RSA key pairs are used instead of mocking crypto internals,
 * this validates the actual encryption/decryption contract. Tests also include
 * block concatenation behaviour for large payload.
 */
@DisplayName("CryptoUtil — unit")
class CryptoUtilTest {

    private KeyPair keyPair;

    @BeforeEach
    void setUp() throws Exception {
        keyPair = generateKeyPair();
    }

    // ── decrypt ───────────────────────────────────────────────────────────────

    @Test
    void decryptReturnsOriginalPayloadWhenContentEncryptedWithMatchingPrivateKey() throws Exception {
        String payload = "subscription-license-payload";

        String encrypted = encrypt(payload, keyPair.getPrivate());

        String publicKey = Base64.getEncoder()
                .encodeToString(keyPair.getPublic().getEncoded());

        byte[] decrypted = CryptoUtil.decrypt(encrypted, publicKey);

        assertThat(new String(decrypted, StandardCharsets.UTF_8))
                .isEqualTo(payload);
    }

    @Test
    void decryptReturnsOriginalPayloadWhenPayloadExceedsBlockMaxSize() throws Exception {
        String payload = "A".repeat(600);

        String encrypted = encrypt(payload, keyPair.getPrivate());

        String publicKey = Base64.getEncoder()
                .encodeToString(keyPair.getPublic().getEncoded());

        byte[] decrypted = CryptoUtil.decrypt(encrypted, publicKey);

        assertThat(new String(decrypted, StandardCharsets.UTF_8))
                .isEqualTo(payload);
    }

    @Test
    void decryptThrowsRuntimeExceptionWhenPublicKeyInvalid() {
        assertThatThrownBy(() ->
                CryptoUtil.decrypt("payload", "invalid-public-key"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void decryptThrowsRuntimeExceptionWhenEncryptedPayloadInvalid() {
        String publicKey = Base64.getEncoder()
                .encodeToString(keyPair.getPublic().getEncoded());

        assertThatThrownBy(() ->
                CryptoUtil.decrypt("invalid-base64", publicKey))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void decryptThrowsRuntimeExceptionWhenDifferentPrivateKeyUsed() throws Exception {
        String payload = "subscription-license-payload";
        PrivateKey differentPrivateKey = generateKeyPair().getPrivate();

        String encrypted = encrypt(payload, differentPrivateKey);

        String publicKey = Base64.getEncoder()
                .encodeToString(keyPair.getPublic().getEncoded());

        assertThatThrownBy(() ->
                CryptoUtil.decrypt(encrypted, publicKey))
                .isInstanceOf(RuntimeException.class);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private KeyPair generateKeyPair() throws NoSuchAlgorithmException {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);

        return generator.generateKeyPair();
    }

    private String encrypt(String payload, PrivateKey privateKey) throws Exception {
        final int MAX_ENCRYPT_BLOCK_SIZE = 245;

        Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
        cipher.init(Cipher.ENCRYPT_MODE, privateKey);

        byte[] data = payload.getBytes(StandardCharsets.UTF_8);

        ArrayList<byte[]> encryptedChunks = new ArrayList<>();

        int totalLength = 0;
        for (int i = 0; i < data.length; i += MAX_ENCRYPT_BLOCK_SIZE) {
            int length = Math.min(MAX_ENCRYPT_BLOCK_SIZE, data.length - i);
            byte[] encryptedChunk = cipher.doFinal(data, i, length);
            encryptedChunks.add(encryptedChunk);

            totalLength += encryptedChunk.length;
        }

        byte[] result = new byte[totalLength];

        int offset = 0;
        for (byte[] chunk : encryptedChunks) {
            System.arraycopy(chunk, 0, result, offset, chunk.length);
            offset += chunk.length;
        }

        return Base64.getEncoder().encodeToString(result);
    }
}
