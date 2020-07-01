package com.becon.opencelium.backend.constant;

public interface InvokerRegEx {
    String requiredData = "\\{(.*?)\\}";
    String responsePointer = "\\{%(.*?)%\\}";
}
