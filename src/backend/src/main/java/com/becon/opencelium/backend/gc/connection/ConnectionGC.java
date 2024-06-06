package com.becon.opencelium.backend.gc.connection;

import com.becon.opencelium.backend.database.mysql.service.ConnectionHistoryService;
import com.becon.opencelium.backend.gc.base.Criteria;
import com.becon.opencelium.backend.gc.base.GarbageCollector;
import com.becon.opencelium.backend.gc.connection.service.ConnectionGCService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.concurrent.CustomizableThreadFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class ConnectionGC implements GarbageCollector<ConnectionForGC> {
    private static final Logger log = LoggerFactory.getLogger("GC");
    private Criteria<ConnectionForGC> criteria;
    private final AtomicBoolean ready = new AtomicBoolean(false); // indicates gc is ready or not
    private final ConnectionPool pool;
    private final ConnectionGCService connectionGCService;
    private final ScheduledThreadPoolExecutor taskScheduler;

    //all delays are in milliseconds
    private static final long RUNNING_DELAY_FOR_NEW_POOL = 60 * 1000; // delay for newGC
    private static final long RUNNING_DELAY_FOR_YOUNG_POOL = 60 * 1000; // delay for youngGC
    private static final long RUNNING_DELAY_FOR_OLD_POOL = 2 * 60 * 1000; // delay for oldGC
    private static final long WAITING_FOR_READY_TIMEOUT = 60 * 1000; // timeout for waiting gc to be ready
    private static final long DEFAULT_THREAD_POOL_RUNNING_DELAY = 60 * 1000; // delay for other tasks

    public ConnectionGC(
            ConnectionGCService connectionGCService,
            @Qualifier("connectionHistoryServiceImp") ConnectionHistoryService connectionHistoryService
    ) {
        this.connectionGCService = connectionGCService;
        pool = new ConnectionPool(connectionHistoryService, log);

        taskScheduler = new ScheduledThreadPoolExecutor(5);
        taskScheduler.setThreadFactory(new CustomizableThreadFactory("GarbageCollector[Connection]-"));
    }

    @Override
    public void start(Criteria<ConnectionForGC> criteria) {
        this.criteria = criteria;

        List<ConnectionForGC> allConnections = connectionGCService.getAllConnections();
        List<ConnectionForGC> forGC = allConnections.stream()
                .filter((c) -> !criteria.test(c)).toList();

        pool.initialize(forGC.stream().map(c -> c.getConnection().getId()).toList());

        startInnerTasks();

        ready.set(true);
        log.info("GarbageCollector[Connection] is ready to use");
    }

    private void startInnerTasks() {
        taskScheduler.scheduleWithFixedDelay(this::locateNewConnections, DEFAULT_THREAD_POOL_RUNNING_DELAY, DEFAULT_THREAD_POOL_RUNNING_DELAY, TimeUnit.MILLISECONDS);
        taskScheduler.scheduleWithFixedDelay(this::newGC, RUNNING_DELAY_FOR_NEW_POOL, RUNNING_DELAY_FOR_NEW_POOL, TimeUnit.MILLISECONDS);
        taskScheduler.scheduleWithFixedDelay(this::youngGC, RUNNING_DELAY_FOR_YOUNG_POOL, RUNNING_DELAY_FOR_YOUNG_POOL, TimeUnit.MILLISECONDS);
        taskScheduler.scheduleWithFixedDelay(this::oldGC, RUNNING_DELAY_FOR_OLD_POOL, RUNNING_DELAY_FOR_OLD_POOL, TimeUnit.MILLISECONDS);
    }

    // searches new connections(not exist in pool) from db and locate them proper pool
    private void locateNewConnections() {
        synchronized (connectionGCService) {
            synchronized (pool) {
                List<Long> allConnectionIds = pool.getAllInPool();
                List<ConnectionForGC> connections;
                if (allConnectionIds.isEmpty()) {
                    connections = connectionGCService.getAllConnections();
                } else {
                    connections = connectionGCService.getAllConnectionsNotContains(allConnectionIds);
                }
                if (connections == null || connections.isEmpty()) {
                    return;
                }

                for (ConnectionForGC connection : connections) {
                    if (!criteria.test(connection)) {
                        pool.allocate(connection.getConnection().getId());
                    }
                }
            }
        }
    }

    // works with new pool
    private void newGC() {
        synchronized (connectionGCService) {
            synchronized (pool) {
                List<Long> newElements = pool.getNewElements();
                for (Long id : newElements) {
                    if (connectionGCService.exists(id)) {
                        ConnectionForGC connection = connectionGCService.getById(id);
                        if (criteria.test(connection)) {
                            pool.evictFromNewPool(id);
                            log.info("Connection[id = {}] is unmarked by GarbageCollector. Because it matches the criteria.", id);
                            pool.logTotalElements();
                        } else {
                            pool.reconsiderNewPool(id);
                        }
                    } else {
                        pool.evictFromNewPool(id);
                        log.info("Connection[id = {}] is unmarked by GarbageCollector. Because it is not exist in db.", id);
                        pool.logTotalElements();
                    }
                }
            }
        }
    }

    // works with young pool
    private void youngGC() {
        synchronized (connectionGCService) {
            synchronized (pool) {
                List<Long> youngElements = pool.getYoungElements();
                for (Long id : youngElements) {
                    if (connectionGCService.exists(id)) {
                        ConnectionForGC connection = connectionGCService.getById(id);
                        if (criteria.test(connection)) {
                            pool.evictFromYoungPool(id);
                            log.info("Connection[id = {}] is unmarked by GarbageCollector. Because it matches the criteria.", id);
                            pool.logTotalElements();
                        } else {
                            pool.reconsiderYoungPool(id);
                        }
                    } else {
                        pool.evictFromYoungPool(id);
                        log.info("Connection[id = {}] is unmarked by GarbageCollector. Because it is not exist in db.", id);
                        pool.logTotalElements();
                    }
                }
            }
        }
    }

    // works with old pool
    private void oldGC() {
        synchronized (connectionGCService) {
            synchronized (pool) {
                List<Long> oldElements = pool.getOldElements();
                for (Long id : oldElements) {
                    if (connectionGCService.exists(id)) {
                        ConnectionForGC connection = connectionGCService.getById(id);
                        if (criteria.test(connection)) {
                            pool.evictFromOldPool(id);
                            log.info("Connection[id = {}] is unmarked by GarbageCollector. Because it matches the criteria.", id);
                            pool.logTotalElements();
                        } else {
                            pool.reconsiderOldPool(id);
                        }
                    } else {
                        pool.evictFromOldPool(id);
                        log.info("Connection[id = {}] is unmarked by GarbageCollector. Because it is not exist in db.", id);
                        pool.logTotalElements();
                    }
                }
            }
        }
    }

    @Override
    public void sweep() {
        if (!ready.get()) {
            try {
                Thread.sleep(WAITING_FOR_READY_TIMEOUT);
                if (!ready.get()) {
                    return;
                }
            } catch (InterruptedException e) {
                return;
            }
        }
        synchronized (connectionGCService) {
            synchronized (pool) {
                List<Long> elementsToBeDeleted = pool.getElementsToBeDeleted();
                for (Long id : elementsToBeDeleted) {
                    if (!connectionGCService.exists(id)) {
                        log.info("Connection[id = {}] is unmarked by GarbageCollector. Because it is not exist in db.", id);
                        pool.logTotalElements();
                        continue;
                    }
                    ConnectionForGC connection = connectionGCService.getById(id);
                    if (!criteria.test(connection)) {
                        connectionGCService.deleteById(id);
                        log.info("Connection[id = {}] is deleted by GarbageCollector", id);
                        pool.logTotalElements();
                    } else {
                        log.info("Connection[id = {}] is unmarked by GarbageCollector. Because it matches the criteria", id);
                        pool.logTotalElements();
                    }
                }
            }
        }
    }

    @Override
    public void changeCriteria(Criteria<ConnectionForGC> newCriteria) {
        this.criteria = newCriteria;
    }

    @Override
    public void stop() {
        taskScheduler.shutdownNow();
        ready.set(false);
        log.info("GarbageCollector[Connection] has stopped");
    }

}
