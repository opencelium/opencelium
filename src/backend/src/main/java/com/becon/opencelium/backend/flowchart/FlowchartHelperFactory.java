package com.becon.opencelium.backend.flowchart;

import com.becon.opencelium.backend.constant.FlowchartConstant;

public class FlowchartHelperFactory {

    private FlowchartHelperFactory() {
    }

    public static FlowchartHelper getInstance(String mode) {
        if (FlowchartConstant.SEQUENTIAL_MODE.equals(mode)) {
            return SequentialFlowchartHelper.getInstance();
        }

        throw new RuntimeException("Invalid flowchart mode: " + mode);
    }
}
