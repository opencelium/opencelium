package com.becon.opencelium.backend.gc.base;

import org.springframework.context.ApplicationEvent;
import org.springframework.core.ResolvableType;
import org.springframework.core.ResolvableTypeProvider;

public class RunGCEvent<T> extends ApplicationEvent implements ResolvableTypeProvider {

    public RunGCEvent(Object source) {
        super(source);
    }

    @Override
    public ResolvableType getResolvableType() {
        return ResolvableType.forClassWithGenerics(
                getClass(),
                ResolvableType.forInstance(this.source)
        );
    }
}
