package com.becon.opencelium.backend.mapper.utils;

import com.becon.opencelium.backend.constant.PathConstant;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

public class ImageUtils {
    public static String resolveImagePath(String image){
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        String imagePath = uri.getScheme() + "://" + uri.getAuthority() + PathConstant.IMAGES;
        return image+imagePath;
    }
}
