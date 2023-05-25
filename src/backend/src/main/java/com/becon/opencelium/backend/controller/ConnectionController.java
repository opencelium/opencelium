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

package com.becon.opencelium.backend.controller;
import com.becon.opencelium.backend.neo4j.entity.FieldNode;
import com.becon.opencelium.backend.neo4j.entity.MethodNode;
import com.becon.opencelium.backend.neo4j.repository.FieldNodeRepository;
import com.becon.opencelium.backend.neo4j.service.*;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.schedule.SchedulerResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
import org.apache.hc.core5.ssl.TrustStrategy;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.cert.X509Certificate;

import com.becon.opencelium.backend.mysql.entity.Connection;
import com.becon.opencelium.backend.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.mysql.service.EnhancementServiceImp;
import com.becon.opencelium.backend.neo4j.entity.ConnectionNode;
import com.becon.opencelium.backend.neo4j.entity.EnhancementNode;
import com.becon.opencelium.backend.resource.ApiDataResource;
import com.becon.opencelium.backend.resource.connection.ConnectionResource;
import com.becon.opencelium.backend.resource.error.validation.ErrorMessageDataResource;
import com.becon.opencelium.backend.resource.error.validation.ValidationResource;
import com.becon.opencelium.backend.validation.connection.ValidationContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@Tag(name = "Connection", description = "Manages operations related to Connection management")
@RequestMapping(value = "/api/connection", produces = "application/hal+json", consumes = "application/json")
public class ConnectionController {

    @Autowired
    private ConnectionServiceImp connectionService;

    @Autowired
    private ConnectionNodeServiceImp connectionNodeService;

    @Autowired
    private EnhancementServiceImp enhancementService;

    @Autowired
    private EnhancementNodeServiceImp enhancementNodeService;

    @Autowired
    private LinkRelationServiceImp linkRelationService;

    @Autowired
    private ValidationContext validationContext;

    @Autowired
    private MethodNodeServiceImp methodNodeServiceImp;

    @Autowired
    private RestTemplate restTemplate;

