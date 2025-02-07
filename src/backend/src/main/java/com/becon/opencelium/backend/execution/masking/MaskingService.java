package com.becon.opencelium.backend.execution.masking;

import com.becon.opencelium.backend.enums.MaskPart;

public interface MaskingService {
    String applyMask(Object message, MaskPart part);
    void setOperationId(String operationId);
}
