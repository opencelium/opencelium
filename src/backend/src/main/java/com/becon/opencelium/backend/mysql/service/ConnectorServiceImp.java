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

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.mysql.repository.ConnectorRepository;
import com.becon.opencelium.backend.invoker.InvokerRequestBuilder;
import com.becon.opencelium.backend.resource.connection.ConnectorNodeResource;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.resource.connector.InvokerResource;
import com.becon.opencelium.backend.utility.StringUtility;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Repository;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.*;
import java.util.stream.Collectors;

@Repository
public class ConnectorServiceImp implements ConnectorService{

    @Autowired
    private ConnectorRepository connectorRepository;

    @Autowired
    private RequestDataServiceImp requestDataService;

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
        return connectorRepository.findAllByInvoker(invokerName);
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

        List<RequiredData> requiredData = invokerService.findByName(resource.getInvoker().getName()).getRequiredData();

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

        Invoker invoker = invokerService.findByName(entity.getInvoker());
        connectorResource.setInvoker(invokerService.toResource(invoker));
        connectorResource.setRequestData(requestDataService.toResource(entity.getRequestData()));
        return connectorResource;
    }

    public ConnectorNodeResource toMetaResource(Connector entity) {
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        String imagePath = uri.getScheme() + "://" + uri.getAuthority() + PathConstant.IMAGES;
        ConnectorNodeResource connectorNodeResource = new ConnectorNodeResource();
        connectorNodeResource.setConnectorId(entity.getId());
        InvokerResource invokerResource = invokerService.toMetaResource(invokerService.findByName(entity.getInvoker()));
        connectorNodeResource.setInvoker(invokerResource);
        connectorNodeResource.setTitle(entity.getTitle());
        connectorNodeResource.setIcon(imagePath + entity.getIcon());
        connectorNodeResource.setSslCert(entity.isSslCert());
        connectorNodeResource.setTimeout(entity.getTimeout());
        return connectorNodeResource;
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
}
