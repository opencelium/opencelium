package com.becon.opencelium.backend.commons;

public class ThreadLocalSingleton {

    private static final ThreadLocal<Boolean> HAS_MASTER_PASSWORD = ThreadLocal.withInitial(() -> false);

    private ThreadLocalSingleton() {
    }

    public static Boolean hasMasterPassword() {
        return ThreadLocalSingleton.HAS_MASTER_PASSWORD.get();
    }

    public static void remove() {
        ThreadLocalSingleton.HAS_MASTER_PASSWORD.remove();
    }

    public static void setHasMasterPassword(boolean hasMasterPassword) {
        ThreadLocalSingleton.HAS_MASTER_PASSWORD.set(hasMasterPassword);
    }
}
