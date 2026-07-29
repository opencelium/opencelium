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

package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.enums.ConnectorStatus;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class ConnectorHealthServiceImp implements ConnectorHealthService {

    private static final Logger log = LoggerFactory.getLogger(ConnectorHealthServiceImp.class);

    private final ConnectorService connectorService;
    private final InvokerService invokerService;

    public ConnectorHealthServiceImp(
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("invokerServiceImp") InvokerService invokerService
    ) {
        this.connectorService = connectorService;
        this.invokerService = invokerService;
    }

    @Override
    public CheckResult check(Connector connector) {
        long startNanos = System.nanoTime();
        ResponseEntity<?> responseEntity;
        try {
            responseEntity = connectorService.checkCommunication(connector);
        } catch (Exception ex) {
            log.debug("Health check request failed for connector '{}'", connector.getTitle(), ex);
            return new CheckResult(
                    ConnectorStatus.DOWN, ex.getMessage(), elapsedMs(startNanos), new Date(), null);
        }
        long latencyMs = elapsedMs(startNanos);

        FunctionInvoker functionInvoker = invokerService.getTestFunction(connector.getInvoker());

        Map<String, Object> failBody = null;
        String formatType = "";
        if (functionInvoker.getResponse().getFail() != null && functionInvoker.getResponse().getFail().getBody() != null) {
            formatType = functionInvoker.getResponse().getFail().getBody().getFormat();
            failBody = functionInvoker.getResponse().getFail().getBody().getFields();
        }

        String response = "";
        String fail = convertMapToJson(failBody);
        if (formatType.equals("json")) {
            response = responseEntity.getBody().toString();
        }

        ConnectorStatus status;
        String error = null;
        if ((responseEntity.getStatusCode() == HttpStatus.OK) && hasError(fail, response)) {
            // 200 whose body matches the invoker's declared fail body — the remote API
            // signals bad credentials in-band.
            status = ConnectorStatus.AUTH_FAILED;
            error = response;
        } else if (responseEntity.getStatusCode() == HttpStatus.UNAUTHORIZED) {
            status = ConnectorStatus.AUTH_FAILED;
            error = responseEntity.getBody() != null
                    ? responseEntity.getBody().toString()
                    : "Error in remote system";
        } else {
            status = ConnectorStatus.UP;
        }
        return new CheckResult(status, error, latencyMs, new Date(), responseEntity.getStatusCode());
    }

    private static long elapsedMs(long startNanos) {
        return TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startNanos);
    }

    private static String convertMapToJson(Map<String, Object> map) {
        try {
            return new ObjectMapper().writeValueAsString(map);
        } catch (Exception e) {
            log.warn("Could not serialize invoker fail body", e);
            return null;
        }
    }

    private static boolean hasError(String failBody, String response) {
        if (failBody == null || failBody.isEmpty()) {
            return false;
        }
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode invFailNode = objectMapper.readTree(failBody);
            JsonNode responseNode = objectMapper.readTree(response);

            return containsProperties(responseNode, invFailNode);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static boolean containsProperties(JsonNode jsonNode1, JsonNode jsonNode2) {
        if (jsonNode2.isObject()) {
            for (String key : iterable(jsonNode2.fieldNames())) {
                if (!jsonNode1.has(key)) {
                    return false;
                }
                if (!containsProperties(jsonNode1.get(key), jsonNode2.get(key))) {
                    return false;
                }
            }
        } else if (jsonNode2.isArray()) {
            if (!jsonNode1.isArray() || jsonNode1.size() < jsonNode2.size()) {
                return false;
            }
            for (int i = 0; i < jsonNode2.size(); i++) {
                if (!containsProperties(jsonNode1.get(i), jsonNode2.get(i))) {
                    return false;
                }
            }
        } else {
            return jsonNode1.isValueNode() && jsonNode2.isValueNode();
        }
        return true;
    }

    private static <T> Iterable<T> iterable(final Iterator<T> iterator) {
        return () -> iterator;
    }
}
