package com.becon.opencelium.backend.enums;

import com.fasterxml.jackson.databind.ObjectMapper;

public enum MaskPart {
    URL {
        @Override
        public String toRef(String operationId) {
            return operationId + ".(request).url";
        }

        @Override
        public String toString(Object message) {
            return message.toString();
        }
    },
    HEADER {
        @Override
        public String toRef(String operationId) {
            return operationId + ".(request).header";
        }

        @Override
        public String toString(Object message) {
            return message.toString();
        }
    },
    BODY {
        @Override
        public String toRef(String operationId) {
            return operationId + ".(request).body";
        }

        @Override
        public String toString(Object message) {
            return MaskPart.convertToStringIfNecessary(message);
        }
    },
    RESPONSE {
        @Override
        public String toRef(String operationId) {
            return operationId + ".(response).body";
        }

        @Override
        public String toString(Object message) {
            return MaskPart.convertToStringIfNecessary(message);
        }
    };

    public abstract String toRef(String operationId);

    public abstract String toString(Object message);

    private static String convertToStringIfNecessary(Object message) {
        if (message == null) {
            return "";
        } else if (message instanceof String result) {
            return result;
        }

        try {
            return new ObjectMapper().writer().withDefaultPrettyPrinter().writeValueAsString(message);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
