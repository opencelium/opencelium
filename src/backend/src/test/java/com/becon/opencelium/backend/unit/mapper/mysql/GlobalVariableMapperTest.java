package com.becon.opencelium.backend.unit.mapper.mysql;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableChange;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableGrant;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.entity.UserDetail;
import com.becon.opencelium.backend.database.mysql.repository.CategoryRepository;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.database.mysql.repository.ConnectorRepository;
import com.becon.opencelium.backend.database.mysql.repository.NotificationRepository;
import com.becon.opencelium.backend.database.mysql.repository.UserRepository;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import com.becon.opencelium.backend.mapper.mysql.GlobalVariableMapper;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableChangeDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableChangeDTO.ChangedField;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableListItemDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariablePermissionsDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariablePickerItemDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableUsageDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableValueDTO;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.testutil.fixture.UserFixture;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.TextNode;
import java.util.EnumSet;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link GlobalVariableMapper}. The repositories it reads names from are mocked;
 * JSON is parsed by a real {@link ObjectMapper}.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableMapperTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GlobalVariableMapper — unit")
class GlobalVariableMapperTest {

    @Mock
    UserRepository userRepository;

    @Mock
    CategoryRepository categoryRepository;

    @Mock
    ConnectionRepository connectionRepository;

    @Mock
    ConnectorRepository connectorRepository;

    @Mock
    NotificationRepository notificationRepository;

