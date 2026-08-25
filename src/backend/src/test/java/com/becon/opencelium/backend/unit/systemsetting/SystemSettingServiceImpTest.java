/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.systemsetting;

import com.becon.opencelium.backend.database.mysql.entity.SystemSetting;
import com.becon.opencelium.backend.database.mysql.repository.SystemSettingRepository;
import com.becon.opencelium.backend.database.mysql.service.SystemSettingServiceImp;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.storage.StorageService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SystemSettingServiceImp")
class SystemSettingServiceImpTest {

    private static final String THEME_COLORS = "theme_colors";
    private static final String APP_LOGO = "app_logo";
    private static final String VALID_JSON = "{\"primary\":\"#112233\",\"accent\":\"#445566\"}";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private SystemSettingRepository repository;

    @Mock
    private StorageService storageService;

    private SystemSettingServiceImp service;

    @BeforeEach
    void setUp() {
        service = new SystemSettingServiceImp(repository, objectMapper, storageService);
    }

    @Test
    void findReturnsSettingWhenPresent() {
        SystemSetting setting = settingOf(THEME_COLORS, VALID_JSON);
        when(repository.findById(THEME_COLORS)).thenReturn(Optional.of(setting));

        Optional<SystemSetting> result = service.find(THEME_COLORS);

        assertThat(result).contains(setting);
    }

    @Test
    void findReturnsEmptyWhenNameIsBlank() {
        assertThat(service.find(" ")).isEmpty();
        assertThat(service.find(null)).isEmpty();
        verify(repository, never()).findById(any());
    }

    @Test
    void saveCreatesNewSettingWhenAbsent() throws Exception {
        when(repository.findById(THEME_COLORS)).thenReturn(Optional.empty());
        when(repository.save(any(SystemSetting.class))).thenAnswer(inv -> inv.getArgument(0));

        SystemSetting saved = service.save(THEME_COLORS, objectMapper.readTree(VALID_JSON));

        assertThat(saved.getName()).isEqualTo(THEME_COLORS);
        assertThat(objectMapper.readTree(saved.getValue()))
                .isEqualTo(objectMapper.readTree(VALID_JSON));
    }

    @Test
    void saveUpdatesExistingSettingWhenPresent() throws Exception {
        SystemSetting existing = settingOf(THEME_COLORS, "{\"primary\":\"#000000\"}");
        when(repository.findById(THEME_COLORS)).thenReturn(Optional.of(existing));
        when(repository.save(any(SystemSetting.class))).thenAnswer(inv -> inv.getArgument(0));

        service.save(THEME_COLORS, objectMapper.readTree(VALID_JSON));

        ArgumentCaptor<SystemSetting> captor = ArgumentCaptor.forClass(SystemSetting.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue()).isSameAs(existing);
        assertThat(objectMapper.readTree(captor.getValue().getValue()))
                .isEqualTo(objectMapper.readTree(VALID_JSON));
    }

