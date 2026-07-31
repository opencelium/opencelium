/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.database.mongodb.converter;

import com.becon.opencelium.backend.enums.MethodType;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;

/**
 * Mongo converters that persist {@link MethodType} as its wire value
 * ({@code "CONNECTOR"}, {@code "HTTP_REQUEST"}, {@code "WEBHOOK"}), keeping the stored
 * document identical to the REST contract even if a wire value ever diverges from the
 * constant name — and failing loudly with the accepted-values list on a corrupt document.
 * <p>
 * Registered in {@code DatabaseConfiguration#mongoCustomConversions()}.
 */
public final class MethodTypeConverters {

    private MethodTypeConverters() {
    }

    @WritingConverter
    public enum MethodTypeWritingConverter implements Converter<MethodType, String> {
        INSTANCE;

        @Override
        public String convert(MethodType source) {
            return source.getValue();
        }
    }

    @ReadingConverter
    public enum MethodTypeReadingConverter implements Converter<String, MethodType> {
        INSTANCE;

        @Override
        public MethodType convert(String source) {
            return MethodType.fromValue(source);
        }
    }
}
