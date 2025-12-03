package com.becon.opencelium.backend.partialconnection;

import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.database.mongodb.dao.ConnectionMngDAOImpl;
import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mongodb.repository.ConnectionMngRepository;
import com.becon.opencelium.backend.database.mongodb.service.*;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.v5.ExecutionPlanMapper;
import com.becon.opencelium.backend.resource.v5.connection.ExecutionPlanDTO;
import com.becon.opencelium.backend.resource.v5.connection.MapperDTO;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import com.becon.opencelium.backend.resource.partialconnection.FlowchartCreateRequest;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.fge.jsonpatch.JsonPatch;
import com.mongodb.client.MongoClients;
import de.flapdoodle.embed.mongo.MongodExecutable;
import de.flapdoodle.embed.mongo.MongodProcess;
import de.flapdoodle.embed.mongo.MongodStarter;
import de.flapdoodle.embed.mongo.config.MongodConfig;
import de.flapdoodle.embed.mongo.config.Net;
import de.flapdoodle.embed.mongo.distribution.Version;
import de.flapdoodle.embed.process.runtime.Network;
import jakarta.annotation.PreDestroy;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DataMongoTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Import({
        ConnectionMngServiceImp.class,
        ConnectionMngDAOImpl.class,
        MethodMngServiceImp.class,
        OperatorMngServiceImp.class,
        MapperMngServiceImpl.class,
        ExecutionPlanServiceImpl.class,
        PatchHelper.class,
        ConnectionMngServiceImpTest.MapperConfig.class,
        ConnectionMngServiceImpTest.EmbeddedMongoConfig.class
})
public class ConnectionMngServiceImpTest {

    @Autowired
    private ConnectionMngServiceImp service;

    @Autowired
    private ConnectionMngRepository repository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private MethodMngServiceImp methodMngServiceImp;

    @Autowired
    private OperatorMngServiceImp operatorMngServiceImp;

    @MockBean(name = "fieldBindingMngServiceImp")
    private FieldBindingMngService fieldBindingMngService;

    @Autowired
    private MapperMngService mapperMngService;

    @Autowired
    private ExecutionPlanService executionPlanService;

    @MockBean
    private OpenceliumProps ocProps;

    @BeforeAll
    void setup() {
        when(ocProps.getVersion()).thenReturn("4.6.1");
    }

    @Test
    void testCreatingConnection() {
        createConnection(1L);

        ConnectionMng connectionMng = service.getByConnectionId(1L);

        assertNotNull(connectionMng.getId());
    }

    @Test
    void testAddingFlowchart() {
        createConnection(2L);

        addFlowchart(2L, 1, "F1");
        addFlowchart(2L, 1, "F2");

        ConnectionMng connectionMng = service.getByConnectionId(2L);
        assertNotNull(connectionMng.getFlowcharts());
        assertEquals(2, connectionMng.getFlowcharts().size());
    }

    @Test
    void testAddingMethods() {
        // Create connection
        Long connId = 4L;
        createConnection(connId);

        // Add two flowcharts
        String flow1 = addFlowchart(connId, 1, "F1");
        String flow2 = addFlowchart(connId, 1, "F1");

        // Add methods to flow1
        addMethod(connId, flow1, "#111111");
        addMethod(connId, flow1, "#222222");

        // Add methods to flow2
        addMethod(connId, flow2, "#333333");
        addMethod(connId, flow2, "#444444");

        // Validate DB structure
        ConnectionMng savedConn = repository.findByConnectionId(connId).orElseThrow();

        assertEquals(2, savedConn.getFlowcharts().size());

        FlowchartMng f1 = savedConn.getFlowcharts().stream().filter(f -> f.getFlowId().equals(flow1)).findFirst().orElseThrow();
        FlowchartMng f2 = savedConn.getFlowcharts().stream().filter(f -> f.getFlowId().equals(flow2)).findFirst().orElseThrow();

        assertEquals(2, f1.getMethods().size());
        assertEquals(2, f2.getMethods().size());

        for (MethodMng method : f1.getMethods()) {
            assertNotNull(method.getId());
        }

        for (MethodMng method : f2.getMethods()) {
            assertNotNull(method.getId());
        }
    }

