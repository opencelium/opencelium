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

package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.authentication.AuthenticationType;
import com.becon.opencelium.backend.factory.AuthenticationFactory;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.mysql.repository.ConnectorRepository;
import com.becon.opencelium.backend.neo4j.entity.MethodNode;
import com.becon.opencelium.backend.neo4j.service.MethodNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.OperatorNodeServiceImp;
import com.becon.opencelium.backend.invoker.InvokerRequestBuilder;
import com.becon.opencelium.backend.resource.connection.ConnectorNodeResource;
import com.becon.opencelium.backend.resource.connection.MethodResource;
import com.becon.opencelium.backend.resource.connection.OperatorResource;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.resource.connector.InvokerResource;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Repository;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class ConnectorServiceImp implements ConnectorService{

    @Autowired
    private ConnectorRepository connectorRepository;

    @Autowired
    private RequestDataServiceImp requestDataService;

    @Autowired
    private InvokerServiceImp invokerServiceImp;

    @Autowired
    private MethodNodeServiceImp methodNodeService;

    @Autowired
    private OperatorNodeServiceImp operatorNodeService;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private InvokerServiceImp invokerService;

    @Override
    public Optional<Connector> findById(int id) {
        return connectorRepository.findById(id);
    }

    @Override
    public void save(Connector connector) {
        connectorRepository.save(connector);
    }

    @Override
    public void saveAll(List<Connector> connectors) {
        connectorRepository.saveAll(connectors);
    }

    @Override
    public void deleteById(int id) {
        connectorRepository.deleteById(id);
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
    public List<Connector> findAll() {
        return connectorRepository.findAll();
    }

    @Override
    public Connector toEntity(ConnectorResource resource) {
        Connector connector = new Connector();
        connector.setId(resource.getConnectorId());
        connector.setTitle(resource.getTitle());
        connector.setIcon(resource.getIcon());
        connector.setDescription(resource.getDescription());
        connector.setInvoker(resource.getInvoker().getName());

        List<RequestData> requestData = requestDataService.toEntity(resource.getRequestData());
        requestData.forEach(r -> {
            RequestData data = requestDataService.findByConnectorIdAndField(connector.getId(), r.getField()).orElse(null);
            if (data != null){
                r.setId(data.getId());
            }
            r.setConnector(connector);
        });

        List<RequiredData> requiredData = invokerServiceImp.findByName(resource.getInvoker().getName()).getRequiredData();

        requestData.forEach(data -> {
            String visibility = requiredData.stream()
                    .filter(d -> d.getName().equals(data.getField()))
                    .map(RequiredData::getVisibility)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Visibility not found while converting to entity for field:" + data.getField()));
            
            data.setVisibility(visibility);
        });

        connector.setRequestData(requestData);
        return connector;
    }

    @Override
    public ConnectorResource toResource(Connector entity) {
        final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        final String path = uri.getScheme() + "://" + uri.getAuthority() + "/api/connector/";
        ConnectorResource connectorResource = new ConnectorResource();
        connectorResource.setConnectorId(entity.getId());
        connectorResource.setTitle(entity.getTitle());
        connectorResource.setDescription(entity.getTitle());
        connectorResource.setIcon(path + entity.getIcon());

        Invoker invoker = invokerServiceImp.findByName(entity.getInvoker());
        connectorResource.setInvoker(invokerServiceImp.toResource(invoker));
        connectorResource.setRequestData(requestDataService.toResource(entity.getRequestData()));
        return connectorResource;
    }

    @Override
    public ConnectorNodeResource toNodeResource(Connector entity, Long connectionId) {
        ConnectorNodeResource connectorNodeResource = new ConnectorNodeResource();

        connectorNodeResource.setConnectorId(entity.getId());
        InvokerResource invokerResource = invokerServiceImp.toResource(invokerServiceImp.findByName(entity.getInvoker()));
        connectorNodeResource.setInvoker(invokerResource);
        connectorNodeResource.setTitle(entity.getTitle());
        List<MethodResource> methodResources = methodNodeService
                .findMethodsByConnectionIdAndConnectorId(connectionId, entity.getId()).stream()
                .map(m -> {
                    MethodNode methodNode = methodNodeService.findById(m.getId()).get();
                    return MethodNodeServiceImp.toResource(methodNode);
                }).collect(Collectors.toList());

        List<OperatorResource> operatorResources = operatorNodeService
                .findOperatorsByConnectionIdAndConnectorId(connectionId, entity.getId()).stream()
                .map(OperatorNodeServiceImp::toResource).collect(Collectors.toList());
        connectorNodeResource.setMethods(methodResources);
        connectorNodeResource.setOperators(operatorResources);
        return connectorNodeResource;
    }

    @Override
    public ResponseEntity<?> checkCommunication(Connector connector) {
        InvokerRequestBuilder invokerRequestBuilder = new InvokerRequestBuilder(restTemplate);
        FunctionInvoker function = invokerServiceImp.getTestFunction(connector.getInvoker());
        return invokerRequestBuilder.setFunction(function).setRequestData(connector.getRequestData()).sendRequest();
    }

    @Override
    public List<RequestData> buildRequestData(Connector connector) {
        Invoker invoker = invokerService.findByName(connector.getInvoker());
        AuthenticationFactory authFactory = new AuthenticationFactory(invokerService.findAll(), restTemplate);
        AuthenticationType authenticationType = authFactory.getAuthType(invoker.getAuthType());
        if (invoker.getAuthType().equals("token")){
            ResponseEntity<?> responseEntity = checkCommunication(connector);
            return authenticationType.getAccessCredentials(connector, responseEntity);
        }

        return authenticationType.getAccessCredentials(connector);
    }
}
