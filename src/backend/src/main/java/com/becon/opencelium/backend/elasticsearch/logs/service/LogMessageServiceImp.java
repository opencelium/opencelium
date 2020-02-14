/*
 * // Copyright (C) <2019> <becon GmbH>
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

package com.becon.opencelium.backend.elasticsearch.logs.service;

import com.becon.opencelium.backend.elasticsearch.logs.entity.LogMessage;
import com.becon.opencelium.backend.elasticsearch.logs.repository.LogMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.UUID;

@Service
public class LogMessageServiceImp implements LogMessageService {

    @Autowired
    private LogMessageRepository logMessageRepository;

    @Override
    public LogMessage save(LogMessage logMessage) {
        return logMessageRepository.save(logMessage);
    }

    public static class LogBuilder {
        private String uuid;
        private String taId;
        private int orderId;
        private String method;
        private String exchange;
        private String methodPart;
        private String message;

        public static LogBuilder newInstance(){
            return new LogBuilder();
        }

        private LogBuilder() {}

        public LogBuilder setUuid(String uuid) {
            this.uuid = uuid;
            return this;
        }

        public LogBuilder setTaId(String taId) {
            this.taId = taId;
            return this;
        }

        public LogBuilder setOrderId(int orderId) {
            this.orderId = orderId;
            return this;
        }

        public LogBuilder setMethod(String method) {
            this.method = method;
            return this;
        }

        public LogBuilder setExchange(String exchange) {
            this.exchange = exchange;
            return this;
        }

        public LogBuilder setMethodPart(String methodPart) {
            this.methodPart = methodPart;
            return this;
        }

        public LogBuilder setMessage(String message) {
            this.message = message;
            return this;
        }

        public LogMessage build(){
            String datetime = new Timestamp(System.currentTimeMillis()).toString();
            if (uuid == null){
                uuid = UUID.randomUUID().toString();
            }

            LogMessage logMessage = new LogMessage();
            logMessage.setUuid(uuid);
            logMessage.setTaId(taId);
            logMessage.setOrderId(orderId);
            logMessage.setMethod(method);
            logMessage.setExchange(exchange);
            logMessage.setMethodPart(methodPart);
            logMessage.setMessage(message);
            logMessage.setDatetime(datetime);
            return logMessage;
        }
    }
}