    @Operation(summary = "Retrieves all connections from database")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Connections have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectionResource.class)))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all")
    public ResponseEntity<?> getAll(){
        List<Connection> connections = connectionService.findAll();
        List<ConnectionResource> connectionResources = connections.stream()
                .map(c -> connectionService.toNodeResource(c)).collect(Collectors.toList());
        return ResponseEntity.ok().body(connectionResources);
    }

    @Operation(summary = "Retrieves all Metadata of connections from database")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Metadata of connections have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectionResource.class)))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all/meta")
    public ResponseEntity<?> getAllMeta(){
        List<Connection> connections = connectionService.findAll();
        List<ConnectionResource> connectionResources = connections.stream()
                .map(c -> connectionService.toResource(c)).collect(Collectors.toList());
        return ResponseEntity.ok().body(connectionResources);
    }

    @Operation(summary = "Retrieves a connection from database by provided connection ID")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Connection has been successfully retrieved",
                    content = @Content(schema = @Schema(implementation = ConnectionResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{connectionId}")
    public ResponseEntity<?> get(@PathVariable Long connectionId) {
        Connection connection = connectionService.findById(connectionId).orElse(null);
        ConnectionResource connectionResource = connectionService.toNodeResource(connection);
        final EntityModel<ConnectionResource> resource = EntityModel.of(connectionResource);
        return ResponseEntity.ok().body(resource);
    }

    @Operation(summary = "Creates a connection from database by accepting connection data in request body.")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Connection has been successfully created",
                content = @Content(schema = @Schema(implementation = ConnectionResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping
    public ResponseEntity<?> add(@RequestBody ConnectionResource connectionResource) throws Exception{
        Connection connection = connectionService.toEntity(connectionResource);
        if (connectionService.existsByName(connection.getName())){
            throw new RuntimeException("CONNECTION_NAME_ALREADY_EXISTS");
        }
        Long connectionId = 0L;
        try {
            connectionService.save(connection);
            connectionId = connection.getId();

            connectionResource.setConnectionId(connection.getId());
            ConnectionNode connectionNode = connectionNodeService.toEntity(connectionResource);
            connectionNodeService.save(connectionNode);

            if (connectionResource.getFieldBinding() != null){
                if (connectionResource.getFieldBinding().isEmpty()){
                    final EntityModel<ConnectionResource> resource = EntityModel.of(connectionService.toNodeResource(connection));
                    return ResponseEntity.ok().body(resource);
                }

                List<EnhancementNode> enhancementNodes =  connectionNodeService
                        .buildEnhancementNodes(connectionResource.getFieldBinding(), connection);
                enhancementNodeService.saveAll(enhancementNodes);

                // Uncomment if fields are linked DIRECTLY, without enhancement;
//                List<Linked> linkRelations = linkRelationService
//                        .toEntity(connectionResource.getFieldBinding(), connection);
//                if (linkRelations != null && !linkRelations.isEmpty()){
//                    linkRelationService.saveAll(linkRelations);
//                }
            }

            final EntityModel<ConnectionResource> resource = EntityModel.of(connectionService.toNodeResource(connection));
            validationContext.remove(connection.getName());
            return ResponseEntity.ok().body(resource);
        } catch (Exception e) {
            e.printStackTrace();
//            enhancementService.deleteAllByConnectionId(connectionId);
            connectionService.deleteById(connectionId);
            connectionNodeService.deleteById(connectionId);

            ErrorMessageDataResource errorMessageDataResource =
                    new ErrorMessageDataResource(validationContext.get(connection.getName()));
            ValidationResource validationResource =
                    new ValidationResource(e, HttpStatus.BAD_REQUEST, "/connection", errorMessageDataResource);
            validationContext.remove(connection.getName());

            return ResponseEntity.badRequest().body(validationResource);
        }
    }

    @Operation(summary = "Validates a connection for correctly constructed structure")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Connection has been successfully validated"),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping("/validate")
    public ResponseEntity<?> validate(@RequestBody ConnectionResource connectionResource) throws Exception{
        Connection connection = connectionService.toEntity(connectionResource);
        if (connectionService.existsByName(connection.getName())){
            throw new RuntimeException("CONNECTION_NAME_ALREADY_EXISTS");
        }
        Long connectionId = 0L;
        try {
            connectionNodeService.toEntity(connectionResource);
            return ResponseEntity.ok().build();
        } catch (Exception e){
            ErrorMessageDataResource errorMessageDataResource =
                    new ErrorMessageDataResource(validationContext.get(connection.getName()));
            ValidationResource validationResource =
                    new ValidationResource(e, HttpStatus.BAD_REQUEST, "/connection", errorMessageDataResource);
            validationContext.remove(connection.getName());

            return ResponseEntity.badRequest().body(validationResource);
        }
    }

    @Operation(summary = "Modifies a connection by provided connection ID and accepting connection data in request body.")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Connection has been successfully modified",
                    content = @Content(schema = @Schema(implementation = ConnectionResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping("/{connectionId}")
    public ResponseEntity<?> update(@PathVariable Long connectionId,
                                    @RequestBody ConnectionResource connectionResource) throws Exception{
        connectionResource.setConnectionId(connectionId);
        Connection connection = connectionService.toEntity(connectionResource);
        Connection connectionClone = connectionService.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("CONNECTION_NOT_FOUND"));
        ConnectionResource connectionRClone =  connectionService.toNodeResource(connectionClone);

        List<EnhancementNode> enhancementNodeClone = enhancementNodeService.findAllByConnectionId(connectionId);
        try {
//            List<Enhancement> enhancements = enhancementService.findAllByConnectionId(connectionId);
            enhancementService.deleteAllByConnectionId(connectionId);
            connectionService.save(connection);

            ConnectionNode connectionNode = connectionNodeService.toEntity(connectionResource);
            connectionNodeService.deleteById(connectionId);
            connectionNodeService.save(connectionNode);

            if (connectionResource.getFieldBinding() != null || !connectionResource.getFieldBinding().isEmpty()){
                List<EnhancementNode> enhancementNodes = connectionNodeService
                        .buildEnhancementNodes(connectionResource.getFieldBinding(), connection);
                enhancementNodeService.saveAll(enhancementNodes);
            }
            final EntityModel<ConnectionResource> resource = EntityModel.of(connectionService.toNodeResource(connection));
            return ResponseEntity.ok().body(resource);
        } catch (Exception e){
            e.printStackTrace();
            enhancementService.deleteAllByConnectionId(connectionId);
            connectionNodeService.deleteById(connectionId);

            connectionService.save(connectionClone);
            ConnectionNode connNClone = connectionNodeService.toEntity(connectionRClone);
            connectionNodeService.save(connNClone);
            enhancementNodeClone = connectionNodeService.buildEnhancementNodes(connectionRClone.getFieldBinding(), connectionClone);
            enhancementNodeService.saveAll(enhancementNodeClone);
            ErrorMessageDataResource errorMessageDataResource =
                    new ErrorMessageDataResource(validationContext.get(connection.getName()));
            ValidationResource validationResource =
                    new ValidationResource(e, HttpStatus.BAD_REQUEST, "/connection", errorMessageDataResource);
            validationContext.remove(connection.getName());

            return ResponseEntity.badRequest().body(validationResource);
        }
    }

    @Operation(summary = "Deletes a connection by provided connection ID")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "204",
                    description = "Connection has been successfully deleted."),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("{id}")
    public ResponseEntity<?> delete(@PathVariable("id") Long id){
        connectionService.deleteById(id);
        connectionNodeService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Validates name of connection for uniqueness")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Connection Name has been successfully validate. Return EXISTS or NOT_EXISTS values in 'message' property.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/check/{name}")
    public ResponseEntity<?> existsByName(@PathVariable("name") String name) throws IOException {
        RuntimeException ex;
        if (connectionService.existsByName(name)){
            ex = new RuntimeException("EXISTS");
        } else {
            ex = new RuntimeException("NOT_EXISTS");
        }

        String uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri().toString();
        ErrorResource errorResource = new ErrorResource(ex, HttpStatus.OK, uri);
        return ResponseEntity.ok().body(errorResource);
    }


    public static RestTemplate getRestTemplate() throws Exception{
        TrustManager[] acceptingTrustStrategy = new TrustManager[] {
                new X509TrustManager() {
                    public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                        return new X509Certificate[0];
                    }
                    public void checkClientTrusted(
                            java.security.cert.X509Certificate[] certs, String authType) {
                    }
                    public void checkServerTrusted(
                            java.security.cert.X509Certificate[] certs, String authType) {
                    }
                }
        };

        SSLContext sslContext = SSLContext.getInstance("SSL");
        sslContext.init(null, acceptingTrustStrategy, new java.security.SecureRandom());
        SSLConnectionSocketFactory ssl = new SSLConnectionSocketFactory(sslContext);
        PoolingHttpClientConnectionManager connectionManager = PoolingHttpClientConnectionManagerBuilder.create()
                .setSSLSocketFactory(ssl).build();
        CloseableHttpClient httpClient = HttpClients.custom().setConnectionManager(connectionManager).build();
        HttpComponentsClientHttpRequestFactory requestFactory =
                new HttpComponentsClientHttpRequestFactory();
        requestFactory.setHttpClient(httpClient);
        return new RestTemplate(requestFactory);
    }


    @Operation(summary = "Sends request to remote api by accepting api data in request body.")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "Returns json string. Structure of json could be different depending on api.",
                    content = @Content(schema = @Schema(implementation = String.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping("/remoteapi")
    public ResponseEntity<?> sendRequestToApi(@RequestBody ApiDataResource apiDataResource) throws Exception {

        String url = apiDataResource.getUrl();
        HttpMethod method = getMethod(apiDataResource.getMethod());
        String body = new ObjectMapper().writeValueAsString(apiDataResource.getBody());
        HttpHeaders header = buildHeader(apiDataResource.getHeader());
        HttpEntity<Object> httpEntity = new HttpEntity <Object> (body, header);
        if (body.equals("null")){
            httpEntity = new HttpEntity <Object> (header);
        }

        RestTemplate restTemplate = getRestTemplate();
        if (!apiDataResource.isSslOn()){
            ClientHttpRequestFactory requestFactory =
                    new HttpComponentsClientHttpRequestFactory(getDisabledHttpsClient());
            restTemplate.setRequestFactory(requestFactory);
        }
        ResponseEntity<String> response = restTemplate.exchange(url, method ,httpEntity, String.class);
        return ResponseEntity.ok().body(response);
    }

    @Operation(summary = "Deletes a collection of connections based on the provided list of their corresponding IDs")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "204",
                    description = "Collection on connection have been deleted from database",
                    content = @Content(schema = @Schema(implementation = String.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping
    public ResponseEntity<?> deleteCtionByIdIn(@RequestBody List<Long> ids) throws Exception {

        ids.forEach(id -> {
            connectionService.deleteById(id);
            connectionNodeService.deleteById(id);
        });
        return ResponseEntity.noContent().build();
    }

    private HttpMethod getMethod(String method){
        HttpMethod httpMethodType;
        switch (method){
            case "POST":
                httpMethodType = HttpMethod.POST;
                break;
            case "DELETE":
                httpMethodType = HttpMethod.DELETE;
                break;
            case "PUT":
                httpMethodType = HttpMethod.PUT;
                break;
            case "GET":
                httpMethodType = HttpMethod.GET;
                break;
            default:
                throw new RuntimeException("Http method not found");
        }
        return httpMethodType;
    }

    public HttpHeaders buildHeader(Map<String, String> header){
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setAll(header);
        return httpHeaders;
    }

    private CloseableHttpClient getDisabledHttpsClient() {

        try {
            TrustManager[] trustAllCerts = new TrustManager[] {
                    new X509TrustManager() {
                        public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                            return new X509Certificate[0];
                        }
                        public void checkClientTrusted(
                                java.security.cert.X509Certificate[] certs, String authType) {
                        }
                        public void checkServerTrusted(
                                java.security.cert.X509Certificate[] certs, String authType) {
                        }
                    }
            };
            SSLContext sslContext = SSLContext.getInstance("SSL");
            sslContext.init(null, trustAllCerts, new java.security.SecureRandom());
            SSLConnectionSocketFactory ssl = new SSLConnectionSocketFactory(sslContext);
            PoolingHttpClientConnectionManager connectionManager = PoolingHttpClientConnectionManagerBuilder.create()
                    .setSSLSocketFactory(ssl).build();

            return HttpClients.custom().setConnectionManager(connectionManager).build();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
