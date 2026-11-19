package com.becon.opencelium.backend.unit.database.mysql.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mysql.repository.MessageRepository;
import com.becon.opencelium.backend.database.mysql.service.ContentServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableUsageService;
import com.becon.opencelium.backend.database.mysql.service.MessageServiceImpl;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for what {@link MessageServiceImpl} does about global variable usages when a
 * notification template is deleted.
 *
 * <p>Run with: ./gradlew test --tests "*.MessageServiceImplTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MessageServiceImpl — unit")
class MessageServiceImplTest {

    private static final int TEMPLATE = 3;

    @Mock
    MessageRepository messageRepository;

    @Mock
    ContentServiceImpl contentService;

    @Mock
    GlobalVariableUsageService globalVariableUsageService;

    @InjectMocks
    MessageServiceImpl service;

    @Test
    @DisplayName("deleteById — the notifications go with the template, so their usages go while they can be found")
    void deleteByIdRemovesUsagesBeforeTemplateWhenTemplateExists() {
        when(messageRepository.findById(TEMPLATE))
                .thenReturn(Optional.of(GlobalVariableFixture.aTemplate(TEMPLATE, "Failure template")));

        service.deleteById(TEMPLATE);

        InOrder order = inOrder(globalVariableUsageService, messageRepository);
        order.verify(globalVariableUsageService).deleteForTemplate(TEMPLATE);
        order.verify(messageRepository).deleteById(TEMPLATE);
    }

    @Test
    void deleteByIdRemovesNoUsagesWhenTemplateDoesNotExist() {
        when(messageRepository.findById(TEMPLATE)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteById(TEMPLATE))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("TEMPLATE_NOT_FOUND");

        verifyNoInteractions(globalVariableUsageService);
        verify(messageRepository, never()).deleteById(anyInt());
    }
}
