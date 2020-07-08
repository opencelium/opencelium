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
import com.becon.opencelium.backend.resource.notification.NotificationResource;
import com.becon.opencelium.backend.resource.request.SchedulerRequestResource;
import com.becon.opencelium.backend.resource.schedule.RunningJobsResource;
import com.becon.opencelium.backend.resource.schedule.SchedulerResource;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.Resource;
import org.springframework.hateoas.Resources;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/scheduler", produces = "application/hal+json", consumes = {"application/json"})
public class SchedulerController {

    @Autowired
    private SchedulerServiceImp schedulerService;

    @GetMapping("/all")
    public ResponseEntity<?> getAll() throws Exception {
        List<Scheduler> schedulers = schedulerService.findAll();
        List<SchedulerResource> scheduleList = schedulers.stream()
                .map(s -> schedulerService.toResource(s)).collect(Collectors.toList());
        final Resources<SchedulerResource> resources = new Resources<>(scheduleList);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable int id) throws Exception {
        Scheduler scheduler = schedulerService.findById(id).orElseThrow(() -> new RuntimeException("SCHEDULER_NOT_FOUND"));
        SchedulerResource schedulerResource = schedulerService.toResource(scheduler);
        final Resource<SchedulerResource> resource = new Resource<>(schedulerResource);
        return ResponseEntity.ok(resource);
    }

    @PostMapping
    public ResponseEntity<?> scheduleJob(@RequestBody SchedulerRequestResource resource) throws Exception{
        Scheduler scheduler = schedulerService.toEntity(resource);
        schedulerService.save(scheduler);

        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .path("/{id}")
                .buildAndExpand(scheduler.getId()).toUri();
        return ResponseEntity.created(uri).body(schedulerService.toResource(scheduler));
    }

    @PutMapping("/{id}")
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

    @PutMapping("/{id}/title")
    public ResponseEntity<?> changeTitle(@PathVariable("id") int id,
                                         @RequestBody SchedulerRequestResource schedulerRequestResource) throws Exception{
        schedulerRequestResource.setSchedulerId(id);
        Scheduler scheduler = schedulerService.findById(id)
                .orElseThrow(() -> new RuntimeException("SCHEDULER_NOT_FOUND"));

        scheduler.setTitle(schedulerRequestResource.getTitle());
        schedulerService.saveEntity(scheduler);

        SchedulerResource schedulerResource = schedulerService.toResource(scheduler);
        final Resource<SchedulerResource> resource = new Resource<>(schedulerResource);
        return ResponseEntity.ok(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSchedule(@PathVariable int id){
        schedulerService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/startAll")
    public ResponseEntity<?> startAll(@RequestBody Map<String, Object> response) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        ArrayList<Integer> schedulerIds = (ArrayList<Integer>) response.get("schedulerIds");
        List<Scheduler> schedulers = schedulerService.findAllById(schedulerIds);

        schedulers.parallelStream().forEach(scheduler -> {
            try{
                schedulerService.startNow(scheduler);
            } catch (Exception e){
                throw new RuntimeException(e);
            }
        });
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{schedulerId}/status")
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

    @PutMapping("/enableAll")
    public ResponseEntity<?> enableAll(@RequestBody  Map<String, Object> response) throws Exception {
        ArrayList<Integer> schedulerIds = (ArrayList<Integer>) response.get("schedulerIds");
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

    @PutMapping("/disableAll")
    public ResponseEntity<?> disableAll(@RequestBody Map<String, Object> response) throws Exception {
        ArrayList<Integer> schedulerIds = (ArrayList<Integer>) response.get("schedulerIds");
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

    @DeleteMapping("/all")
    public ResponseEntity<?> deleteAll(@RequestBody Map<String, Object> response) throws Exception {
        ArrayList<Integer> schedulerIds = (ArrayList<Integer>) response.get("schedulerIds");
        schedulerService.deleteAllById(schedulerIds);
        return ResponseEntity.noContent().build();
    }

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

    @GetMapping("/running/all")
    public ResponseEntity<?> getRunningAll(){
        List<RunningJobsResource> runningJobResources;
        try{
            runningJobResources = schedulerService.getAllRunningJobs();
        } catch (Exception e){
            throw new RuntimeException(e);
        }

        if (runningJobResources == null){
            return ResponseEntity.noContent().build();
        }
        final Resources<RunningJobsResource> resources = new Resources<>(runningJobResources);
        return ResponseEntity.ok(resources);
    }

    @PostMapping("/ids")
    public ResponseEntity<?> getSchedulersByIds(@RequestBody Map<String, Object> response){
        ArrayList<Integer> schedulerIds = (ArrayList<Integer>) response.get("schedulerIds");
        List<Scheduler> schedulers = schedulerService.findAllById(schedulerIds);
        List<SchedulerResource> scheduleList = schedulers.stream()
                .map(sch -> schedulerService.toResource(sch)).collect(Collectors.toList());
        final Resources<SchedulerResource> resources = new Resources<>(scheduleList);
        return ResponseEntity.ok(resources);
    }


    @GetMapping("/{schedulerId}/notification/all")
    public ResponseEntity<?> getAllNotifications(@PathVariable int schedulerId) throws Exception {
        List<NotificationResource> notificationResource = schedulerService.getAllNotifications(schedulerId)
                .stream().map(e -> schedulerService.toNotificationResource(e)).collect(Collectors.toList());
        final Resources<NotificationResource> resources = new Resources<>(notificationResource);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/{schedulerId}/notification/{notificationId}")
    public ResponseEntity<?> getNotification(@PathVariable int schedulerId,
                                             @PathVariable int notificationId) throws Exception{
        EventNotification en = schedulerService.getNotification(notificationId)
                .orElseThrow(()->new RuntimeException("Notification not found"));
        NotificationResource notificationResource = schedulerService.toNotificationResource(en);

        final Resource<NotificationResource> resource = new Resource<>(notificationResource);
        return ResponseEntity.ok(resource);
    }

    @PostMapping("/{schedulerId}/notification")
    public ResponseEntity<?> createNotification(@PathVariable int schedulerId,
                                                @RequestBody NotificationResource notificationResource) throws Exception{

        notificationResource.setSchedulerId(schedulerId);
        EventNotification eventNotification = schedulerService.toNotificationEntity(notificationResource);
        schedulerService.saveNotification(eventNotification);
        return ResponseEntity.ok(schedulerService.toNotificationResource(eventNotification));
    }

    @DeleteMapping("/{schedulerId}/notification/{notificationId}")
    public ResponseEntity<?> deleteNotification(@PathVariable int schedulerId,@PathVariable int notificationId){
        schedulerService.deleteNotificationById(notificationId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{schedulerId}/notification/{notificationId}")
    public ResponseEntity<?> updateNotification(@PathVariable int schedulerId,@PathVariable int notificationId,
                                                @RequestBody NotificationResource notificationResource) throws Exception{
        notificationResource.setNotificationId(notificationId);
        EventNotification eventNotification = schedulerService.toNotificationEntity(notificationResource);
        schedulerService.saveNotification(eventNotification);
        return ResponseEntity.ok(schedulerService.toNotificationResource(eventNotification));
    }

}