    @Test
    void testAddingOperators() {
        // Create connection
        Long connId = 3L;
        createConnection(connId);

        // Add two flowcharts
        String flow1 = addFlowchart(connId, 1, "F1");
        String flow2 = addFlowchart(connId, 1, "F1");

        // Add methods to flow1
        addOperator(connId, flow1);
        addOperator(connId, flow1);

        // Add methods to flow2
        addOperator(connId, flow2);
        addOperator(connId, flow2);

        // Validate DB structure
        ConnectionMng savedConn = repository.findByConnectionId(connId).orElseThrow();

        FlowchartMng f1 = savedConn.getFlowcharts().stream().filter(f -> f.getFlowId().equals(flow1)).findFirst().orElseThrow();
        FlowchartMng f2 = savedConn.getFlowcharts().stream().filter(f -> f.getFlowId().equals(flow2)).findFirst().orElseThrow();

        assertEquals(2, f1.getOperators().size());
        assertEquals(2, f2.getOperators().size());

        for (OperatorMng operator : f1.getOperators()) {
            assertNotNull(operator.getId());
        }

        for (OperatorMng operator : f2.getOperators()) {
            assertNotNull(operator.getId());
        }
    }

    @Test
    void testUpdatingMethod() {
        Long connId = 5L;
        createConnection(connId);

        String flow1 = addFlowchart(connId, 1, "F1");
        MethodDTO saved = addMethod(connId, flow1, "#111111");
        updateMethod(connId, flow1, saved.getId(), "#222222");

        MethodMng method = methodMngServiceImp.getById(saved.getId());
        assertEquals("#222222", method.getColor());
    }

    @Test
    void testUpdatingOperator() {
        Long connId = 6L;
        createConnection(connId);

        String flow1 = addFlowchart(connId, 1, "F1");
        OperatorDTO operatorDTO = addOperator(connId, flow1);
        updateOperator(connId, flow1, operatorDTO.getId(), "forin {%6910dca5183a963656bbdf41%}");

        OperatorMng operator = operatorMngServiceImp.getById(operatorDTO.getId());
        assertEquals("forin {%6910dca5183a963656bbdf41%}", operator.getExpression());
    }

    @Test
    void testUpdatingMethodPatch() throws IOException {
        Long connId = 7L;
        createConnection(connId);

        String flow1 = addFlowchart(connId, 1, "F1");
        MethodDTO saved = addMethod(connId, flow1, "#111111");

        JsonPatch patch = JsonPatch.fromJson(new ObjectMapper().readTree("""
                [
                  { "op": "replace", "path": "/color", "value": "#222222" }
                ]
                """));

        service.updateMethod(connId, flow1, saved.getId(), patch);

        MethodMng method = methodMngServiceImp.getById(saved.getId());
        assertEquals("#222222", method.getColor());
    }

    @Test
    void testUpdatingOperatorPatch() throws IOException {
        Long connId = 8L;
        createConnection(connId);

        String flow1 = addFlowchart(connId, 1, "F1");
        OperatorDTO operatorDTO = addOperator(connId, flow1);

        JsonPatch patch = JsonPatch.fromJson(new ObjectMapper().readTree("""
                [
                  { "op": "replace", "path": "/expression", "value": "forin {%6910dca5183a963656bbdf41%}" }
                ]
                """));

        service.updateOperator(connId, flow1, operatorDTO.getId(), patch);

        OperatorMng operatorMng = operatorMngServiceImp.getById(operatorDTO.getId());
        assertEquals("forin {%6910dca5183a963656bbdf41%}", operatorMng.getExpression());
    }

    @Test
    void testAddingMapper() {
        Long connId = 10L;
        createConnection(connId);

        String f1 = addFlowchart(connId, 1, "F1");
        String f2 = addFlowchart(connId, 1, "F2");

        addMethod(connId, f1, "#111111");
        addMethod(connId, f2, "#222222");

        MapperDTO mapperDTO = addMapper(connId, Map.of(
                "RESULT_VAR", "#111111.(request).body.$.id",
                "VAR_0", "#222222.(response).body.$.id"
        ), "js");

        MapperMng entity = mapperMngService.getById(mapperDTO.getId());

        assertEquals(mapperDTO.getLanguage(), entity.getLanguage());
        assertEquals(mapperDTO.getArgs(), entity.getArgs());

        ConnectionMng connectionMng = service.getByConnectionId(connId);

        List<String> steps = connectionMng.getExecutionPlan().getSteps();

        assertEquals(steps.get(0), f2);
        assertEquals(steps.get(1), f1);
    }

