package com.becon.opencelium.backend.gc.connection;

import com.becon.opencelium.backend.database.mysql.entity.ConnectionHistory;
import com.becon.opencelium.backend.database.mysql.service.ConnectionHistoryService;
import com.becon.opencelium.backend.enums.Action;
import com.becon.opencelium.backend.gc.base.Pool;
import org.slf4j.Logger;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

public class ConnectionPool extends Pool<Long> {
    private final Logger log;
    private final ConnectionHistoryService connectionHistoryService;

    public ConnectionPool(ConnectionHistoryService connectionHistoryService, Logger log) {
        this.connectionHistoryService = connectionHistoryService;
        this.log = log;
    }

    @Override
    public void initialize(List<Long> newElements) {
        boolean changed = false;
        long maxDuration = (OLD_POOL_LIFE_TIME * 2 * YOUNG_POOL_MAX_FAIRNESS + YOUNG_POOL_LIFE_TIME * YOUNG_POOL_MAX_FAIRNESS) / 1000;
        for (Long elem : newElements) {
            Pool<Long>.PoolObj poolObj = new PoolObj(elem);
            List<ConnectionHistory> all = connectionHistoryService
                    .findAllWithInterval(poolObj.getElement(), maxDuration);

            if (all == null || all.isEmpty()) {
                toDeletePool.add(elem);
                log.info("Connection[id = {}] is marked as WILL_BE_DELETED with status RED. Because it hasn't any history while last {} seconds.", elem, maxDuration);
                changed = true;
            } else if (all.size() == 1 && all.get(0).getAction().equals(Action.CREATE)) {
                if (all.get(0).getCreated().isAfter(LocalDateTime.now().minus(NEW_POOL_LIFE_TIME, ChronoUnit.MILLIS))) {
                    log.info("Connection[id = {}] is marked as WILL_BE_DELETED with status NEW. Because it is created less than {} seconds ago. ", elem, NEW_POOL_LIFE_TIME / 1000);
                    changed = true;
                    newPool.put(elem, poolObj);
                } else {
                    log.info("Connection[id = {}] is marked as WILL_BE_DELETED with status RED. Because it is created more than {} seconds ago.", elem, NEW_POOL_LIFE_TIME / 1000);
                    changed = true;
                    toDeletePool.add(elem);
                }
            } else if (!(all.size() == 1 && all.get(0).getAction() != Action.DELETE)) {
                all.stream()
                        .filter(ch -> ch.getCreated().isAfter(LocalDateTime.now().minus(OLD_POOL_LIFE_TIME, ChronoUnit.MILLIS)) && ch.getAction() != Action.CREATE && ch.getAction() != Action.DELETE)
                        .findAny()
                        .ifPresentOrElse(
                                (ch) -> all.stream().filter(chh -> chh.getCreated().isAfter(LocalDateTime.now().minus(NEW_POOL_LIFE_TIME, ChronoUnit.MILLIS)) && ch.getAction() != Action.CREATE && ch.getAction() != Action.DELETE)
                                        .findAny()
                                        .ifPresentOrElse(
                                                chhh -> {
                                                    youngPool.put(elem, poolObj);
                                                    log.info("Connection[id = {}] is marked as WILL_BE_DELETED with status YOUNG. Because it is modified less than {} seconds ago.", elem, YOUNG_POOL_LIFE_TIME / 1000);
                                                },
                                                () -> {
                                                    poolObj.setFairness(YOUNG_POOL_MAX_FAIRNESS + 1);
                                                    oldPool.put(elem, poolObj);
                                                    log.info("Connection[id = {}] is marked as WILL_BE_DELETED with status OLD. Because it is modified less than {} seconds ago.", elem, OLD_POOL_LIFE_TIME / 1000);
                                                }),
                                () -> {
                                    toDeletePool.add(elem);
                                    log.info("Connection[id = {}] is marked as WILL_BE_DELETED with status RED. Because it is modified more than {} seconds ago.", elem, OLD_POOL_LIFE_TIME / 1000);
                                }
                        );
                changed = true;
            }
        }
        if (changed) {
            logTotalElements();
        }
    }

