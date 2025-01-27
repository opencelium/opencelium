package com.becon.opencelium.backend.oc950;

import com.becon.opencelium.backend.enums.MaskPart;

public interface MaskingService {
    String applyMask(Object message, MaskPart part);
}
