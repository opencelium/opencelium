package com.becon.opencelium.backend.execution.logger.builder;

import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;

public interface PhaseBuilderFactory {
    PhaseBuilder getBuilder(PhaseCategory phaseType);
}
