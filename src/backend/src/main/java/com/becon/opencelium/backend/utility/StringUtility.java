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

package com.becon.opencelium.backend.utility;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class StringUtility {

    public static String removeSquareBraces(String data){
        String s = data;
        Pattern p = Pattern.compile("(\\[.*\\])");
        Matcher m = p.matcher(s);

        while (m.find()) {
//            String val1 = m.group().replace("{", "").replace("}", "");
            s = (s.replace(m.group(), ""));
            s = s.replace("{", "").replace("}", "");
        }
        return s;
    }

    public static String findImageFromUrl(String path){
        List<String> parts =  Arrays.asList(path.split("/"));

        return parts.stream()
                .filter(p -> p.contains(".jpg") || p.contains("jpeg") || p.contains("png"))
                .findFirst().get();
    }
}
