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
import com.becon.opencelium.backend.utility.InvokerNameUtils;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

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
        return findByName(name)
                .orElseThrow(() -> new RuntimeException("Invoker " + name + " from DB not found in invoker folder"));
    }

    public boolean existsByName(String name) {
        return findByName(name).isPresent();
    }

    /**
     * Looks the invoker up by its exact name first and falls back to a case-insensitive match,
     * because the name may come from a database or a file system that does not preserve case.
     */
    public Optional<Invoker> findByName(String name) {
        if (name == null) {
            return Optional.empty();
        }
        Invoker exact = invokers.get(name);
        if (exact != null) {
            return Optional.of(exact);
        }
        return invokers.entrySet().stream()
                .filter(e -> InvokerNameUtils.sameName(e.getKey(), name)
                        || (e.getValue() != null && InvokerNameUtils.sameName(e.getValue().getName(), name)))
                .map(Map.Entry::getValue)
                .findFirst();
    }

    public void updateAll(Map<String, Invoker> invokers) {
        this.invokers = invokers;
    }

    public void add(String name, Invoker invoker) {
        invokers.put(name, invoker);
    }

    public void remove(String name) {
        if (name == null) {
            return;
        }
        if (invokers.remove(name) != null) {
            return;
        }
        invokers.keySet().stream()
                .filter(key -> InvokerNameUtils.sameName(key, name))
                .findFirst()
                .ifPresent(invokers::remove);
    }
}
