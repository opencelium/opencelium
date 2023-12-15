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
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.database.mysql.repository.ConnectorRepository;
import com.becon.opencelium.backend.exception.ConnectorNotFoundException;
import com.becon.opencelium.backend.invoker.InvokerRequestBuilder;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.utility.crypto.Encoder;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ConnectorServiceImp implements ConnectorService {

    private final ConnectorRepository connectorRepository;
    private final InvokerService invokerService;
    private final Encoder encoder;
    private final RequestDataService requestDataService;

    public ConnectorServiceImp(
            ConnectorRepository connectorRepository,
            @Qualifier("invokerServiceImp") InvokerService invokerService,
            @Qualifier("requestDataServiceImp") RequestDataServiceImp requestDataService,
            Encoder encoder
    ) {
        this.connectorRepository = connectorRepository;
        this.invokerService = invokerService;
        this.encoder = encoder;
        this.requestDataService = requestDataService;
    }

    @Override
    public Optional<Connector> findById(int id) {
        Optional<Connector> optional = connectorRepository.findById(id);
        optional.ifPresent(this::decrypt);
        return optional;
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
            c.getRequestData().forEach(r->r.setConnector(c));
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
    public boolean existById(int id) {
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
    public ResponseEntity<?> checkCommunication(Connector connector) {
        InvokerRequestBuilder invokerRequestBuilder = new InvokerRequestBuilder();
        FunctionInvoker function = invokerService.getTestFunction(connector.getInvoker());
        List<RequestData> requestData = buildRequestData(connector);

        return invokerRequestBuilder
                .setFunction(function)
                .setRequestData(requestData)
                .setSslCert(connector.isSslCert())
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
        return null;
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