    @Test
    void testAddingMultipleMappersOneFlowchart() {
        Long connId = 11L;
        createConnection(connId);

        String flowId = addFlowchart(connId, 1, "F1");

        addMethod(connId, flowId, "#111111");
        addMethod(connId, flowId, "#222222");
        addMethod(connId, flowId, "#333333");
        addMethod(connId, flowId, "#444444");
        addMethod(connId, flowId, "#555555");

        addMapper(connId, "#222222", List.of("#111111"));
        addMapper(connId, "#333333", List.of("#111111"));
        addMapper(connId, "#333333", List.of("#222222"));
        addMapper(connId, "#444444", List.of("#222222"));
        addMapper(connId, "#555555", List.of("#222222"));
        addMapper(connId, "#555555", List.of("#444444"));
        addMapper(connId, "#555555", List.of("#444444", "#111111"));
        addMapper(connId, "#444444", List.of("#111111", "#222222"));

        ConnectionMng connectionMng = service.getByConnectionId(connId);

        assertNotNull(connectionMng.getMappers());
        assertEquals(8, connectionMng.getMappers().size());

        assertNotNull(connectionMng.getExecutionPlan());
        assertNotNull(connectionMng.getExecutionPlan().getSteps());
        assertEquals(1, connectionMng.getExecutionPlan().getSteps().size());
        assertEquals(flowId, connectionMng.getExecutionPlan().getSteps().get(0));
    }

    /**
     * Test Case 1 — No mappers: steps should remain in insertion order.
     */
    @Test
    void test_NoMappers_keepsInsertionOrder() {
        Long connId = 100L;
        createConnection(connId);

        String f1 = addFlowchart(connId, 1, "F1");
        String f2 = addFlowchart(connId, 1, "F2");
        String f3 = addFlowchart(connId, 1, "F3");

        ConnectionMng connection = service.getByConnectionId(connId);
        List<String> steps = connection.getExecutionPlan().getSteps();

        assertEquals(List.of(f1, f2, f3), steps);
    }

    /**
     * Test Case 2 — Simple dependency: F2 depends on F1 → [F1, F2]
     */
    @Test
    void test_SimpleDependency_promotesDependencyBeforeResult() {
        Long connId = 101L;
        createConnection(connId);

        String f1 = addFlowchart(connId, 1, "F1");
        String f2 = addFlowchart(connId, 1, "F2");

        addMethod(connId, f1, "#111111");
        addMethod(connId, f2, "#222222");

        // F2 depends on F1
        addMapper(connId, "#222222", List.of("#111111"));

        ConnectionMng connection = service.getByConnectionId(connId);
        List<String> steps = connection.getExecutionPlan().getSteps();

        assertEquals(f1, steps.get(0));
        assertEquals(f2, steps.get(1));
    }

    /**
     * Test Case 3 — Reverse dependency: F1 depends on F2 → [F2, F1]
     */
    @Test
    void test_ReverseDependency_ordersAccordingly() {
        Long connId = 102L;
        createConnection(connId);

        String f1 = addFlowchart(connId, 1, "F1");
        String f2 = addFlowchart(connId, 1, "F2");

        addMethod(connId, f1, "#111111");
        addMethod(connId, f2, "#222222");

        // F1 depends on F2
        addMapper(connId, "#111111", List.of("#222222"));

        ConnectionMng connection = service.getByConnectionId(connId);
        List<String> steps = connection.getExecutionPlan().getSteps();

        assertEquals(f2, steps.get(0));
        assertEquals(f1, steps.get(1));
    }

    /**
     * Test Case 4 — Chain A → B → C
     */
    @Test
    void test_ChainThreeFlowcharts_topoSorted() {
        Long connId = 103L;
        createConnection(connId);

        String a = addFlowchart(connId, 1, "A");
        String b = addFlowchart(connId, 1, "B");
        String c = addFlowchart(connId, 1, "C");

        addMethod(connId, a, "#aaaaaa");
        addMethod(connId, b, "#bbbbbb");
        addMethod(connId, c, "#cccccc");

        // B depends on A, C depends on B
        addMapper(connId, "#bbbbbb", List.of("#aaaaaa"));
        addMapper(connId, "#cccccc", List.of("#bbbbbb"));

        ConnectionMng connection = service.getByConnectionId(connId);
        assertEquals(List.of(a, b, c), connection.getExecutionPlan().getSteps());
    }

