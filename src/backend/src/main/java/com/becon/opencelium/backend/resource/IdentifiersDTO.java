package com.becon.opencelium.backend.resource;

import java.util.ArrayList;

public class IdentifiersDTO<T> {
    ArrayList<T> identifiers;

    public ArrayList<T> getIdentifiers() {
        return identifiers;
    }

    public void setIdentifiers(ArrayList<T> identifiers) {
        this.identifiers = identifiers;
    }
}
