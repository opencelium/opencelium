package com.becon.opencelium.backend.execution.masking;

public interface MaskingService {
    String applyMask(Object message, String ref);
}
