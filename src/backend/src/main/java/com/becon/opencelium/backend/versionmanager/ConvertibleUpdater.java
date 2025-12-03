package com.becon.opencelium.backend.versionmanager;

public interface ConvertibleUpdater<I, O> {
    O updateAndConvert(I data);
}