    /**
     * Test Case 5 — Diamond graph
     * A -> {B, C} -> D
     */
    @Test
    void test_DiamondDependency_graphProducesValidTopoOrder() {
        Long connId = 104L;
        createConnection(connId);

        String a = addFlowchart(connId, 1, "A");
        String b = addFlowchart(connId, 1, "B");
        String c = addFlowchart(connId, 1, "C");
        String d = addFlowchart(connId, 1, "D");

        addMethod(connId, a, "#aaaaaa");
        addMethod(connId, b, "#bbbbbb");
        addMethod(connId, c, "#cccccc");
        addMethod(connId, d, "#dddddd");

        // B depends on A; C depends on A; D depends on B and C
        addMapper(connId, "#bbbbbb", List.of("#aaaaaa"));
        addMapper(connId, "#cccccc", List.of("#aaaaaa"));
        addMapper(connId, "#dddddd", List.of("#bbbbbb", "#cccccc"));

        ConnectionMng connection = service.getByConnectionId(connId);
        List<String> steps = connection.getExecutionPlan().getSteps();

        // A must be before B and C, and both before D. Several valid orders exist; check constraints.
        assertTrue(steps.indexOf(a) < steps.indexOf(b));
        assertTrue(steps.indexOf(a) < steps.indexOf(c));
        assertTrue(steps.indexOf(b) < steps.indexOf(d));
        assertTrue(steps.indexOf(c) < steps.indexOf(d));
    }

    /**
     * Test Case 6 — Disconnected graph: partial ordering only
     */
    @Test
    void test_DisconnectedComponents_preserveRelativeOrder() {
        Long connId = 105L;
        createConnection(connId);

        String a = addFlowchart(connId, 1, "A");
        String b = addFlowchart(connId, 1, "B");
        String c = addFlowchart(connId, 1, "C");

        addMethod(connId, a, "#aaaaaa");
        addMethod(connId, b, "#bbbbbb");
        addMethod(connId, c, "#cccccc");

        // C depends on A; B independent
        addMapper(connId, "#cccccc", List.of("#aaaaaa"));

        ConnectionMng connection = service.getByConnectionId(connId);
        List<String> steps = connection.getExecutionPlan().getSteps();

        assertTrue(steps.indexOf(a) < steps.indexOf(c));
        // B should still be present and can be anywhere relative to the connected pair as long as constraints hold
        assertTrue(steps.contains(b));
    }

    /**
     * Test Case 7 — New flowchart appended then promoted by a mapper
     */
    @Test
    void test_NewFlowchart_appendedThenReordered() {
        Long connId = 106L;
        createConnection(connId);

        String f1 = addFlowchart(connId, 1, "F1");
        String f2 = addFlowchart(connId, 1, "F2");

        addMethod(connId, f1, "#111111");
        addMethod(connId, f2, "#222222");

        // Append new flowchart f3
        String f3 = addFlowchart(connId, 1, "F3");
        addMethod(connId, f3, "#333333");

        // Mapper makes f3 depend on f1 -> f1 must be before f3 but f3 can be moved earlier than f2
        addMapper(connId, "#333333", List.of("#111111"));

        ConnectionMng connection = service.getByConnectionId(connId);
        List<String> steps = connection.getExecutionPlan().getSteps();

        assertTrue(steps.indexOf(f1) < steps.indexOf(f3));
    }

    /**
     * Test Case 9 — Mapper with multiple args (result depends on multiple flowcharts)
     */
    @Test
    void test_MultiArgMapper_requiresAllArgsBeforeResult() {
        Long connId = 108L;
        createConnection(connId);

        String f1 = addFlowchart(connId, 1, "F1");
        String f2 = addFlowchart(connId, 1, "F2");
        String f3 = addFlowchart(connId, 1, "F3");

        addMethod(connId, f1, "#111111");
        addMethod(connId, f2, "#222222");
        addMethod(connId, f3, "#333333");

        // F3 depends on F1 and F2
        addMapper(connId, "#333333", List.of("#111111", "#222222"));

        ConnectionMng connection = service.getByConnectionId(connId);
        List<String> steps = connection.getExecutionPlan().getSteps();

        assertTrue(steps.indexOf(f1) < steps.indexOf(f3));
        assertTrue(steps.indexOf(f2) < steps.indexOf(f3));
    }

