package com.becon.opencelium.backend.polygot_engine;

public class GraalVMHealthChecker implements EngineHealthChecker{
    @Override
    public boolean check() {
        String vmName = System.getProperty("java.vm.name");

        return vmName != null && vmName.toLowerCase().contains("graal");
    }
}
