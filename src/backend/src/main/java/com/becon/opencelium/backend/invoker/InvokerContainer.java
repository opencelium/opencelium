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

package com.becon.opencelium.backend.invoker;

import com.becon.opencelium.backend.invoker.entity.Invoker;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class InvokerContainer {

    private Map<String, Invoker> invokers;

    public InvokerContainer(Map<String, Invoker> invokers) {
        this.invokers = invokers;
    }

    public Map<String, Invoker> getInvokers() {
        return invokers;
    }

    public Invoker getByName(String name) {
        if (!invokers.containsKey(name)) {
            for (Invoker invoker : invokers.values()) {
                if (invoker.getName().equals(name)) {
                    return invoker;
                }
            }
            throw new RuntimeException("Invoker " + name + " from DB not found in invoker folder");
        }
        return invokers.get(name);
    }

    public boolean existsByName(String name) {
        return invokers.get(name) != null;
    }

    public void updateAll(Map<String, Invoker> invokers) {
        this.invokers = invokers;
    }

    public void add(String name, Invoker invoker) {
        invokers.put(name, invoker);
    }

    public void remove(String name) {
        invokers.remove(name);
    }
}
