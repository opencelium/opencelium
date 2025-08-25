package com.becon.opencelium.backend.execution.logger.builder.strategies;

import com.becon.opencelium.backend.execution.logger.builder.*;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;

@Component
public class DefaultPhaseBuilderFactory implements PhaseBuilderFactory {

    private final Map<PhaseCategory, PhaseBuilder> builderMap = new EnumMap<>(PhaseCategory.class);
    private final PhaseBuilder defaultBuilder = new DefaultLogDataBuilder();

    public DefaultPhaseBuilderFactory() {
        registerBuilders();
    }

    private void registerBuilders() {
        builderMap.put(PhaseCategory.OPERATION, new OperationLogDataBuilder());
        builderMap.put(PhaseCategory.IF, new IfLogDataBuilder());
        builderMap.put(PhaseCategory.LOOP, new LoopLogDataBuilder());
    }

    @Override
    public PhaseBuilder getBuilder(PhaseCategory category) {
        return builderMap.getOrDefault(category, defaultBuilder);
    }
}