    private GlobalVariableMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new GlobalVariableMapper(new ObjectMapper(), userRepository, categoryRepository,
                connectionRepository, connectorRepository, notificationRepository);
    }

    @Test
    @DisplayName("toDetail — the stored JSON text comes back as a JSON value, not as a string")
    void toDetailReturnsRealJsonWhenValueIsStoredAsText() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "tenants", "[{\"id\":\"acme\"},{\"id\":\"globex\"}]");

        GlobalVariableDTO dto = mapper.toDetail(variable, EnumSet.of(GlobalVariablePermission.VIEW_USE));

        assertThat(dto.value().isArray()).isTrue();
        assertThat(dto.value().get(1).get("id").asText()).isEqualTo("globex");
        assertThat(dto.hasValue()).isTrue();
        assertThat(dto.myPermissions()).containsExactly(GlobalVariablePermission.VIEW_USE);
    }

    @Test
    void toListItemCutsPreviewWhenValueExceeds100Characters() {
        String value = "\"" + "a".repeat(150) + "\"";
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "longText", value);

        GlobalVariableListItemDTO item = mapper.toListItem(variable, EnumSet.noneOf(GlobalVariablePermission.class), 0);

        assertThat(item.valuePreview()).isEqualTo(value.substring(0, 100));
    }

    @Test
    void toListItemKeepsWholeValueWhenValueHas100Characters() {
        String value = "\"" + "a".repeat(98) + "\"";
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "text", value);

        GlobalVariableListItemDTO item = mapper.toListItem(variable, EnumSet.noneOf(GlobalVariablePermission.class), 0);

        assertThat(item.valuePreview()).isEqualTo(value);
    }

    @Test
    @DisplayName("toChange — a CONFIG change lists its fields and carries no value")
    void toChangeReturnsChangedFieldsWhenChangeIsConfig() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        GlobalVariableChange change = GlobalVariableChange.savedByUser(variable, GlobalVariableChange.Type.CONFIG,
                3L, 4L, "{\"description\":\"old text\"}", "{\"description\":\"new text\"}", null);

        GlobalVariableChangeDTO dto = mapper.toChange(change);

        assertThat(dto.changedFields())
                .containsExactly(new ChangedField("description", new TextNode("old text"), new TextNode("new text")));
        assertThat(dto.oldValue()).isNull();
        assertThat(dto.newValue()).isNull();
    }

    @Test
    void toChangeReturnsValuesAsJsonWhenChangeIsValue() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        GlobalVariableChange change = GlobalVariableChange.savedByUser(variable, GlobalVariableChange.Type.VALUE,
                3L, 4L, "\"old\"", "{\"host\":\"new\"}", null);

        GlobalVariableChangeDTO dto = mapper.toChange(change);

        assertThat(dto.oldValue()).isEqualTo(new TextNode("old"));
        assertThat(dto.newValue().get("host").asText()).isEqualTo("new");
        assertThat(dto.changedFields()).isNull();
    }

    @Test
    void toPermissionsGroupsPermissionsWhenUserHasSeveralGrants() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        variable.getGrants().add(new GlobalVariableGrant(8, GlobalVariablePermission.VIEW_USE));
        variable.getGrants().add(new GlobalVariableGrant(8, GlobalVariablePermission.EDIT));
        variable.getGrants().add(new GlobalVariableGrant(9, GlobalVariablePermission.VIEW_USE));

        GlobalVariablePermissionsDTO dto = mapper.toPermissions(variable);

        assertThat(dto.grants()).hasSize(2);
        assertThat(dto.grants().get(0).user().id()).isEqualTo(8);
        assertThat(dto.grants().get(0).permissions())
                .containsExactlyInAnyOrder(GlobalVariablePermission.VIEW_USE, GlobalVariablePermission.EDIT);
        assertThat(dto.grants().get(1).user().id()).isEqualTo(9);
        assertThat(dto.grants().get(1).permissions()).containsExactly(GlobalVariablePermission.VIEW_USE);
    }

    @Test
    void toUsageReturnsWorkflowTitleWhenSourceIsWorkflow() {
        Connection workflow = new Connection();
        workflow.setId(42L);
        workflow.setTitle("VMware to i-doit");
        when(connectionRepository.findById(42L)).thenReturn(Optional.of(workflow));
        GlobalVariableUsage usage = GlobalVariableUsage.readByWorkflow(
                5L, 42L, GlobalVariableUsage.ElementType.METHOD, "0_1", "#ababab", "List objects", "endpoint");

        GlobalVariableUsageDTO dto = mapper.toUsage(usage);

        assertThat(dto).isEqualTo(new GlobalVariableUsageDTO(
                GlobalVariableUsage.SourceType.WORKFLOW, 42L, "VMware to i-doit",
                GlobalVariableUsage.ElementType.METHOD, "List objects", "#ababab", "0_1", "endpoint",
                GlobalVariableUsage.Access.READ));
    }

    @Test
    void toUsageReturnsNullTitleWhenWorkflowIsGone() {
        when(connectionRepository.findById(42L)).thenReturn(Optional.empty());
        GlobalVariableUsage usage = GlobalVariableUsage.readByWorkflow(
                5L, 42L, GlobalVariableUsage.ElementType.OPERATOR, "0_2", null, "if", "expression");

        GlobalVariableUsageDTO dto = mapper.toUsage(usage);

        assertThat(dto.sourceId()).isEqualTo(42L);
        assertThat(dto.sourceTitle()).isNull();
        assertThat(dto.color()).isNull();
    }

    @Test
    @DisplayName("toUsage — a connector has no elements: its title and the request data field say where")
    void toUsageReturnsConnectorTitleWhenSourceIsConnector() {
        Connector connector = new Connector();
        connector.setId(7);
        connector.setTitle("i-doit");
        when(connectorRepository.findById(7)).thenReturn(Optional.of(connector));
        GlobalVariableUsage usage = GlobalVariableUsage.readByConnector(5L, 7L, "url");

        GlobalVariableUsageDTO dto = mapper.toUsage(usage);

        assertThat(dto).isEqualTo(new GlobalVariableUsageDTO(
                GlobalVariableUsage.SourceType.CONNECTOR, 7L, "i-doit", null, null, null, null, "url",
                GlobalVariableUsage.Access.READ));
    }

    @Test
    @DisplayName("toUsage — a notification is titled by its name, its template is the element label")
    void toUsageReturnsNotificationNameWhenSourceIsNotification() {
        EventNotification notification = GlobalVariableFixture.aNotification(21, "Failure mail", null, null);
        when(notificationRepository.findById(21)).thenReturn(Optional.of(notification));
        GlobalVariableUsage usage = GlobalVariableUsage.readByNotification(5L, 21L, "Failure template", "en.body");

        GlobalVariableUsageDTO dto = mapper.toUsage(usage);

        assertThat(dto).isEqualTo(new GlobalVariableUsageDTO(
                GlobalVariableUsage.SourceType.NOTIFICATION, 21L, "Failure mail", null, "Failure template", null,
                null, "en.body", GlobalVariableUsage.Access.READ));
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("usagesOfMissingSources")
    void toUsageReturnsNullTitleWhenSourceIsGone(String source, GlobalVariableUsage usage) {
        lenient().when(connectorRepository.findById(7)).thenReturn(Optional.empty());
        lenient().when(notificationRepository.findById(21)).thenReturn(Optional.empty());

        GlobalVariableUsageDTO dto = mapper.toUsage(usage);

        assertThat(dto.sourceId()).isEqualTo(usage.getSourceId());
        assertThat(dto.sourceTitle()).isNull();
        assertThat(dto.field()).isEqualTo(usage.getField());
    }

    static Stream<Arguments> usagesOfMissingSources() {
        return Stream.of(
                Arguments.of("a connector", GlobalVariableUsage.readByConnector(5L, 7L, "url")),
                Arguments.of("a notification",
                        GlobalVariableUsage.readByNotification(5L, 21L, "Failure template", "en.body")));
    }

    @Test
    void userNameReturnsFullNameWhenProfileHasOne() {
        User user = aUser("jdoe@example.org");
        UserDetail detail = new UserDetail();
        detail.setName("Jane");
        detail.setSurname("Doe");
        user.setUserDetail(detail);
        when(userRepository.findById(8)).thenReturn(Optional.of(user));

        Optional<String> name = mapper.userName(8);

        assertThat(name).contains("Jane Doe");
    }

    @Test
    void userNameReturnsLoginWhenProfileHasNoName() {
        User user = aUser("jdoe@example.org");
        user.setUserDetail(new UserDetail());
        when(userRepository.findById(8)).thenReturn(Optional.of(user));

        Optional<String> name = mapper.userName(8);

        assertThat(name).contains("jdoe@example.org");
    }

    @Test
    void userNameReturnsEmptyWhenUserDoesNotExist() {
        when(userRepository.findById(8)).thenReturn(Optional.empty());

        Optional<String> name = mapper.userName(8);

        assertThat(name).isEmpty();
    }

    @Test
    void toPickerItemReturnsPreviewWhenVariableIsNotSecret() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "\"https://cmdb.example\"");
        variable.setDescription("Base URL of i-doit");

        GlobalVariablePickerItemDTO item = mapper.toPickerItem(variable);

        assertThat(item).isEqualTo(new GlobalVariablePickerItemDTO(
                "idoitUrl", GlobalVariableKind.CONSTANT, "Base URL of i-doit", false, "\"https://cmdb.example\""));
    }

    @Test
    void toPickerItemHidesPreviewWhenVariableIsSecret() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "apiKey", "\"s3cr3t\"");
        variable.setSecret(true);

        GlobalVariablePickerItemDTO item = mapper.toPickerItem(variable);

        assertThat(item.secret()).isTrue();
        assertThat(item.valuePreview()).isNull();
    }

    @Test
    @DisplayName("toValue — the stored JSON text comes back as a JSON value, not as a string")
    void toValueReturnsRealJsonWhenVariableHasValue() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(7L, "idoit", "{\"host\":\"cmdb.example\"}");
        variable.setVersion(4L);

        GlobalVariableValueDTO value = mapper.toValue(variable);

        assertThat(value.id()).isEqualTo(7L);
        assertThat(value.version()).isEqualTo(4L);
        assertThat(value.value().isObject()).isTrue();
        assertThat(value.value().get("host").asText()).isEqualTo("cmdb.example");
    }

    @Test
    void toValueHidesValueWhenVariableIsSecret() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(7L, "apiKey", "\"s3cr3t\"");
        variable.setSecret(true);

        GlobalVariableValueDTO value = mapper.toValue(variable);

        assertThat(value.id()).isEqualTo(7L);
        assertThat(value.value()).isNull();
    }

    @ParameterizedTest
    @EnumSource(value = GlobalVariableChange.Type.class, names = {"CREATE", "VALUE", "RESTORE"})
    void isRestorableReturnsTrueWhenEntrySavedValue(GlobalVariableChange.Type type) {
        GlobalVariableChange change = aSavedChange(type);

        boolean restorable = GlobalVariableMapper.isRestorable(change);

        assertThat(restorable).isTrue();
    }

    @ParameterizedTest
    @EnumSource(value = GlobalVariableChange.Type.class, names = {"CONFIG", "PERMISSIONS", "DELETE"})
    @DisplayName("isRestorable — entries of these types hold changed fields or nothing, never a value")
    void isRestorableReturnsFalseWhenEntryHoldsNoValue(GlobalVariableChange.Type type) {
        GlobalVariableChange change = aSavedChange(type);

        boolean restorable = GlobalVariableMapper.isRestorable(change);

        assertThat(restorable).isFalse();
    }

    /** A saved entry of the change log of variable 5 with something as its new value; only the type differs. */
    private static GlobalVariableChange aSavedChange(GlobalVariableChange.Type type) {
        return GlobalVariableChange.savedByUser(GlobalVariableFixture.aConstant(5L, "idoitUrl", "1"), type,
                3L, 4L, "\"old\"", "\"earlier\"", null);
    }

    private static User aUser(String email) {
        User user = UserFixture.anEmptyUser();
        user.setId(8);
        user.setEmail(email);
        return user;
    }
}
