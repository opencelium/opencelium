package com.becon.opencelium.backend.execution.logger.builder;

public class MetadataBuilderFactory {

//    // Map PHASE → its corresponding MetadataBuilder strategy.
//    private final Map<LogLineStage, MetadataBuilder<? extends Context>> builderMap;
//
//    public MetadataBuilderFactory() {
//        // Initialize the map of strategies:
//        this.builderMap = new EnumMap<>(LogLineStage .class);
//        builderMap.put(LogLineStage.OPERATION_END, (execId, connId) -> new OperationMetadataBuilder(execId, connId));
//        builderMap.put(LogLineStage.LOOP_END, (execId, connId) -> new LoopMetadataBuilder(execId, connId));
//        builderMap.put(LogLineStage.IF_END, (execId, connId) -> new IfMetadataBuilder(execId, connId));
//    }
//
//    public MetadataBuilder getBuilder(LogLineStage stage) {
//        return builderMap.get(stage);
//    }
}