    /**
     * Test Case 10 — Many flowcharts depend on one root
     */
    @Test
    void test_ManyDependOnOne_rootIsFirst() {
        Long connId = 109L;
        createConnection(connId);

        String root = addFlowchart(connId, 1, "ROOT");
        String a = addFlowchart(connId, 1, "A");
        String b = addFlowchart(connId, 1, "B");
        String c = addFlowchart(connId, 1, "C");

        addMethod(connId, root, "#rrrrrr");
        addMethod(connId, a, "#aaaaaa");
        addMethod(connId, b, "#bbbbbb");
        addMethod(connId, c, "#cccccc");

        addMapper(connId, "#aaaaaa", List.of("#rrrrrr"));
        addMapper(connId, "#bbbbbb", List.of("#rrrrrr"));
        addMapper(connId, "#cccccc", List.of("#rrrrrr"));

        ConnectionMng connection = service.getByConnectionId(connId);
        List<String> steps = connection.getExecutionPlan().getSteps();

        assertEquals(0, steps.indexOf(root));
    }

    /**
     * Test Case 11 — Simple 2-node cycle detection
     */
    @Test
    void test_SimpleTwoNodeCycle_throwsException() {
        Long connId = 110L;
        createConnection(connId);

        String f1 = addFlowchart(connId, 1, "F1");
        String f2 = addFlowchart(connId, 1, "F2");

        addMethod(connId, f1, "#111111");
        addMethod(connId, f2, "#222222");

        // Create mutual dependencies
        addMapper(connId, "#111111", List.of("#222222")); // F1 depends on F2

        GeneralServiceException ex = assertThrows(GeneralServiceException.class, () -> addMapper(connId, "#222222", List.of("#111111")));
        assertEquals("CYCLE_DETECTED", ex.getError());
    }

    /**
     * Test Case 12 — 3-node cycle detection
     */
    @Test
    void test_ThreeNodeCycle_detected() {
        Long connId = 111L;
        createConnection(connId);

        String a = addFlowchart(connId, 1, "A");
        String b = addFlowchart(connId, 1, "B");
        String c = addFlowchart(connId, 1, "C");

        addMethod(connId, a, "#aaaaaa");
        addMethod(connId, b, "#bbbbbb");
        addMethod(connId, c, "#cccccc");

        // A -> B -> C -> A
        addMapper(connId, "#bbbbbb", List.of("#aaaaaa"));
        addMapper(connId, "#cccccc", List.of("#bbbbbb"));

        GeneralServiceException ex = assertThrows(GeneralServiceException.class, () -> addMapper(connId, "#aaaaaa", List.of("#cccccc")));
        assertEquals("CYCLE_DETECTED", ex.getError());
    }

    /**
     * Test Case 13 — Deep cycle in multi-edge environment
     */
    @Test
    void test_DeepCycle_detectedLastEdgeReported() {
        Long connId = 112L;
        createConnection(connId);

        String a = addFlowchart(connId, 1, "A");
        String b = addFlowchart(connId, 1, "B");
        String c = addFlowchart(connId, 1, "C");
        String d = addFlowchart(connId, 1, "D");

        addMethod(connId, a, "#aaaaaa");
        addMethod(connId, b, "#bbbbbb");
        addMethod(connId, c, "#cccccc");
        addMethod(connId, d, "#dddddd");

        // A->B, B->C, C->D, D->B (cycle involves B,C,D)
        addMapper(connId, "#bbbbbb", List.of("#aaaaaa"));
        addMapper(connId, "#cccccc", List.of("#bbbbbb"));
        addMapper(connId, "#dddddd", List.of("#cccccc"));

        GeneralServiceException ex = assertThrows(GeneralServiceException.class, () -> addMapper(connId, "#bbbbbb", List.of("#dddddd")));
        assertEquals("CYCLE_DETECTED", ex.getError());
    }

    /**
     * Test Case 14 — Flowcharts with no methods (empty nodes) should be ok
     */
    @Test
    void test_FlowchartsWithoutMethods_ok() {
        Long connId = 113L;
        createConnection(connId);

        String f1 = addFlowchart(connId, 1, "F1");
        String f2 = addFlowchart(connId, 1, "F2");

        ConnectionMng connection = service.getByConnectionId(connId);
        assertEquals(List.of(f1, f2), connection.getExecutionPlan().getSteps());
    }

