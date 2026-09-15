package io.opencelium.core.config.secret;

import io.opencelium.core.testutil.TestKeys;
import org.junit.jupiter.api.Test;

import javax.crypto.AEADBadTagException;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

class AesGcmCipherTest {

    private static final byte[] PLAINTEXT = "canary-8f31c2a7".getBytes(StandardCharsets.UTF_8);
    private static final byte[] AAD = "t-123:sec_1".getBytes(StandardCharsets.UTF_8);

    private final AesGcmCipher cipher = new AesGcmCipher();
    private final SecretKey key = TestKeys.aes256();

    @Test
    void decryptReturnsTheOriginalValueWhenKeyIvAndAssociatedDataMatch() throws Exception {
        AesGcmCipher.Encrypted encrypted = cipher.encrypt(key, PLAINTEXT, AAD);

        assertThat(cipher.decrypt(key, encrypted.iv(), encrypted.ciphertext(), AAD)).isEqualTo(PLAINTEXT);
    }

    @Test
    void encryptNeverWritesThePlaintextIntoTheCiphertext() {
        AesGcmCipher.Encrypted encrypted = cipher.encrypt(key, PLAINTEXT, AAD);

        assertThat(new String(encrypted.ciphertext(), StandardCharsets.UTF_8)).doesNotContain("canary");
        assertThat(encrypted.iv()).hasSize(12);
    }

    @Test
    void encryptUsesAFreshIvSoTheSameValueNeverProducesTheSameCiphertext() {
        AesGcmCipher.Encrypted first = cipher.encrypt(key, PLAINTEXT, AAD);
        AesGcmCipher.Encrypted second = cipher.encrypt(key, PLAINTEXT, AAD);

        assertThat(first.iv()).isNotEqualTo(second.iv());
        assertThat(first.ciphertext()).isNotEqualTo(second.ciphertext());
    }

    @Test
    void decryptThrowsWhenTheCiphertextWasModified() {
        AesGcmCipher.Encrypted encrypted = cipher.encrypt(key, PLAINTEXT, AAD);
        byte[] tampered = encrypted.ciphertext().clone();
        tampered[0] ^= 0x01;

        assertThatExceptionOfType(AEADBadTagException.class)
                .isThrownBy(() -> cipher.decrypt(key, encrypted.iv(), tampered, AAD));
    }

    @Test
    void decryptThrowsWhenAssociatedDataBelongsToAnotherTenant() {
        AesGcmCipher.Encrypted encrypted = cipher.encrypt(key, PLAINTEXT, AAD);
        byte[] otherTenant = "t-999:sec_1".getBytes(StandardCharsets.UTF_8);

        assertThatExceptionOfType(AEADBadTagException.class)
                .isThrownBy(() -> cipher.decrypt(key, encrypted.iv(), encrypted.ciphertext(), otherTenant));
    }

    @Test
    void decryptThrowsWhenAnotherKeyIsUsed() {
        AesGcmCipher.Encrypted encrypted = cipher.encrypt(key, PLAINTEXT, AAD);

        assertThatExceptionOfType(AEADBadTagException.class)
                .isThrownBy(() -> cipher.decrypt(TestKeys.aes256(), encrypted.iv(), encrypted.ciphertext(), AAD));
    }
}
