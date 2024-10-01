package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.resource.user.TotpResource;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Service
public class TotpServiceImpl implements TotpService {
    private final UserService userService;
    private final GoogleAuthenticator provider = new GoogleAuthenticator();

    public TotpServiceImpl(UserService userService) {
        this.userService = userService;
    }

    @Override
    @Transactional
    public TotpResource getTotpResource(int userId) {
        User user = userService.findById(userId).orElseThrow();

        String secretKey;
        if (user.getTotpSecretKey() != null) {
            secretKey = user.getTotpSecretKey();
        } else {
            secretKey = provider.createCredentials().getKey();
            user.setTotpSecretKey(secretKey);
        }

        String issuer = "opencelium";
        String account = user.getEmail();
        String data = String.format("otpauth://totp/%s:%s?secret=%s&issuer=%s", issuer, account, secretKey, issuer);

        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        int width = 300;
        int height = 300;
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, width, height);

            // Convert BitMatrix to BufferedImage
            BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    image.setRGB(x, y, bitMatrix.get(x, y) ? Color.BLACK.getRGB() : Color.WHITE.getRGB());
                }
            }

            // Write image to byte array
            ImageIO.write(image, "PNG", baos);
            byte[] qrCodeImage = baos.toByteArray();
            // Convert byte array to Base64
            String base64Image = Base64.getEncoder().encodeToString(qrCodeImage);

            return new TotpResource(secretKey, "data:image/png;base64," + base64Image);
        } catch (WriterException | IOException e) {
            throw new RuntimeException("Failed to generate QR code for TOTP");
        }
    }

    @Override
    @Transactional
    public boolean enableTotp(int userId, String code) {
        User user = userService.findById(userId).orElseThrow();

        if (user.isTotpEnabled()) {
            throw new RuntimeException("totp has already been enabled.");
        } else if (isValidTotp(user.getTotpSecretKey(), code)) {
            user.setTotpEnabled(true);
            return true;
        }

        throw new RuntimeException("Wrong totp code has been supplied.");
    }

    @Override
    @Transactional
    public boolean disableTotp(int userId, String code) {
        User user = userService.findById(userId).orElseThrow();

        if (!user.isTotpEnabled()) {
            throw new RuntimeException("totp has not been enabled yet.");
        } else if (isValidTotp(user.getTotpSecretKey(), code)) {
            user.setTotpEnabled(false);
            return true;
        }

        throw new RuntimeException("Wrong totp code has been supplied.");
    }

    @Override
    public boolean isValidTotp(String secret, String code) {
        return provider.authorize(secret, Integer.parseInt(code));
    }
}