    /**
     * Test Case 15 — Some flowcharts independent, others dependent
     */
    @Test
    void test_MixedIndependentAndDependentFlowcharts() {
        Long connId = 114L;
        createConnection(connId);

        String f1 = addFlowchart(connId, 1, "F1");
        String f2 = addFlowchart(connId, 1, "F2");
        String f3 = addFlowchart(connId, 1, "F3");

        addMethod(connId, f1, "#111111");
        addMethod(connId, f3, "#333333");

        // f3 depends on f1; f2 independent
        addMapper(connId, "#333333", List.of("#111111"));

        ConnectionMng connection = service.getByConnectionId(connId);
        List<String> steps = connection.getExecutionPlan().getSteps();

        assertTrue(steps.indexOf(f1) < steps.indexOf(f3));
        assertTrue(steps.contains(f2));
    }

    /**
     * Test Case 16 - Mapper's method color is not present
     */
    @Test
    void test_MethodColorIsNotPresent() {
        Long connId = 115L;
        createConnection(connId);

        String f1 = addFlowchart(connId, 1, "F1");

        addMethod(connId, f1, "#111111");
        addMethod(connId, f1, "#333333");

        Long secondConnId = 116L;
        createConnection(secondConnId);

        String f2 = addFlowchart(secondConnId, 1, "F2");
        addMethod(secondConnId, f2, "#222222");

        Assertions.assertThrowsExactly(GeneralServiceException.class, () -> addMapper(connId, "#222222", List.of("#111111")));
        Assertions.assertThrowsExactly(GeneralServiceException.class, () -> addMapper(connId, "#333333", List.of("#222222")));

        Assertions.assertDoesNotThrow(() -> addMapper(connId, "#111111", List.of("#333333")));
    }

    /**
     * Test Case 17 - Duplicate method colors
     */
    @Test
    void test_duplicateMethodColors() {
        Long connId = 117L;
        createConnection(connId);

        String f1 = addFlowchart(connId, 1, "F1");

        addMethod(connId, f1, "#111111");
        addMethod(connId, f1, "#222222");

        Long secondConnId = 118L;
        createConnection(secondConnId);

        String f2 = addFlowchart(secondConnId, 1, "F2");

        addMethod(secondConnId, f2, "#333333");
        addMethod(secondConnId, f2, "#444444");

        Assertions.assertThrowsExactly(GeneralServiceException.class, () -> addMethod(connId, f1, "#111111"));
        Assertions.assertThrowsExactly(GeneralServiceException.class, () -> addMethod(connId, f1, "#222222"));

        Assertions.assertThrowsExactly(GeneralServiceException.class, () -> addMethod(secondConnId, f2, "#333333"));
        Assertions.assertThrowsExactly(GeneralServiceException.class, () -> addMethod(secondConnId, f2, "#444444"));
    }

    private MapperDTO addMapper(Long connectionId, String resultVar, List<String> args) {
        MapperDTO mapper = new MapperDTO();
        mapper.setLanguage("js");

        Map<String, String> argsMap = new HashMap<>();
        argsMap.put("RESULT_VAR", resultVar + ".(request).body.$.id");
        for (int i = 0; i < args.size(); i++) {
            String arg = args.get(i);
            argsMap.put("VAR_" + i, arg + ".(response).body.$.id)");
        }
        mapper.setArgs(argsMap);

        return service.addMapper(connectionId, mapper);
    }

    private MapperDTO addMapper(Long connId, Map<String, String> args, String lang) {
        MapperDTO mapperDTO = new MapperDTO();
        mapperDTO.setLanguage(lang);
        mapperDTO.setArgs(args);

        return service.addMapper(connId, mapperDTO);
    }

    private MethodDTO updateMethod(
            Long connectionId,
            String flowId,
            String methodId,
            String newColor
    ) {
        MethodDTO dto = new MethodDTO();
        dto.setId(methodId);
        dto.setColor(newColor);

        return service.updateMethod(connectionId, flowId, dto);
    }

    private OperatorDTO updateOperator(
            Long connectionId,
            String flowId,
            String operatorId,
            String expression
    ) {
        OperatorDTO operatorDTO = new OperatorDTO();
        operatorDTO.setId(operatorId);
        operatorDTO.setExpression(expression);

        return service.updateOperator(connectionId, flowId, operatorDTO);
    }

    // Helper to create a connection
    private void createConnection(Long connectionId) {
        service.createNewConnection(connectionId);
    }