    @Test
    void saveThrowsBadRequestWhenNameIsReserved() throws Exception {
        JsonNode value = objectMapper.readTree(VALID_JSON);

        assertThatThrownBy(() -> service.save(APP_LOGO, value))
                .isInstanceOfSatisfying(GeneralServiceException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getError()).isEqualTo("RESERVED_SYSTEM_SETTING");
                });
        verify(repository, never()).save(any());
    }

    @Test
    void saveThrowsBadRequestWhenValueIsNull() {
        assertThatThrownBy(() -> service.save(THEME_COLORS, null))
                .isInstanceOfSatisfying(GeneralServiceException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(repository, never()).save(any());
    }

    @Test
    void saveThrowsBadRequestWhenValueIsJsonNull() {
        assertThatThrownBy(() -> service.save(THEME_COLORS, NullNode.getInstance()))
                .isInstanceOfSatisfying(GeneralServiceException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(repository, never()).save(any());
    }

    @Test
    void saveThrowsBadRequestWhenSerializedValueExceedsMaxLength() {
        JsonNode oversized = objectMapper.getNodeFactory().textNode("x".repeat(1100));

        assertThatThrownBy(() -> service.save(THEME_COLORS, oversized))
                .isInstanceOfSatisfying(GeneralServiceException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(repository, never()).save(any());
    }

    @Test
    void saveThrowsBadRequestWhenNameIsTooLong() throws Exception {
        String tooLong = "x".repeat(101);
        JsonNode value = objectMapper.readTree(VALID_JSON);

        assertThatThrownBy(() -> service.save(tooLong, value))
                .isInstanceOfSatisfying(GeneralServiceException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(repository, never()).save(any());
    }

    @Test
    void saveIconStoresFileAndSavesRowWhenNoPreviousIcon() throws Exception {
        when(repository.findById(APP_LOGO)).thenReturn(Optional.empty());
        when(repository.save(any(SystemSetting.class))).thenAnswer(inv -> inv.getArgument(0));

        SystemSetting saved = service.saveIcon(pngFile("logo.png"));

        ArgumentCaptor<String> filenameCaptor = ArgumentCaptor.forClass(String.class);
        verify(storageService).store(any(MultipartFile.class), filenameCaptor.capture());
        String storedFilename = filenameCaptor.getValue();
        assertThat(storedFilename).matches("[0-9a-f-]{36}\\.png");

        JsonNode value = objectMapper.readTree(saved.getValue());
        assertThat(saved.getName()).isEqualTo(APP_LOGO);
        assertThat(value.get("filename").asText()).isEqualTo(storedFilename);
        assertThat(value.get("url").asText()).isEqualTo("./storage/files/" + storedFilename);
        verify(storageService, never()).delete(anyString());
    }

    @Test
    void saveIconDeletesOldFileWhenPreviousIconExists() {
        SystemSetting existing = settingOf(APP_LOGO,
                "{\"filename\":\"old.png\",\"url\":\"./storage/files/old.png\"}");
        when(repository.findById(APP_LOGO)).thenReturn(Optional.of(existing));
        when(repository.save(any(SystemSetting.class))).thenAnswer(inv -> inv.getArgument(0));

        service.saveIcon(pngFile("logo.png"));

        InOrder inOrder = inOrder(storageService, repository);
        inOrder.verify(storageService).store(any(MultipartFile.class), anyString());
        inOrder.verify(repository).save(any(SystemSetting.class));
        inOrder.verify(storageService).delete("old.png");
    }

    @Test
    void saveIconThrowsBadRequestWhenFileIsEmpty() {
        MultipartFile empty = new MockMultipartFile("file", "logo.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> service.saveIcon(empty))
                .isInstanceOfSatisfying(GeneralServiceException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getError()).isEqualTo("INVALID_SYSTEM_SETTING_ICON");
                });
        assertThatThrownBy(() -> service.saveIcon(null))
                .isInstanceOf(GeneralServiceException.class);
        verifyNoInteractions(storageService);
        verify(repository, never()).save(any());
    }

    @Test
    void saveIconThrowsBadRequestWhenExtensionIsUnsupported() {
        assertThatThrownBy(() -> service.saveIcon(pngFile("logo.svg")))
                .isInstanceOfSatisfying(GeneralServiceException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getError()).isEqualTo("INVALID_SYSTEM_SETTING_ICON");
                });
        assertThatThrownBy(() -> service.saveIcon(pngFile("logo")))
                .isInstanceOf(GeneralServiceException.class);
        verifyNoInteractions(storageService);
        verify(repository, never()).save(any());
    }

    @Test
    void saveIconLowercasesExtensionWhenFilenameIsUppercase() {
        when(repository.findById(APP_LOGO)).thenReturn(Optional.empty());
        when(repository.save(any(SystemSetting.class))).thenAnswer(inv -> inv.getArgument(0));

        service.saveIcon(pngFile("LOGO.PNG"));

        ArgumentCaptor<String> filenameCaptor = ArgumentCaptor.forClass(String.class);
        verify(storageService).store(any(MultipartFile.class), filenameCaptor.capture());
        assertThat(filenameCaptor.getValue()).endsWith(".png");
    }

    @Test
    void saveIconDoesNotSaveRowWhenStoreFails() {
        when(repository.findById(APP_LOGO)).thenReturn(Optional.empty());
        doThrow(new StorageException("disk full"))
                .when(storageService).store(any(MultipartFile.class), anyString());

        assertThatThrownBy(() -> service.saveIcon(pngFile("logo.png")))
                .isInstanceOf(StorageException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void saveIconProceedsWhenExistingValueIsCorrupt() {
        SystemSetting corrupt = settingOf(APP_LOGO, "{corrupted");
        when(repository.findById(APP_LOGO)).thenReturn(Optional.of(corrupt));
        when(repository.save(any(SystemSetting.class))).thenAnswer(inv -> inv.getArgument(0));

        service.saveIcon(pngFile("logo.png"));

        verify(storageService).store(any(MultipartFile.class), anyString());
        verify(repository).save(any(SystemSetting.class));
        verify(storageService, never()).delete(anyString());
    }

    @Test
    void deleteIconRemovesRowThenFileWhenPresent() {
        SystemSetting existing = settingOf(APP_LOGO,
                "{\"filename\":\"old.png\",\"url\":\"./storage/files/old.png\"}");
        when(repository.findById(APP_LOGO)).thenReturn(Optional.of(existing));

        service.deleteIcon();

        InOrder inOrder = inOrder(repository, storageService);
        inOrder.verify(repository).delete(existing);
        inOrder.verify(storageService).delete("old.png");
    }

    @Test
    void deleteIconDoesNothingWhenAbsent() {
        when(repository.findById(APP_LOGO)).thenReturn(Optional.empty());

        service.deleteIcon();

        verify(repository, never()).delete(any());
        verifyNoInteractions(storageService);
    }

    @Test
    void deleteIconRemovesRowWithoutFileDeleteWhenFilenameMissing() {
        SystemSetting existing = settingOf(APP_LOGO, "{\"url\":\"./storage/files/old.png\"}");
        when(repository.findById(APP_LOGO)).thenReturn(Optional.of(existing));

        service.deleteIcon();

        verify(repository).delete(existing);
        verifyNoInteractions(storageService);
    }

    @Test
    void toJsonReturnsParsedValueWhenStoredValueIsValidJson() throws Exception {
        SystemSetting setting = settingOf(THEME_COLORS, VALID_JSON);

        JsonNode result = service.toJson(setting);

        assertThat(result).isEqualTo(objectMapper.readTree(VALID_JSON));
    }

    @Test
    void toJsonThrowsServerErrorWhenStoredValueIsCorrupt() {
        SystemSetting setting = settingOf(THEME_COLORS, "{corrupted");

        assertThatThrownBy(() -> service.toJson(setting))
                .isInstanceOfSatisfying(GeneralServiceException.class,
                        ex -> assertThat(ex.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR));
    }

    @Test
    void deleteRemovesSettingWhenPresent() {
        SystemSetting existing = settingOf(THEME_COLORS, VALID_JSON);
        when(repository.findById(THEME_COLORS)).thenReturn(Optional.of(existing));

        service.delete(THEME_COLORS);

        verify(repository).delete(existing);
    }

    @Test
    void deleteDoesNothingWhenAbsent() {
        when(repository.findById(THEME_COLORS)).thenReturn(Optional.empty());

        service.delete(THEME_COLORS);

        verify(repository, never()).delete(any());
    }

    private static MultipartFile pngFile(String originalFilename) {
        return new MockMultipartFile("file", originalFilename, "image/png", new byte[] {1, 2, 3});
    }

    private static SystemSetting settingOf(String name, String value) {
        SystemSetting setting = new SystemSetting();
        setting.setName(name);
        setting.setValue(value);
        return setting;
    }
}
