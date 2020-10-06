package com.becon.opencelium.backend.execution2.container;

import java.util.ArrayList;
import java.util.List;

public class ExecutedMethods {

     List<Method> methods = new ArrayList<>();

     public Method getMethod(String color, String exchangeTpe, String result) {
          return methods.stream()
                  .filter(m -> m.getMethodKey().equals(color)
                          && m.getExchangeType().equals(exchangeTpe)
                          && m.getResult().equals(result)).findFirst()
                  .orElseThrow(() -> new RuntimeException("Method " + color + "." + exchangeTpe + "." + result +
                          " not found in executed methods"));
     }

     public List<Method> getMethods() {
          return methods;
     }

     public void setMethod(Method method) {
          methods.add(method);
     }

     public void setMethods(List<Method> methods) {
          this.methods = methods;
     }
}