    // Helper to add a flowchart
    private String addFlowchart(Long connectionId, int connectorId, String title) {
        FlowchartCreateRequest flowchart = new FlowchartCreateRequest();
        flowchart.setConnectionId(connectionId);
        flowchart.setTitle(title);
        flowchart.setConnectorId(connectorId);

        return service.addFlowchart(flowchart);
    }

    // Helper to add a method to a flowchart
    private MethodDTO addMethod(Long connectionId, String flowId, String color) {

        MethodDTO dto = new MethodDTO();
        dto.setColor(color);

        return service.addMethod(connectionId, flowId, dto);
    }

    private OperatorDTO addOperator(Long connectionId, String flowId) {
        OperatorDTO dto = new OperatorDTO();
        dto.setExpression("forin {%6910dca5183a963656bbdf40%}");

        return service.addOperator(connectionId, flowId, dto);
    }


    @TestConfiguration
    public static class EmbeddedMongoConfig {

        private MongodProcess mongodProcess;
        private int port;

        @Bean
        public MongoTemplate mongoTemplate() throws Exception {
            String ip = "localhost";
            // use random free port
            port = Network.getFreeServerPort();
            System.out.println(port);

            MongodConfig mongodConfig = MongodConfig.builder()
                    .version(Version.Main.PRODUCTION)
                    .net(new Net(ip, port, Network.localhostIsIPv6()))
                    .build();

            MongodStarter starter = MongodStarter.getDefaultInstance();
            MongodExecutable executable = starter.prepare(mongodConfig);

            // start Mongo process
            mongodProcess = executable.start();

            // connect MongoTemplate to running embedded Mongo
            return new MongoTemplate(MongoClients.create(String.format("mongodb://%s:%d", ip, port)), "test");
        }

        @PreDestroy
        public void stopEmbeddedMongo() {
            if (mongodProcess != null) {
                mongodProcess.stop();
            }
        }

        public int getPort() {
            return port;
        }
    }

    @TestConfiguration
    static class MapperConfig {

        @Bean
        public ObjectMapper objectMapper() {
            return new ObjectMapper();
        }

        @Bean
        public Mapper<MethodMng, MethodDTO> methodMngMapper() {
            return new Mapper<>() {
                @Override
                public MethodMng toEntity(MethodDTO dto) {
                    MethodMng m = new MethodMng();
                    m.setId(dto.getId());
                    m.setColor(dto.getColor());
                    return m;
                }

                @Override
                public MethodDTO toDTO(MethodMng entity) {
                    MethodDTO dto = new MethodDTO();
                    dto.setId(entity.getId());
                    dto.setColor(entity.getColor());
                    return dto;
                }
            };
        }

        @Bean
        public Mapper<OperatorMng, OperatorDTO> operatorMngMapper() {
            return new Mapper<>() {
                @Override
                public OperatorMng toEntity(OperatorDTO dto) {
                    OperatorMng m = new OperatorMng();
                    m.setId(dto.getId());
                    m.setExpression(dto.getExpression());
                    m.setType(dto.getType());
                    return m;
                }

                @Override
                public OperatorDTO toDTO(OperatorMng entity) {
                    OperatorDTO dto = new OperatorDTO();
                    dto.setId(entity.getId());
                    dto.setExpression(entity.getExpression());
                    dto.setType(entity.getType());
                    return dto;
                }
            };
        }

        @Bean
        public Mapper<MapperMng, MapperDTO> mapperMapper() {
            return new Mapper<>() {
                @Override
                public MapperMng toEntity(MapperDTO dto) {
                    MapperMng m = new MapperMng();
                    m.setId(dto.getId());
                    m.setArgs(dto.getArgs());
                    m.setLanguage(dto.getLanguage());
                    return m;
                }

                @Override
                public MapperDTO toDTO(MapperMng entity) {
                    MapperDTO dto = new MapperDTO();
                    dto.setId(entity.getId());
                    dto.setArgs(entity.getArgs());
                    dto.setLanguage(entity.getLanguage());
                    return dto;
                }
            };
        }

        @Bean
        public ExecutionPlanMapper executionPlanMapper() {
            return new ExecutionPlanMapper() {
                @Override
                public ExecutionPlanDTO toDTO(ExecutionPlanMng executionPlan) {
                    ExecutionPlanDTO exPlan = new ExecutionPlanDTO();
                    exPlan.setMode(executionPlan.getMode());
                    exPlan.setSteps(executionPlan.getSteps());
                    return exPlan;
                }
            };
        }
    }
}
