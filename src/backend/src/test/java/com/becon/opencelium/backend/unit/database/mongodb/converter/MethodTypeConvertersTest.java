/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.database.mongodb.converter;

import com.becon.opencelium.backend.database.mongodb.converter.MethodTypeConverters;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.enums.MethodType;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.convert.NoOpDbRefResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link MethodTypeConverters}.
 *
 * The converter pair keeps the Mongo document identical to the REST wire
 * contract ({@code "CONNECTOR"}, {@code "HTTP_REQUEST"}, {@code "WEBHOOK"}). The document-level
 * tests run a real {@link MappingMongoConverter} wired the same way as
 * {@code DatabaseConfiguration} — no Spring context, no Mongo — so a converter
 * that silently stops being applied fails here.
 *
 * Run with: ./gradlew test --tests "*.MethodTypeConvertersTest"
 */
class MethodTypeConvertersTest {

    private MappingMongoConverter mappingMongoConverter;

    @BeforeEach
    void setUp() {
        MongoCustomConversions conversions = new MongoCustomConversions(List.of(
                MethodTypeConverters.MethodTypeWritingConverter.INSTANCE,
                MethodTypeConverters.MethodTypeReadingConverter.INSTANCE));
        MongoMappingContext context = new MongoMappingContext();
        context.setSimpleTypeHolder(conversions.getSimpleTypeHolder());
        context.afterPropertiesSet();
        mappingMongoConverter = new MappingMongoConverter(NoOpDbRefResolver.INSTANCE, context);
        mappingMongoConverter.setCustomConversions(conversions);
        mappingMongoConverter.afterPropertiesSet();
    }

    // ── converter pair ────────────────────────────────────────────────────────

    @ParameterizedTest
    @CsvSource({
            "CONNECTOR, CONNECTOR",
            "HTTP_REQUEST, HTTP_REQUEST",
            "WEBHOOK, WEBHOOK",
    })
    void convertReturnsWireValueWhenWritingConstant(MethodType type, String wireValue) {
        assertThat(MethodTypeConverters.MethodTypeWritingConverter.INSTANCE.convert(type))
                .isEqualTo(wireValue);
    }

    @ParameterizedTest
    @CsvSource({
            "CONNECTOR, CONNECTOR",
            "HTTP_REQUEST, HTTP_REQUEST",
            "WEBHOOK, WEBHOOK",
    })
    void convertReturnsConstantWhenReadingWireValue(String wireValue, MethodType expected) {
        assertThat(MethodTypeConverters.MethodTypeReadingConverter.INSTANCE.convert(wireValue))
                .isEqualTo(expected);
    }

    @Test
    void convertThrowsIllegalArgumentExceptionWhenReadingUnknownValue() {
        assertThatThrownBy(() -> MethodTypeConverters.MethodTypeReadingConverter.INSTANCE.convert("SOAP"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("SOAP")
                .hasMessageContaining("CONNECTOR, HTTP_REQUEST, WEBHOOK");
    }

    // ── document-level mapping (converters actually applied) ─────────────────

    @Test
    void writeStoresWireValueWhenMethodMngIsConverted() {
        MethodMng method = new MethodMng();
        method.setMethodType(MethodType.CONNECTOR);
        Document document = new Document();

        mappingMongoConverter.write(method, document);

        assertThat(document.getString("method_type")).isEqualTo("CONNECTOR");
    }

    @Test
    void readRestoresConstantWhenDocumentHoldsWireValue() {
        Document document = new Document("method_type", "HTTP_REQUEST");

        MethodMng method = mappingMongoConverter.read(MethodMng.class, document);

        assertThat(method.getMethodType()).isEqualTo(MethodType.HTTP_REQUEST);
    }

    @Test
    void readLeavesMethodTypeNullWhenDocumentPredatesMethodTypes() {
        Document document = new Document("name", "getUsers");

        MethodMng method = mappingMongoConverter.read(MethodMng.class, document);

        assertThat(method.getMethodType()).isNull();
    }
}
