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

import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.enums.ConnectorStatus;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class ConnectorHealthServiceImp implements ConnectorHealthService {

    private static final Logger log = LoggerFactory.getLogger(ConnectorHealthServiceImp.class);

    private final ConnectorService connectorService;
    private final InvokerService invokerService;
    private final ConnectorStatusListener statusListener;
    private final int failureThreshold;
    private final boolean requestLoggingEnabled;
    private final int logMaxBodyLength;

    /** In-memory flap-damping state per connector id, lazily seeded from the persisted status. */
    private final ConcurrentHashMap<Integer, HealthState> states = new ConcurrentHashMap<>();

    public ConnectorHealthServiceImp(
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("invokerServiceImp") InvokerService invokerService,
            ObjectProvider<ConnectorStatusListener> statusListenerProvider,
            @Value("${" + AppYamlPath.CONNECTOR_HEALTH_FAILURE_THRESHOLD + ":3}") int failureThreshold,
            @Value("${" + AppYamlPath.CONNECTOR_HEALTH_LOG_ENABLED + ":false}") boolean requestLoggingEnabled,
            @Value("${" + AppYamlPath.CONNECTOR_HEALTH_LOG_MAX_BODY_LENGTH + ":500}") int logMaxBodyLength
    ) {
        this.connectorService = connectorService;
        this.invokerService = invokerService;
        this.statusListener = statusListenerProvider.getIfAvailable(() -> (connector, status, result) -> { });
        this.failureThreshold = failureThreshold;
        this.requestLoggingEnabled = requestLoggingEnabled;
        this.logMaxBodyLength = logMaxBodyLength;
    }

    @Override
    public CheckResult check(Connector connector) {
        long startNanos = System.nanoTime();
        ResponseEntity<?> responseEntity;
        try {
            responseEntity = connectorService.checkCommunication(connector);
        } catch (Exception ex) {
            log.debug("Health check request failed for connector '{}'", connector.getTitle(), ex);
            CheckResult failed = new CheckResult(
                    ConnectorStatus.DOWN, ex.getMessage(), elapsedMs(startNanos), new Date(), null);
            logCheck(connector, failed, null);
            return failed;
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
        CheckResult result = new CheckResult(status, error, latencyMs, new Date(), responseEntity.getStatusCode());
        logCheck(connector, result, responseEntity.getBody());
        return result;
    }

    /**
     * Logs one health-check request/response pair at INFO when
     * {@code opencelium.connector-health.request-logging.enabled} is on. The endpoint is
     * logged as the invoker's template (placeholders unresolved) on purpose, so
     * credentials injected into the URL or query string never reach the log. The
     * response body is truncated to the configured maximum.
     */
    private void logCheck(Connector connector, CheckResult result, Object responseBody) {
        if (!requestLoggingEnabled) {
            return;
        }
        String method = "?";
        String endpoint = "?";
        try {
            FunctionInvoker testFunction = invokerService.getTestFunction(connector.getInvoker());
            method = testFunction.getRequest().getMethod();
            endpoint = testFunction.getRequest().getEndpoint();
        } catch (Exception ignored) {
            // Unknown or incomplete invoker — the log line still carries the outcome.
        }
        String payload = responseBody != null ? String.valueOf(responseBody) : result.error();
        log.info("Health check: connector='{}' (id={}), request={} {}, outcome={}, http={}, latency={}ms, response={}",
                connector.getTitle(),
                connector.getId(),
                method,
                endpoint,
                result.status(),
                result.httpStatus() == null ? "-" : result.httpStatus(),
                result.latencyMs(),
                truncate(payload));
    }

    private String truncate(String value) {
        if (value == null) {
            return "-";
        }
        if (value.length() <= logMaxBodyLength) {
            return value;
        }
        return value.substring(0, logMaxBodyLength) + "... (truncated)";
    }

    @Override
    public void runCheck(Connector connector) {
        HealthState state = states.computeIfAbsent(
                connector.getId(), id -> new HealthState(connector.getStatus()));
        if (!state.tryAcquire()) {
            log.debug("Health check for connector '{}' already in flight — skipped", connector.getTitle());
            return;
        }
        try {
            CheckResult result;
            try {
                result = check(connector);
            } catch (Exception ex) {
                // check() only shields the remote request itself; classification errors
                // (unknown invoker, unparsable response, ...) also count as DOWN here.
                log.debug("Health check failed for connector '{}'", connector.getTitle(), ex);
                result = new CheckResult(ConnectorStatus.DOWN, ex.getMessage(), 0, new Date(), null);
            }
            connectorService.updateLastCheckedAt(connector.getId(), result.checkedAt());
            CheckResult outcome = result;
            state.apply(result.status(), failureThreshold).ifPresent(newStatus -> {
                connectorService.updateStatus(connector.getId(), newStatus, outcome.error());
                statusListener.onStatusTransition(connector, newStatus, outcome);
            });
        } finally {
            state.release();
        }
    }

    @Override
    public void evict(int connectorId) {
        states.remove(connectorId);
    }

    private static long elapsedMs(long startNanos) {
        return TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startNanos);
    }

    /**
     * Flap-damping state machine for one connector. A failure ({@code DOWN} or
     * {@code AUTH_FAILED}) is published only after {@code threshold} consecutive
     * failed checks; recovery to {@code UP} is published on the first success.
     */
    static final class HealthState {

        private final AtomicBoolean inFlight = new AtomicBoolean(false);
        private ConnectorStatus publishedStatus;
        private int consecutiveFailures;

        HealthState(ConnectorStatus initial) {
            this.publishedStatus = initial == null ? ConnectorStatus.UNKNOWN : initial;
        }

        boolean tryAcquire() {
            return inFlight.compareAndSet(false, true);
        }

        void release() {
            inFlight.set(false);
        }

        /**
         * Feeds one raw check outcome into the state machine. Returns the new status
         * exactly when a damped transition happens, empty otherwise.
         */
        synchronized Optional<ConnectorStatus> apply(ConnectorStatus raw, int threshold) {
            if (raw == ConnectorStatus.UP) {
                consecutiveFailures = 0;
                if (publishedStatus != ConnectorStatus.UP) {
                    publishedStatus = ConnectorStatus.UP;
                    return Optional.of(ConnectorStatus.UP);
                }
                return Optional.empty();
            }
            // DOWN and AUTH_FAILED are damped identically.
            consecutiveFailures++;
            if (consecutiveFailures >= threshold && publishedStatus != raw) {
                publishedStatus = raw;
                return Optional.of(raw);
            }
            return Optional.empty();
        }
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
