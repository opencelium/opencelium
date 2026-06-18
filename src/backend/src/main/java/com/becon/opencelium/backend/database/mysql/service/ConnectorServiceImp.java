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
import com.becon.opencelium.backend.constant.props.ConnectorProps;
import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.ExceptionMessages;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.database.mysql.repository.ConnectorRepository;
import com.becon.opencelium.backend.exception.ConnectorAlreadyExistsException;
import com.becon.opencelium.backend.exception.ConnectorNotFoundException;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.execution.logger.mapper.ParsedLogLineMapper;
import com.becon.opencelium.backend.execution.rdata.RequiredDataService;
import com.becon.opencelium.backend.execution.rdata.RequiredDataServiceImp;
import com.becon.opencelium.backend.invoker.InvokerRequestBuilder;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.utility.crypto.Encoder;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ConnectorServiceImp implements ConnectorService {

    private final ConnectorProps connectorProps;
    private final ConnectorRepository connectorRepository;
    private final InvokerService invokerService;
    private final Encoder encoder;
    private final RequestDataService requestDataService;
    private final Environment env;

    public ConnectorServiceImp(
            ConnectorProps connectorProps, ConnectorRepository connectorRepository,
            @Qualifier("invokerServiceImp") InvokerService invokerService,
            @Qualifier("requestDataServiceImp") RequestDataServiceImp requestDataService,
            Encoder encoder,
            Environment env
    ) {
        this.connectorProps = connectorProps;
        this.connectorRepository = connectorRepository;
        this.invokerService = invokerService;
        this.encoder = encoder;
        this.requestDataService = requestDataService;
        this.env = env;
    }

    @Override
    public Optional<Connector> findById(int id) {
        Optional<Connector> optional = connectorRepository.findById(id);
        try {
            optional.ifPresent(this::decrypt);
            return optional;
        } catch (RuntimeException e) {
            Connector saved = save(optional.get());
            return Optional.of(saved);
        }
    }

    @Override
    public Connector getById(Integer id) {
        return findById(id)
                .orElseThrow(() -> new ConnectorNotFoundException(id));
    }

    @Override
    public Connector save(Connector connector) {
        encrypt(connector);
        List<RequestData> requestData = connector.getRequestData();
        connector.setRequestData(null);
        Connector saved = connectorRepository.save(connector);
        requestData.forEach(r -> r.setConnector(saved));
        List<RequestData> savedRD = requestDataService.saveAll(requestData);
        saved.setRequestData(savedRD);
        decrypt(saved);
        return saved;
    }

    @Override
    public void saveAll(List<Connector> connectors) {
        connectors.forEach(this::encrypt);
        connectors.forEach(c -> {
            c.getRequestData().forEach(r -> r.setConnector(c));
            requestDataService.saveAll(c.getRequestData());
            c.setRequestData(new ArrayList<>());
        });
        connectorRepository.saveAll(connectors);
    }

    @Override
    public void deleteById(int id) {
        connectorRepository.deleteById(id);
    }

    @Override
    public void deleteByInvoker(String invokerName) {
        connectorRepository.deleteByInvoker(invokerName);
    }

    @Override
    public boolean existsById(int id) {
        return connectorRepository.existsById(id);
    }

    @Override
    public boolean existByTitle(String title) {
        return connectorRepository.existsByTitle(title);
    }

    @Override
    public boolean existByInvoker(String invokerName) {
        return connectorRepository.existsByInvoker(invokerName);
    }

    @Override
    public List<Connector> findAllByInvoker(String invokerName) {
        List<Connector> list = connectorRepository.findAllByInvoker(invokerName);
        if (list != null && !list.isEmpty()) {
            list.forEach(this::decrypt);
        }
        return list;
    }

    @Override
    public List<Connector> findAll() {
        List<Connector> list = connectorRepository.findAll();
        if (!list.isEmpty()) {
            list.forEach(this::decrypt);
        }
        return list;
    }

    @Override
    public List<Connector> findAllByTitleContains(String title) {
        List<Connector> list = connectorRepository.findAllByTitleContains(title);
        if (list != null && !list.isEmpty()) {
            list.forEach(this::decrypt);
        }
        return list;
    }

    @Override
    public Optional<Connector> findAllByTitle(String title) {
        Optional<Connector> connector = connectorRepository.findByTitle(title);
        connector.ifPresent(this::decrypt);
        return connector;
    }

    @Override
    public Boolean existsMasterPassword() {
        return StringUtils.isNotBlank(connectorProps.getMasterPassword());
    }

    @Override
    public List<Connector> findByIds(IdentifiersDTO<Integer> ids) {
        if (ids == null || CollectionUtils.isEmpty(ids.getIdentifiers())) {
            return Collections.emptyList();
        }

        List<Connector> connectors = connectorRepository.findAllById(ids.getIdentifiers());
        connectors.forEach(this::decrypt);
        return connectors;
    }

    @Override
    public ResponseEntity<?> checkCommunication(Connector connector) {
        InvokerRequestBuilder invokerRequestBuilder = new InvokerRequestBuilder();
        FunctionInvoker function = invokerService.getTestFunction(connector.getInvoker());
        List<RequestData> requestData = buildRequestData(connector);

        String port = env.getProperty(AppYamlPath.PROXY_PORT, "");
        String host = env.getProperty(AppYamlPath.PROXY_HOST, "");
        String user = env.getProperty(AppYamlPath.PROXY_USER, "");
        String password = env.getProperty(AppYamlPath.PROXY_PASS, "");

        return invokerRequestBuilder
                .setFunction(function)
                .setRequestData(requestData)
                .setProxyHost(host)
                .setProxyPort(port)
                .setProxyUser(user)
                .setProxyPass(password)
                .setTimeout(connector.getTimeout())
                .setSslCert(connector.isSslValidation())
                .sendRequest();
    }

    @Override
    public ResponseEntity<?> getAuthorization(Connector connector) {
        InvokerRequestBuilder invokerRequestBuilder = new InvokerRequestBuilder();
        FunctionInvoker function = invokerService.getAuthFunction(connector.getInvoker());
        return invokerRequestBuilder.setFunction(function).setRequestData(connector.getRequestData()).sendRequest();
    }

    // TODO: must be refactored
    // RequestData = from db; RequiredData = from invoker
    @Override
    public List<RequestData> buildRequestData(Connector connector) {
        Invoker invoker = invokerService.findByName(connector.getInvoker());
        List<RequiredData> requiredData = invoker.getRequiredData();
        List<RequestData> requestData = connector.getRequestData();
        requiredData.forEach(rqd -> addFieldIfNotExists(requestData, rqd));

        // looping through request data nad looking for values that contains references
        // rqsd - requestData object
        RequiredDataService requiredDataService = new RequiredDataServiceImp(connector, requestData, invoker.getOperations());
        requestData.forEach(rqsd -> {
            String value = requiredDataService.getValue(rqsd).orElse(null);
            rqsd.setValue(value);
        });
        return requestData;
    }

    @Override
    public Connector update(Integer connectorId, ConnectorResource connectorResource) {
        Connector connector = connectorRepository.findById(connectorId)
                .orElseThrow(() -> new ConnectorNotFoundException(connectorId));

        if (existByTitle(connectorResource.getTitle()) && !connector.getTitle().equals(connectorResource.getTitle())) {
            throw new ConnectorAlreadyExistsException(connectorResource.getTitle());
        }

        // requestData and invoker can't be updated
        connector.setTitle(connectorResource.getTitle());
        connector.setIcon(connectorResource.getIcon());
        connector.setDescription(connectorResource.getDescription());
        connector.setSslValidation(connectorResource.isSslCert());
        connector.setTimeout(connectorResource.getTimeout());

        connectorRepository.save(connector);

        decrypt(connector);

        return connector;
    }

    @Override
    public void updateRequestData(Integer connectorId, Map<String, String> newRequestDataMap) {

        Connector connector = getById(connectorId);

        // Create a map of existing RequestData for quick lookup by field
        Map<String, RequestData> existingMap = connector.getRequestData().stream()
                .collect(Collectors.toMap(RequestData::getField, rd -> rd));

        // Build a map of invoker's required data keyed by field name
        Invoker invoker = invokerService.findByName(connector.getInvoker());
        Map<String, RequiredData> invokerFields = invoker.getRequiredData().stream()
                .collect(Collectors.toMap(RequiredData::getName, rd -> rd));

        // Handle updates and inserts
        for (Map.Entry<String, String> entry : newRequestDataMap.entrySet()) {
            String field = entry.getKey();
            String value = entry.getValue();

            RequestData existing = existingMap.get(field);
            if (existing == null) {
                RequiredData invokerField = invokerFields.get(field);
                if (invokerField == null) {
                    throw new GeneralServiceException(ExceptionConstant.REQUIRED_DATA_NOT_FOUND, ExceptionMessages.REQUIRED_DATA_NOT_FOUND.formatted(field));
                }
                RequestData newRequestData = new RequestData(field, encoder.encrypt(value));
                newRequestData.setConnector(connector);
                newRequestData.setVisibility(invokerField.getVisibility());
                existingMap.put(field, newRequestData);
            } else {
                existing.setValue(encoder.encrypt(value));
                existingMap.put(field, existing);
            }
        }

        requestDataService.saveAll(new ArrayList<>(existingMap.values()));
    }

    @Override
    public void verifyMasterPassword(String masterPassword) {
        if (Objects.isNull(masterPassword)) {
            throw new GeneralServiceException(
                    HttpStatus.BAD_REQUEST,
                    ExceptionConstant.MASTER_PASSWORD_IS_MISSING_IN_HEADER,
                    ExceptionMessages.MASTER_PASSWORD_IS_MISSING_IN_HEADER
            );
        }
        if (StringUtils.isBlank(connectorProps.getMasterPassword())) {
            throw new GeneralServiceException(
                    HttpStatus.BAD_REQUEST,
                    ExceptionConstant.MASTER_PASSWORD_NOT_EXIST,
                    "%s is not set in the application.yml file".formatted(AppYamlPath.MASTER_PASSWORD)
            );
        }
        if (!Objects.equals(connectorProps.getMasterPassword(), masterPassword)) {
            throw new GeneralServiceException(
                    HttpStatus.BAD_REQUEST,
                    ExceptionConstant.MASTER_PASSWORD_WRONG,
                    ExceptionMessages.MASTER_PASSWORD_WRONG
            );
        }
    }

    private void addFieldIfNotExists(List<RequestData> requestData, RequiredData rqd) {
        if (requestData.stream().noneMatch(rqsd -> rqsd.getField().equals(rqd.getName()))) {
            requestData.add(new RequestData(rqd));
        }
    }

    private void encrypt(Connector connector) {
        List<RequestData> requestData = connector.getRequestData();
        if (requestData != null) {
            requestData.forEach(e -> e.setValue(encoder.encrypt(e.getValue())));
        }
    }

    private void decrypt(Connector connector) {
        List<RequestData> requestData = connector.getRequestData();
        requestData.forEach(e -> e.setValue(encoder.decrypt(e.getValue())));
    }
}
