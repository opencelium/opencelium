/*
 * // Copyright (C) <2019> <becon GmbH>
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
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Component
public class InvokerContainer {

    private Map<String, Invoker> invokers;

    public InvokerContainer(Map<String, Invoker> invokers) {
        this.invokers = invokers;
//        this.name = name;
    }

    public Map<String, Invoker> getInvokers() {
        return invokers;
    }

    public Invoker getByName(String name){
        return invokers.get(name);
    }

    public boolean existsByName(String name){
        return invokers.get(name) != null;
    }

    public void update(Map<String, Invoker> invokers){
        this.invokers = invokers;
    }
}