    @Override
    public void allocate(Long newElement) {
        Pool<Long>.PoolObj poolObj = new PoolObj(newElement);
        rotate(poolObj);
    }

    @Override
    public void reconsiderNewPool(Long element) {
        List<ConnectionHistory> histories = connectionHistoryService.findAllWithConnectionId(element);
        if (histories == null || histories.isEmpty() || histories.size() == 1 && histories.get(0).getAction() == Action.CREATE) {
            if (newPool.get(element).getTimestamp() + NEW_POOL_LIFE_TIME < System.currentTimeMillis()) {
                evictFromNewPool(element);
                toDeletePool.add(element);
                log.info("Connection[id = {}]'s status changed to RED. Because it's time over for NEW", element);
                logTotalElements();
            } else if (histories != null && histories.size() == 1 && histories.get(0).getAction() == Action.DELETE) {
                evictFromNewPool(element);
                log.info("Connection[id = {}] is unmarked by GarbageCollector. Because it is deleted.", element);
                logTotalElements();
            }
            return;
        }
        evictFromNewPool(element);
        PoolObj poolObj = new PoolObj(element);
        poolObj.setFairness(1);
        youngPool.put(element, poolObj);
        log.info("Connection[id = {}]'s status changed to YOUNG. Because it is changed recently", element);
        logTotalElements();
    }

    @Override
    public void reconsiderYoungPool(Long element) {
        List<ConnectionHistory> histories = connectionHistoryService.findAllWithInterval(element, (System.currentTimeMillis() - youngPool.get(element).getTimestamp()) / 1000);
        if (histories == null || histories.isEmpty() || histories.size() == 1 && histories.get(0).getAction() == Action.CREATE) {
            if (youngPool.get(element).getTimestamp() + YOUNG_POOL_LIFE_TIME < System.currentTimeMillis()) {
                evictFromYoungPool(element);
                toDeletePool.add(element);
                log.info("Connection[id = {}]'s status changed to RED. Because it's time over for YOUNG", element);
                logTotalElements();
            } else if (histories != null && histories.size() == 1 && histories.get(0).getAction() == Action.DELETE) {
                evictFromYoungPool(element);
                log.info("Connection[id = {}] is unmarked by GarbageCollector. Because it is deleted.", element);
                logTotalElements();
            }
            return;
        }
        youngPool.get(element).incrementFairness();
        if (youngPool.get(element).getFairness() > YOUNG_POOL_MAX_FAIRNESS) {
            Pool<Long>.PoolObj removed = youngPool.remove(element);
            removed.setTimestamp(System.currentTimeMillis());
            oldPool.put(element, removed);
            log.info("Connection[id = {}]'s status changed to OLD. Because it is changed recently", element);
            logTotalElements();
        } else {
            youngPool.get(element).setTimestamp(System.currentTimeMillis());
        }
    }

    @Override
    public void reconsiderOldPool(Long element) {
        List<ConnectionHistory> histories = connectionHistoryService.findAllWithInterval(element, (System.currentTimeMillis() - oldPool.get(element).getTimestamp()) / 1000);
        if (histories == null || histories.isEmpty() || histories.size() == 1 && histories.get(0).getAction() == Action.CREATE) {
            if (oldPool.get(element).getTimestamp() + OLD_POOL_LIFE_TIME < System.currentTimeMillis()) {
                evictFromOldPool(element);
                toDeletePool.add(element);
                log.info("Connection[id = {}]'s status changed to RED. Because it's time over for OLD", element);
                logTotalElements();
            } else if (histories != null && histories.size() == 1 && histories.get(0).getAction() == Action.DELETE) {
                evictFromNewPool(element);
                log.info("Connection[id = {}] is unmarked by GarbageCollector. Because it is deleted.", element);
                logTotalElements();
            }
            return;
        }
        oldPool.get(element).incrementFairness();
        oldPool.get(element).setTimestamp(System.currentTimeMillis());
    }

