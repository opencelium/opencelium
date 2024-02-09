package com.becon.opencelium.backend.gc.base;

public interface GarbageCollector<T> {
    void start(Criteria<T> criteria); //starts gc and it will be ready to run
    void changeCriteria(Criteria<T> newCriteria); //changes gc's criteria if needed
    void sweep(); // sweeps marked elements
    void stop(); // shutdowns all jobs of gc
}
