package com.becon.opencelium.backend.gc.connection;

import com.becon.opencelium.backend.database.mysql.service.ConnectionHistoryService;
import com.becon.opencelium.backend.gc.base.Criteria;
import com.becon.opencelium.backend.gc.base.GarbageCollector;
import com.becon.opencelium.backend.gc.connection.service.ConnectionGCService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Level;
import java.util.logging.Logger;

@Component
public class ConnectionGC implements GarbageCollector<ConnectionForGC> {
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
    private static final Logger logger = Logger.getLogger("ConnectionGC");

    public ConnectionGC(
            ConnectionGCService connectionGCService,
            @Qualifier("connectionHistoryServiceImp") ConnectionHistoryService connectionHistoryService
    ) {
        this.connectionGCService = connectionGCService;
        pool = new ConnectionPool(connectionHistoryService);

        taskScheduler = new ScheduledThreadPoolExecutor(5);
    }

    @Override
    public void start(Criteria<ConnectionForGC> criteria) {
        this.criteria = criteria;

        List<ConnectionForGC> allConnections = connectionGCService.getAllConnections();
        List<ConnectionForGC> forGC =
                allConnections.stream()
                        .filter((c) -> !criteria.test(c)).toList();

        pool.initialize(forGC.stream().map(c -> c.getConnection().getId()).toList());

        startInnerTasks();

        ready.set(true);
        logger.log(Level.INFO, "GC is ready to use");
    }

    private void startInnerTasks() {
        taskScheduler.scheduleWithFixedDelay(this::locateNewConnections, DEFAULT_THREAD_POOL_RUNNING_DELAY, DEFAULT_THREAD_POOL_RUNNING_DELAY, TimeUnit.MILLISECONDS);
        taskScheduler.scheduleWithFixedDelay(this::newGC, RUNNING_DELAY_FOR_NEW_POOL, RUNNING_DELAY_FOR_NEW_POOL, TimeUnit.MILLISECONDS);
        taskScheduler.scheduleWithFixedDelay(this::youngGC, RUNNING_DELAY_FOR_YOUNG_POOL, RUNNING_DELAY_FOR_YOUNG_POOL, TimeUnit.MILLISECONDS);
        taskScheduler.scheduleWithFixedDelay(this::oldGC, RUNNING_DELAY_FOR_OLD_POOL, RUNNING_DELAY_FOR_OLD_POOL, TimeUnit.MILLISECONDS);
        logger.log(Level.INFO, "Started inner tasks");
    }

    // searches new connections(not exist in pool) from db and locate them proper pool
    private void locateNewConnections() {
        List<Long> allConnectionIds = pool.getAllInPool();
        List<ConnectionForGC> connections;
        if (allConnectionIds.isEmpty()) {
            connections = connectionGCService.getAllConnections();
        } else {
            connections = connectionGCService.getAllConnectionsNotContains(allConnectionIds);
        }
        if (connections == null || connections.isEmpty()) {
            logger.log(Level.INFO, "locateNewConnections() : No new connections to add. New count: %d, Young count: %d, Old count: %d, ToDeleted count: %d".formatted(pool.getNewElements().size(), pool.getYoungElements().size(), pool.getOldElements().size(), pool.getElementsToBeDeleted().size()));
            return;
        }
        ;
        for (ConnectionForGC connection : connections) {
            if (!criteria.test(connection)) {
                pool.allocate(connection.getConnection().getId());
                logger.log(Level.INFO, "locateNewConnections(): New count: %d, Young count: %d, Old count: %d, ToDeleted count: %d".formatted(pool.getNewElements().size(), pool.getYoungElements().size(), pool.getOldElements().size(), pool.getElementsToBeDeleted().size()));
            }
        }
        logger.log(Level.INFO, "after locateNewConnections(): New count: %d, Young count: %d, Old count: %d, ToDeleted count: %d".formatted(pool.getNewElements().size(), pool.getYoungElements().size(), pool.getOldElements().size(), pool.getElementsToBeDeleted().size()));
    }

    // works with new pool
    private void newGC() {
        List<Long> newElements = pool.getNewElements();
        for (Long id : newElements) {
            if (connectionGCService.exists(id)) {
                ConnectionForGC connection = connectionGCService.getById(id);
                if (criteria.test(connection)) {
                    logger.log(Level.INFO, "newGC(): evicted from pool. Because it matches the criteria. id = " + id);
                    pool.evictFromNewPool(id);
                } else {
                    pool.reconsiderNewPool(id);
                }
            } else {
                logger.log(Level.INFO, "newGC(): evicted from pool. Because it is not exist in db. id = " + id);
                pool.evictFromNewPool(id);
            }
        }
        logger.log(Level.INFO, "newGC(): run");
    }

    // works with young pool
    private void youngGC() {
        List<Long> youngElements = pool.getYoungElements();
        for (Long id : youngElements) {
            if (connectionGCService.exists(id)) {
                ConnectionForGC connection = connectionGCService.getById(id);
                if (criteria.test(connection)) {
                    logger.log(Level.INFO, "youngGC(): evicted from pool. Because it matches the criteria. id = " + id);
                    pool.evictFromYoungPool(id);
                } else {
                    pool.reconsiderYoungPool(id);
                }
            } else {
                logger.log(Level.INFO, "youngGC(): evicted from pool. Because it is not exist in db. id = " + id);
                pool.evictFromYoungPool(id);
            }
        }
        logger.log(Level.INFO, "youngGC(): run");
    }

    // works with old pool
    private void oldGC() {
        List<Long> oldElements = pool.getOldElements();
        for (Long id : oldElements) {
            if (connectionGCService.exists(id)) {
                ConnectionForGC connection = connectionGCService.getById(id);
                if (criteria.test(connection)) {
                    logger.log(Level.INFO, "oldGC(): evicted from pool. Because it matches the criteria. id = " + id);
                    pool.evictFromOldPool(id);
                } else {
                    pool.reconsiderOldPool(id);
                }
            } else {
                logger.log(Level.INFO, "oldGC(): evicted from pool. Because it is not exist in db. id = " + id);
                pool.evictFromOldPool(id);
            }
        }
        logger.log(Level.INFO, "oldGC(): run");
    }

    @Override
    public void changeCriteria(Criteria<ConnectionForGC> newCriteria) {
        this.criteria = newCriteria;
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
        List<Long> elementsToBeDeleted = pool.getElementsToBeDeleted();
        int count = 0;
        for (Long id : elementsToBeDeleted) {
            if (!connectionGCService.exists(id)) {
                continue;
            }
            count++;
            ConnectionForGC connection = connectionGCService.getById(id);
            if (!criteria.test(connection)) {
                connectionGCService.deleteById(id);
                logger.log(Level.INFO, "GC ran. connection deleted with id = " + id);
            }
        }
        if (count == 0) {
            logger.log(Level.INFO, "GC ran. No connections to delete");
        }
    }

    @Override
    public void stop() {
        taskScheduler.shutdownNow();
        ready.set(false);
        logger.log(Level.INFO, "ConnectionGC stopped");
    }

}
