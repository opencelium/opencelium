package com.becon.opencelium.backend.invoker.reader;

public interface PayloadReader {
    String read(String payload, String path);
}
