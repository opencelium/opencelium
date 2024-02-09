package com.becon.opencelium.backend.gc.base;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

public abstract class Pool<T> {
    protected Map<T, PoolObj> newPool; // stores new elements
    protected Map<T, PoolObj> youngPool; // stores young elements
    protected Map<T, PoolObj> oldPool; // stores old elements
    protected List<T> toDeletePool; // stores marked for deleting elements
    protected static long NEW_POOL_LIFE_TIME = 2 * 60 * 1000; //2 minutes (but need to bo changed to 2 hours)
    protected static long YOUNG_POOL_LIFE_TIME = 4 * 60 * 1000; //4 minutes (but need to bo changed to 4 hours)
    protected static long OLD_POOL_LIFE_TIME = 8 * 60 * 1000; //8 minutes (but need to bo changed to 8 hours)
    protected static int YOUNG_POOL_MAX_FAIRNESS = 2; // need to be changed to 5

    public Pool() {
        this.newPool = new ConcurrentHashMap<>();
        this.youngPool = new ConcurrentHashMap<>();
        this.oldPool = new ConcurrentHashMap<>();
        this.toDeletePool = new ArrayList<>();
    }

    public abstract void initialize(List<T> newElements); // stores all elements that not matches to the criteria to proper pool

    public abstract void allocate(T newElement); // stores an element to proper pool

    /**
     * Checks every element in new pool.
     * If it matches to the criteria. It will be evicted from pool
     * If it is modified then it will be moved to young pool.
     * If it's time is over it will be marked to delete
     */
    public abstract void reconsiderNewPool(T element);
    /**
     * Checks every element in young pool.
     * If it matches to the criteria. It will be evicted from pool
     * If it is modified then it's fairness will be increased.
     * When it's fairness is greater than {@link Pool#YOUNG_POOL_MAX_FAIRNESS}' it will be moved to old pool.
     * If it's time is over it will be marked to delete
     */
    public abstract void reconsiderYoungPool(T element);
    /**
     * Checks every element in old pool.
     * If it matches to the criteria. It will be evicted from pool
     * If it is modified then it's fairness will be increased.
     * If it's time is over it will be marked to delete
     */
    public abstract void reconsiderOldPool(T element);

    public List<T> getAllInPool() {
        return Stream.concat(Stream.concat(newPool.keySet().stream(), youngPool.keySet().stream()), Stream.concat(toDeletePool.stream(), oldPool.keySet().stream())).toList();
    }

    public List<T> getNewElements() {
        return newPool.keySet().stream().toList();
    }

    public List<T> getYoungElements() {
        return youngPool.keySet().stream().toList();
    }

    public List<T> getOldElements() {
        return oldPool.keySet().stream().toList();
    }

    //returns the elements marked to delete and removes all elements from toDelete pool
    public List<T> getElementsToBeDeleted() {
        List<T> toDelete = toDeletePool;
        toDeletePool = new ArrayList<>();
        return toDelete;
    }

    public void evictFromNewPool(T element) {
        newPool.remove(element);
    }

    public void evictFromYoungPool(T element) {
        youngPool.remove(element);
    }

    public void evictFromOldPool(T element) {
        oldPool.remove(element);
    }

    public class PoolObj {
        public PoolObj(T element) {
            this.element = element;
            this.timestamp = System.currentTimeMillis();
        }

        private final T element;
        private int fairness;
        private long timestamp;

        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }

        public T getElement() {
            return element;
        }

        public long getTimestamp() {
            return timestamp;
        }

        public int getFairness() {
            return fairness;
        }

        public void setFairness(int fairness) {
            this.fairness = fairness;
        }

        public void incrementFairness() {
            fairness++;
        }
    }
}