    private void rotate(Pool<Long>.PoolObj poolObj) {
        List<ConnectionHistory> all = connectionHistoryService.findAllWithConnectionId(poolObj.getElement());

        if (all == null || all.isEmpty()) {
            return;
        }

        if (all.size() == 1 && all.get(0).getAction() == Action.CREATE) {
            if (all.get(0).getCreated().isAfter(LocalDateTime.now().minus(NEW_POOL_LIFE_TIME, ChronoUnit.MILLIS))) {
                log.info("Connection[id = {}] is marked as WILL_BE_DELETED with status NEW. Because it is created less than {} seconds ago. ", poolObj.getElement(), NEW_POOL_LIFE_TIME / 1000);
                newPool.put(poolObj.getElement(), poolObj);
            } else {
                log.info("Connection[id = {}] is marked as WILL_BE_DELETED with status RED. Because it is created more than {} seconds ago. ", poolObj.getElement(), NEW_POOL_LIFE_TIME / 1000);
                toDeletePool.add(poolObj.getElement());
            }
        } else {
            int fairness = 0;
            all = all.stream()
                    .filter(ch -> ch.getAction() == Action.MODIFY || ch.getAction() == Action.UNDO)
                    .sorted(Comparator.comparingLong(c -> Timestamp.valueOf(c.getCreated()).getTime()))
                    .toList();

            LocalDateTime now = LocalDateTime.now();
            for (int i = 0; i < all.size(); i++) {
                if (all.get(i).getCreated().isAfter(now.minus(NEW_POOL_LIFE_TIME * (i + 1), ChronoUnit.MILLIS))) {
                    fairness++;
                } else {
                    break;
                }
                if (fairness > YOUNG_POOL_MAX_FAIRNESS) {
                    break;
                }
            }
            if (fairness <= YOUNG_POOL_MAX_FAIRNESS && fairness > 0) {
                poolObj.setFairness(fairness);
                poolObj.setTimestamp(Timestamp.valueOf(all.get(0).getCreated()).getTime());
                log.info("Connection[id = {}] is marked as WILL_BE_DELETED with status YOUNG. Because it is modified {} times.", poolObj.getElement(), fairness);
                youngPool.put(poolObj.getElement(), poolObj);
            } else {
                if (fairness > YOUNG_POOL_MAX_FAIRNESS) {
                    poolObj.setFairness(fairness);
                    poolObj.setTimestamp(Timestamp.valueOf(all.get(0).getCreated()).getTime());
                    log.info("Connection[id = {}] is marked as WILL_BE_DELETED with status OLD. Because it is modified {} times.", poolObj.getElement(), fairness);
                    oldPool.put(poolObj.getElement(), poolObj);
                } else {
                    int fairness2 = YOUNG_POOL_MAX_FAIRNESS;
                    for (int i = 0; i < all.size(); i++) {
                        if (all.get(i).getCreated().isAfter(now.minus(OLD_POOL_LIFE_TIME * (i + 1), ChronoUnit.MILLIS))) {
                            fairness2++;
                        } else {
                            break;
                        }
                    }
                    if (fairness2 == YOUNG_POOL_MAX_FAIRNESS) {
                        log.info("Connection[id = {}] is marked as WILL_BE_DELETED with status RED. Because it is modified but too long times ago.", poolObj.getElement());
                        toDeletePool.add(poolObj.getElement());
                    } else {
                        poolObj.setFairness(fairness + fairness2);
                        poolObj.setTimestamp(Timestamp.valueOf(all.get(0).getCreated()).getTime());
                        log.info("Connection[id = {}] is marked as WILL_BE_DELETED with status OLD. Because it is modified {} times", poolObj.getElement(), fairness + fairness2);
                        oldPool.put(poolObj.getElement(), poolObj);
                    }
                }
            }
        }
        logTotalElements();
    }

    public void logTotalElements() {
        log.info("Connections in GC - NEW: {}, YOUNG: {}, OLD: {}, RED: {}", newPool.size(), youngPool.size(), oldPool.size(), toDeletePool.size());
    }
}
