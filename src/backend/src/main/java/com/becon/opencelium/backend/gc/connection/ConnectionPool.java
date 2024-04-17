package com.becon.opencelium.backend.gc.connection;

import com.becon.opencelium.backend.database.mysql.entity.ConnectionHistory;
import com.becon.opencelium.backend.database.mysql.service.ConnectionHistoryService;
import com.becon.opencelium.backend.enums.Action;
import com.becon.opencelium.backend.gc.base.Pool;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class ConnectionPool extends Pool<Long> {
    private final ConnectionHistoryService connectionHistoryService;
    public final Logger logger = Logger.getLogger("ConnectionPool");

    public ConnectionPool(ConnectionHistoryService connectionHistoryService) {
        this.connectionHistoryService = connectionHistoryService;
    }

    @Override
    public void initialize(List<Long> newElements) {
        synchronized (this) {
            long maxDuration = (OLD_POOL_LIFE_TIME * 2 * YOUNG_POOL_MAX_FAIRNESS + YOUNG_POOL_LIFE_TIME * YOUNG_POOL_MAX_FAIRNESS) / 1000;
            for (Long elem : newElements) {
                Pool<Long>.PoolObj poolObj = new PoolObj(elem);
                List<ConnectionHistory> all = connectionHistoryService
                        .findAllWithInterval(poolObj.getElement(), maxDuration);

                if (all == null || all.isEmpty()) {
                    toDeletePool.add(elem);
                    logger.log(Level.INFO, "initialize() : element added to todelete pool. Because it hasn't any history while last " + maxDuration + " seconds. " + "id = " + elem);
                } else if (all.size() == 1 && all.get(0).getAction().equals(Action.CREATE)) {
                    if (all.get(0).getCreated().isAfter(LocalDateTime.now().minus(NEW_POOL_LIFE_TIME, ChronoUnit.MILLIS))) {
                        logger.log(Level.INFO, "initialize() : element added to new pool. Because it is created less than " + NEW_POOL_LIFE_TIME + " milseconds ago. " + "id = " + elem);
                        newPool.put(elem, poolObj);
                    } else {
                        logger.log(Level.INFO, "initialize() : element added to todelete pool. Because it is created more than " + NEW_POOL_LIFE_TIME + " milseconds ago. " + "id = " + elem);
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
                                                        logger.log(Level.INFO, "initialize() : element added to young pool. Because it is modified less than " + YOUNG_POOL_LIFE_TIME + " milseconds ago. " + "id = " + elem);
                                                    },
                                                    () -> {
                                                        poolObj.setFairness(YOUNG_POOL_MAX_FAIRNESS + 1);
                                                        oldPool.put(elem, poolObj);
                                                        logger.log(Level.INFO, "initialize() : element added to old pool. Because it is modified less than " + OLD_POOL_LIFE_TIME + " milseconds ago. " + "id = " + elem);
                                                    }),
                                    () -> {
                                        toDeletePool.add(elem);
                                        logger.log(Level.INFO, "initialize() : element added to todelete pool. Because it is modified more than " + OLD_POOL_LIFE_TIME + " milseconds ago. " + "id = " + elem);
                                    }
                            );
                }
            }
            logger.log(Level.INFO, "after initialize(): New count: %d, Young count: %d, Old count: %d, ToDeleted count: %d".formatted(newPool.size(), youngPool.size(), oldPool.size(), toDeletePool.size()));
        }
    }

    @Override
    public void allocate(Long newElement) {
        synchronized (this) {
            Pool<Long>.PoolObj poolObj = new PoolObj(newElement);
            rotate(poolObj);
        }
    }

    @Override
    public void reconsiderNewPool(Long element) {
        synchronized (this) {
            List<ConnectionHistory> histories = connectionHistoryService.findAllWithConnectionId(element);
            if (histories == null || histories.isEmpty() || histories.size() == 1 && histories.get(0).getAction() == Action.CREATE) {
                if (newPool.get(element).getTimestamp() + NEW_POOL_LIFE_TIME < System.currentTimeMillis()) {
                    evictFromNewPool(element);
                    toDeletePool.add(element);
                    logger.log(Level.INFO, "reconsiderInYoungPool(): moved to todelete Pool. Because it's time over id = " + element);
                } else if (histories != null && histories.size() == 1 && histories.get(0).getAction() == Action.DELETE) {
                    evictFromNewPool(element);
                    logger.log(Level.INFO, "reconsiderInOldPool(): evicted from pool. Because it is deleted. id = " + element);
                }
                return;
            }
            evictFromNewPool(element);
            PoolObj poolObj = new PoolObj(element);
            poolObj.setFairness(1);
            youngPool.put(element, poolObj);
            logger.log(Level.INFO, "reconsiderInYoungPool(): moved to young pool. Because it is changed. id = %d, fairness = %d".formatted(element, youngPool.get(element).getFairness()));
        }
    }

    @Override
    public void reconsiderYoungPool(Long element) {
        synchronized (this) {

            List<ConnectionHistory> histories = connectionHistoryService.findAllWithInterval(element, (System.currentTimeMillis() - youngPool.get(element).getTimestamp()) / 1000);
            if (histories == null || histories.isEmpty() || histories.size() == 1 && histories.get(0).getAction() == Action.CREATE) {
                if (youngPool.get(element).getTimestamp() + YOUNG_POOL_LIFE_TIME < System.currentTimeMillis()) {
                    evictFromYoungPool(element);
                    toDeletePool.add(element);
                    logger.log(Level.INFO, "reconsiderInYoungPool(): moved to todelete Pool. Because it's time over id = " + element);
                } else if (histories != null && histories.size() == 1 && histories.get(0).getAction() == Action.DELETE) {
                    evictFromYoungPool(element);
                    logger.log(Level.INFO, "reconsiderInYoungPool(): evicted from pool. Because it is deleted. id = " + element);
                }
                return;
            }
            youngPool.get(element).incrementFairness();
            logger.log(Level.INFO, "reconsiderInYoungPool(): fairness of an element is increased. id = %d, fairness = %d".formatted(element, youngPool.get(element).getFairness()));
            if (youngPool.get(element).getFairness() > YOUNG_POOL_MAX_FAIRNESS) {
                Pool<Long>.PoolObj removed = youngPool.remove(element);
                removed.setTimestamp(System.currentTimeMillis());
                oldPool.put(element, removed);
                logger.log(Level.INFO, "reconsiderInYoungPool(): moved to old pool. Because fairness is enough for that. id = %d, fairness = %d".formatted(element, oldPool.get(element).getFairness()));
            } else {
                youngPool.get(element).setTimestamp(System.currentTimeMillis());
            }
        }
    }

    @Override
    public void reconsiderOldPool(Long element) {
        synchronized (this) {
            List<ConnectionHistory> histories = connectionHistoryService.findAllWithInterval(element, (System.currentTimeMillis() - oldPool.get(element).getTimestamp()) / 1000);
            if (histories == null || histories.isEmpty() || histories.size() == 1 && histories.get(0).getAction() == Action.CREATE) {
                if (oldPool.get(element).getTimestamp() + OLD_POOL_LIFE_TIME < System.currentTimeMillis()) {
                    evictFromOldPool(element);
                    toDeletePool.add(element);
                    logger.log(Level.INFO, "reconsiderInOldPool(): moved to todelete Pool. Because it's time over id = " + element);
                } else if (histories != null && histories.size() == 1 && histories.get(0).getAction() == Action.DELETE) {
                    logger.log(Level.INFO, "reconsiderInOldPool(): evicted from pool. Because it is deleted. id = " + element);
                    evictFromNewPool(element);
                }
                return;
            }
            oldPool.get(element).incrementFairness();
            oldPool.get(element).setTimestamp(System.currentTimeMillis());
            logger.log(Level.INFO, "reconsiderInOldPool(): fairness of an element is increased. id = %d, fairness = %d".formatted(element, oldPool.get(element).getFairness()));
        }
    }

    private void rotate(Pool<Long>.PoolObj poolObj) {
        synchronized (this) {
            List<ConnectionHistory> all = connectionHistoryService.findAllWithConnectionId(poolObj.getElement());

            if (all == null || all.isEmpty()) {
                return;
            }

            if (all.size() == 1 && all.get(0).getAction() == Action.CREATE) {
                if (all.get(0).getCreated().isAfter(LocalDateTime.now().minus(NEW_POOL_LIFE_TIME, ChronoUnit.MILLIS))) {
                    logger.log(Level.INFO, "rotate() : element added to new pool. Because it is created less than " + NEW_POOL_LIFE_TIME + " milseconds ago. " + "id = " + poolObj.getElement());
                    newPool.put(poolObj.getElement(), poolObj);
                } else {
                    logger.log(Level.INFO, "rotate() : element added to new pool. Because it is created more than " + NEW_POOL_LIFE_TIME + " milseconds ago. " + "id = " + poolObj.getElement());
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
                    logger.log(Level.INFO, "rotate() : element added to young pool. Because it is modified " + fairness + " times. " + "id = " + poolObj.getElement());
                    youngPool.put(poolObj.getElement(), poolObj);
                } else {
                    if (fairness > YOUNG_POOL_MAX_FAIRNESS) {
                        poolObj.setFairness(fairness);
                        poolObj.setTimestamp(Timestamp.valueOf(all.get(0).getCreated()).getTime());
                        logger.log(Level.INFO, "rotate() : element added to old pool. Because it is modified " + fairness + " times. " + "id = " + poolObj.getElement());
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
                            logger.log(Level.INFO, "rotate() : element added to todelete pool. Because it is modified but before too long times ago " + "id = " + poolObj.getElement());
                            toDeletePool.add(poolObj.getElement());
                        } else {
                            poolObj.setFairness(fairness + fairness2);
                            poolObj.setTimestamp(Timestamp.valueOf(all.get(0).getCreated()).getTime());
                            logger.log(Level.INFO, "rotate() : element added to old pool. Because it is modified " + fairness + fairness2 + " times. " + "id = " + poolObj.getElement());
                            oldPool.put(poolObj.getElement(), poolObj);
                        }
                    }
                }
            }
        }
        logger.log(Level.INFO, "after rotate(): New count: %d, Young count: %d, Old count: %d, ToDeleted count: %d".formatted(newPool.size(), youngPool.size(), oldPool.size(), toDeletePool.size()));
    }
}
