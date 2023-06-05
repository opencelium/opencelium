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

import com.becon.opencelium.backend.mysql.entity.EventNotification;
import com.becon.opencelium.backend.mysql.entity.Scheduler;
import com.becon.opencelium.backend.mysql.service.SchedulerServiceImp;
import com.becon.opencelium.backend.mysql.service.WebhookServiceImp;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.notification.NotificationResource;
import com.becon.opencelium.backend.resource.request.SchedulerRequestResource;
import com.becon.opencelium.backend.resource.schedule.RunningJobsResource;
import com.becon.opencelium.backend.resource.schedule.SchedulerResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@Tag(name = "Scheduler", description = "Manages operations related to Scheduler management")
@RequestMapping(value = "/api/scheduler", produces = MediaType.APPLICATION_JSON_VALUE)
public class SchedulerController {

    @Autowired
    private SchedulerServiceImp schedulerService;

    @Autowired
    private WebhookServiceImp webhookServiceImp;

    @Operation(summary = "Retrieves a list of schedulers from database")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Success",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = SchedulerResource.class)))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all")
    public ResponseEntity<List<SchedulerResource>> getAll() throws Exception {
        List<Scheduler> schedulers = schedulerService.findAll();
        List<SchedulerResource> scheduleList = schedulers.stream()
            .map(s -> schedulerService.toResource(s)).collect(Collectors.toList());
        return ResponseEntity.ok(scheduleList);
    }

    @Operation(summary = "Retrieves a scheduler from database by provided id")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Success",
                content = @Content(schema = @Schema(implementation = SchedulerResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable int id) throws Exception {
        Scheduler scheduler = schedulerService.findById(id).orElseThrow(() -> new RuntimeException("SCHEDULER_NOT_FOUND"));
//        scheduler.setWebhook(webhookServiceImp.findBySchedulerId(scheduler.getId()).orElse(null));
        SchedulerResource schedulerResource = schedulerService.toResource(scheduler);
        final EntityModel<SchedulerResource> resource = EntityModel.of(schedulerResource);
        return ResponseEntity.ok(resource);
    }

    @Operation(summary = "Creates a new scheduler in the system by accepting scheduler data in the request body")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "201",
                description = "Scheduler is successfully created. The 'id' property will include newly created scheduler's 'id'",
                content = @Content(schema = @Schema(implementation = SchedulerResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> scheduleJob(@RequestBody SchedulerRequestResource resource) throws Exception{
        Scheduler scheduler = schedulerService.toEntity(resource);
        schedulerService.save(scheduler);
        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .path("/{id}")
                .buildAndExpand(scheduler.getId()).toUri();
        return ResponseEntity.created(uri).body(schedulerService.toResource(scheduler));
    }

    @Operation(summary = "Changes or Reschedules Scheduler")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "201",
                description = "Scheduler is successfully modified.",
                content = @Content(schema = @Schema(implementation = SchedulerResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> reschedule(@PathVariable("id") int id,
                                        @RequestBody SchedulerRequestResource resource) throws Exception{
        if (id != resource.getSchedulerId()){
            throw new RuntimeException("SCHEDULE_NOT_FOUND");
        }
        resource.setSchedulerId(id);
        Scheduler scheduler = schedulerService.toEntity(resource);
        Scheduler entity = schedulerService.findById(id).orElseThrow(() -> new RuntimeException("SCHEDULER_NOT_FOUND"));

        boolean titleExists = !entity.getTitle().equals(scheduler.getTitle()) && schedulerService.existsByTitle(scheduler.getTitle());
        if (titleExists){
            throw new RuntimeException("TITLE_ALREADY_EXISTS");
        }

        schedulerService.save(scheduler);
        SchedulerResource schedulerResource = schedulerService.toResource(scheduler);
        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .path("/{id}")
                .buildAndExpand(scheduler.getId()).toUri();
        return ResponseEntity.created(uri).body(schedulerResource);
    }

    @Operation(summary = "Changes only title of scheduler by provided scheduler id")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "201",
                description = "Scheduler title is successfully modified.",
                content = @Content(schema = @Schema(implementation = SchedulerResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(value = "/{id}/title", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> changeTitle(@PathVariable("id") int id,
                                         @RequestBody SchedulerRequestResource schedulerRequestResource) throws Exception{
        schedulerRequestResource.setSchedulerId(id);
        Scheduler scheduler = schedulerService.findById(id)
                .orElseThrow(() -> new RuntimeException("SCHEDULER_NOT_FOUND"));

        scheduler.setTitle(schedulerRequestResource.getTitle());
        schedulerService.saveEntity(scheduler);

        SchedulerResource schedulerResource = schedulerService.toResource(scheduler);
        final EntityModel<SchedulerResource> resource = EntityModel.of(schedulerResource);
        return ResponseEntity.ok(resource);
    }

    @Operation(summary = "Delete a scheduler by provided id")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "204",
                description = "Scheduler is successfully deleted.",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSchedule(@PathVariable int id){
        schedulerService.deleteById(id);
        return ResponseEntity.noContent().build();
    }


    @Operation(summary = "Runs all schedulers provided in request body")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Schedulers have been successfully started",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(value = "/startAll", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> startAll(@RequestBody IdentifiersDTO<Integer> ids) throws Exception {
        List<Scheduler> schedulers = schedulerService.findAllById(ids.getIdentifiers());
        schedulers.parallelStream().forEach(scheduler -> {
            try {
                schedulerService.startNow(scheduler);
            } catch (Exception e){
                throw new RuntimeException(e);
            }
        });
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Changes status(ON/OFF) of a scheduler by provided scheduler id")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Scheduler status has been successfully changed",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(value = "/{schedulerId}/status", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> changeStatus(@PathVariable int schedulerId,
                                          @RequestBody Scheduler scheduler) throws Exception{

        boolean activate = scheduler.getStatus();
        scheduler = schedulerService.findById(schedulerId).orElse(null);
        if (scheduler == null){
            throw new RuntimeException("SCHEDULER_NOT_FOUND");
        }

        scheduler.setStatus(activate);
        schedulerService.saveEntity(scheduler);

        if (activate){
            schedulerService.enable(scheduler);
        }
        else {
            schedulerService.disable(scheduler);
        }
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Sets the status of the provided schedulers to (ON) in the list of schedulers.")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Schedulers have been successfully enabled",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(value = "/enableAll", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> enableAll(@RequestBody  IdentifiersDTO<Integer> payload) throws Exception {
        ArrayList<Integer> schedulerIds = payload.getIdentifiers();
        List<Scheduler> schedulers = schedulerService.findAllById(schedulerIds);

        schedulers.forEach(scheduler -> {
            if (scheduler.getStatus()){
                return;
            }
            try{
                if (scheduler.getStatus() == true){
                    throw new RuntimeException("ALREADY_ENABLED");
                }
                schedulerService.enable(scheduler);
                scheduler.setStatus(true         );
            } catch(Exception e){
                throw new RuntimeException(e);
            }
            scheduler.setStatus(true);
        });

        schedulerService.saveAll(schedulers);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Sets the status of the provided schedulers to (OFF) in the list of schedulers.")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Schedulers have been successfully disabled",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping("/disableAll")
    public ResponseEntity<?> disableAll(@RequestBody IdentifiersDTO<Integer> payload) throws Exception {
        ArrayList<Integer> schedulerIds = payload.getIdentifiers();
        List<Scheduler> schedulers = schedulerService.findAllById(schedulerIds);

        schedulers.forEach(scheduler -> {
            if(!scheduler.getStatus()){
                return;
            }
            scheduler.setStatus(false);
            try{
                schedulerService.disable(scheduler);
            } catch (Exception e){
                throw new RuntimeException(e);
            }
        });
        schedulerService.saveAll(schedulers);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Deletes a collection of schedulers based on the provided list of their corresponding IDs.")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "204",
                description = "Schedulers have been successfully deleted",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(path = "/list/delete", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteSchedulerByIdIn(@RequestBody IdentifiersDTO<Integer> payload) throws Exception {
        schedulerService.deleteAllById(payload.getIdentifiers());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Executes a scheduler by provided scheduler ID")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Scheduler has been started",
                content = @Content),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/execute/{schedulerId}")
    public ResponseEntity<?> execute(@PathVariable int schedulerId){
        try {
            Scheduler scheduler = schedulerService.findById(schedulerId).orElse(null);
            if (scheduler == null){
                throw new RuntimeException("SCHEDULER_NOT_FOUND");
            }
            schedulerService.startNow(scheduler);
        } catch (Exception e){
            throw new RuntimeException(e);
        }

        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Retrieves list of running schedulers")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Scheduler has been started",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = RunningJobsResource.class)))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/running/all")
    public ResponseEntity<List<RunningJobsResource>> getRunningAll(){
        List<RunningJobsResource> runningJobResources;
        try{
            runningJobResources = schedulerService.getAllRunningJobs();
        } catch (Exception e){
            throw new RuntimeException(e);
        }

        if (runningJobResources == null){
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(runningJobResources);
    }

    @Operation(summary = "Retrieves a collection of schedulers based on the provided list of their corresponding IDs.")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Schedulers have been retrieved successfully",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = SchedulerResource.class)))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(value = "/list/get", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<SchedulerResource>> getSchedulersByIds(@RequestBody IdentifiersDTO<Integer> payload){
        ArrayList<Integer> schedulerIds = payload.getIdentifiers();
        List<Scheduler> schedulers = schedulerService.findAllById(schedulerIds);
        List<SchedulerResource> scheduleList = schedulers.stream()
                .map(sch -> schedulerService.toResource(sch)).collect(Collectors.toList());
        return ResponseEntity.ok(scheduleList);
    }


    @Operation(summary = "Retrieves all notifications associated with a scheduler by provided scheduler ID.")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Notifications have been retrieved successfully",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = NotificationResource.class)))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{schedulerId}/notification/all")
    public ResponseEntity<List<NotificationResource>> getAllNotifications(@PathVariable int schedulerId) throws Exception {
        List<NotificationResource> notificationResource = schedulerService.getAllNotifications(schedulerId)
                .stream().map(e -> schedulerService.toNotificationResource(e)).collect(Collectors.toList());
        return ResponseEntity.ok(notificationResource);
    }

    @Operation(summary = "Retrieves a notification associated with a scheduler by provided scheduler ID and notification ID.")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Notification has been retrieved successfully",
                content = @Content(schema = @Schema(implementation = NotificationResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/notification/{notificationId}")
    public ResponseEntity<?> getNotification(@PathVariable int notificationId) throws Exception{
        EventNotification en = schedulerService.getNotification(notificationId)
                .orElseThrow(()->new RuntimeException("Notification not found"));
        NotificationResource notificationResource = schedulerService.toNotificationResource(en);

        final EntityModel<NotificationResource> resource = EntityModel.of(notificationResource);
        return ResponseEntity.ok(resource);
    }

    @Operation(summary = "Creates a notification for a scheduler by provided scheduler ID.")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Notification has been created successfully for scheduler",
                content = @Content(schema = @Schema(implementation = NotificationResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(value = "/{schedulerId}/notification", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createNotification(@PathVariable int schedulerId,
                                                @RequestBody NotificationResource notificationResource) throws Exception{

        notificationResource.setSchedulerId(schedulerId);
        EventNotification eventNotification = schedulerService.toNotificationEntity(notificationResource);
        schedulerService.saveNotification(eventNotification);
        return ResponseEntity.ok(schedulerService.toNotificationResource(eventNotification));
    }

    @Operation(summary = "Deletes a notification for a scheduler by provided scheduler ID and notification ID.")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "204",
                    description = "Notification has been deleted successfully from scheduler",
                    content = @Content),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping(value = "/notification/{notificationId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteNotification(@PathVariable int notificationId){
        schedulerService.deleteNotificationById(notificationId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Deletes a list of notifications associated with a scheduler by provided scheduler ID " +
            "and a list of notification IDs.")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "204",
                    description = "Notifications have been deleted successfully from scheduler",
                    content = @Content),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(value = "/notification", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteNotification(@RequestBody IdentifiersDTO<Integer> payload){
        payload.getIdentifiers().forEach(nId -> schedulerService.deleteNotificationById(nId));
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Modifies a notification associated with a scheduler by provided scheduler ID and notification ID.")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "204",
                    description = "Notification has been created successfully for scheduler",
                    content = @Content(schema = @Schema(implementation = NotificationResource.class))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(value = "/notification/{notificationId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateNotification(@PathVariable int notificationId,
                                                @RequestBody NotificationResource notificationResource) throws Exception{
        notificationResource.setNotificationId(notificationId);
        EventNotification eventNotification = schedulerService.toNotificationEntity(notificationResource);
        schedulerService.saveNotification(eventNotification);
        return ResponseEntity.ok(schedulerService.toNotificationResource(eventNotification));
    }

}
