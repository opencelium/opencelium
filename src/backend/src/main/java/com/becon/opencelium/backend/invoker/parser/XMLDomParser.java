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

package com.becon.opencelium.backend.invoker.parser;

import org.springframework.stereotype.Service;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.util.function.Function;

public class XMLDomParser<R> implements XMLParser<Node, R> {

    private NodeList nodeList;
    private R result;

    private XMLDomParser(){

    }

    public XMLDomParser(NodeList nodeList) {
        this.nodeList = nodeList;
    }

    @Override
    public R doAction(String node, Function<Node, R> parser){

        for (int i = 0; i < nodeList.getLength(); i++) {
            Node element = nodeList.item(i);

            if(element.getNodeType() != Node.ELEMENT_NODE){
                continue;
            }

            String elem = element.getNodeName();
            if (!element.getNodeName().equals(node)){
                continue;
            }
            result = parser.apply(element);
        }
        return result;
    }
}
