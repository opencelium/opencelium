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

import com.becon.opencelium.backend.constant.DataRef;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.execution.rdata.RequiredDataService;
import com.becon.opencelium.backend.execution.rdata.RequiredDataServiceImp;
import com.becon.opencelium.backend.execution.rdata.extractor.Extractor;
import com.becon.opencelium.backend.execution.rdata.extractor.ExtractorFactory;
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
import com.becon.opencelium.backend.utility.StringUtility;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Repository;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
    public List<RequestData> getRequestData(Integer ctorId) {
        Connector fromConnector = findById(ctorId)
                .orElseThrow(() -> new RuntimeException("Connector " + ctorId + " not found when getting RequestData")) ;
        return fromConnector.getRequestData();
    }


    @Override
    public List<Connector> findAll() {
        return connectorRepository.findAll();
    }

    @Override
    public List<Connector> findAllByTitleContains(String title) {
        return connectorRepository.findAllByTitleContains(title);
    }

    @Override
    public Connector toEntity(ConnectorResource resource) {
        Connector connector = new Connector();
        connector.setId(resource.getConnectorId());
        connector.setTitle(resource.getTitle());
        String icon = StringUtility.findImageFromUrl(resource.getIcon());
        connector.setIcon(icon);
        connector.setDescription(resource.getDescription());
        connector.setInvoker(resource.getInvoker().getName());
        connector.setSslCert(resource.isSslCert());
        connector.setTimeout(resource.getTimeout());

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
        final String path = uri.getScheme() + "://" + uri.getAuthority() + PathConstant.IMAGES;
        ConnectorResource connectorResource = new ConnectorResource();
        connectorResource.setConnectorId(entity.getId());
        connectorResource.setTitle(entity.getTitle());
        connectorResource.setDescription(entity.getDescription());
        connectorResource.setIcon(path + entity.getIcon());
        connectorResource.setSslCert(entity.isSslCert());
        connectorResource.setTimeout(entity.getTimeout());

        Invoker invoker = invokerServiceImp.findByName(entity.getInvoker());
        connectorResource.setInvoker(invokerServiceImp.toResource(invoker));
        connectorResource.setRequestData(requestDataService.toResource(entity.getRequestData()));
        return connectorResource;
    }

    @Override
    public ConnectorNodeResource toNodeResource(Connector entity, Long connectionId, String direction) {
         URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
         String imagePath = uri.getScheme() + "://" + uri.getAuthority() + PathConstant.IMAGES;
         ConnectorNodeResource connectorNodeResource = new ConnectorNodeResource();
         connectorNodeResource.setConnectorId(entity.getId());
         InvokerResource invokerResource = invokerServiceImp.toResource(invokerServiceImp.findByName(entity.getInvoker()));
         connectorNodeResource.setInvoker(invokerResource);
         connectorNodeResource.setTitle(entity.getTitle());
         connectorNodeResource.setIcon(imagePath + entity.getIcon());
         connectorNodeResource.setSslCert(entity.isSslCert());
         List<MethodResource> methodResources = methodNodeService
                .findMethodsByConnectionIdAndConnectorId(connectionId, direction, entity.getId()).stream()
                .map(m -> {
                    MethodNode methodNode = methodNodeService.findById(m.getId()).get();
                    return MethodNodeServiceImp.toResource(methodNode);
                }).collect(Collectors.toList());

         List<OperatorResource> operatorResources = operatorNodeService
                .findOperatorsByConnectionIdAndConnectorId(connectionId, direction, entity.getId()).stream()
                .map(OperatorNodeServiceImp::toResource).collect(Collectors.toList());
         connectorNodeResource.setMethods(methodResources);
         connectorNodeResource.setOperators(operatorResources);
         return connectorNodeResource;
    }

    public ConnectorNodeResource toMetaResource(Connector entity) {
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        String imagePath = uri.getScheme() + "://" + uri.getAuthority() + PathConstant.IMAGES;
        ConnectorNodeResource connectorNodeResource = new ConnectorNodeResource();
        connectorNodeResource.setConnectorId(entity.getId());
        InvokerResource invokerResource = invokerServiceImp.toMetaResource(invokerServiceImp.findByName(entity.getInvoker()));
        connectorNodeResource.setInvoker(invokerResource);
        connectorNodeResource.setTitle(entity.getTitle());
        connectorNodeResource.setIcon(imagePath + entity.getIcon());
        connectorNodeResource.setSslCert(entity.isSslCert());
        connectorNodeResource.setTimeout(entity.getTimeout());
        return connectorNodeResource;
    }

    @Override
    public ResponseEntity<?> checkCommunication(Connector connector) {
        InvokerRequestBuilder invokerRequestBuilder = new InvokerRequestBuilder(restTemplate);
        FunctionInvoker function = invokerServiceImp.getTestFunction(connector.getInvoker());
        List<RequestData> requestData = new ArrayList<>();
        FunctionInvoker authFunc = invokerServiceImp.getAuthFunction(connector.getInvoker());
        if (authFunc != null) {
            requestData = buildRequestData(connector);
        } else {
            requestData = connector.getRequestData();
        }
        return invokerRequestBuilder
                .setFunction(function)
                .setRequestData(requestData)
                .setSslCert(connector.isSslCert())
                .sendRequest();
    }

    @Override
    public ResponseEntity<?> getAuthorization(Connector connector) {
        InvokerRequestBuilder invokerRequestBuilder = new InvokerRequestBuilder(restTemplate);
        FunctionInvoker function = invokerServiceImp.getAuthFunction(connector.getInvoker());
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
        RequiredDataService requiredDataService = new RequiredDataServiceImp(requestData, invoker.getOperations());
        requestData.forEach(rqsd -> {
            String value = requiredDataService.getValue(rqsd).orElse(null);
            rqsd.setValue(value);
        });
        return requestData;
    }

    private void addFieldIfNotExists(List<RequestData> requestData, RequiredData rqd) {
        if (requestData.stream().noneMatch(rqsd -> rqsd.getField().equals(rqd.getName()))) {
            requestData.add(new RequestData(rqd));
        }
    }
}
