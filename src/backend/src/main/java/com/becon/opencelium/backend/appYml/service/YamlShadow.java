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

package com.becon.opencelium.backend.appYml.service;

import java.util.BitSet;
import java.util.regex.Pattern;

/**
 * Detects commented-out YAML blocks in a source file and produces a "shadow"
 * version with the outer {@code #} markers stripped, so snakeyaml can parse
 * inactive nodes just like active ones. Shared between {@link YamlConfigReader}
 * (which marks the resulting nodes inactive) and {@link YamlConfigWriter}
 * (which needs the same path → line-range mapping to enable/disable nodes).
 *
 * <p>The anchor regex accepts <em>multiple</em> leading {@code #} markers so
 * a doubly-commented key like {@code "  #  #    enabled: false"} is still
 * recognised as an inactive property — every leading {@code #} on those anchor
 * lines is stripped in the shadow.</p>
 */
public final class YamlShadow {

    // Anchor: one-or-more leading `#` markers separated by whitespace, then a
    // lower-case YAML key. The lower-case constraint guards against doc
    // sentences like `# Note: foo`.
    private static final Pattern KEY_ANCHOR = Pattern.compile(
            "^\\s*(?:#\\s*)+[a-z_$][\\w.$-]*\\s*:.*$"
    );

    // Anchor: one-or-more leading `#` markers then a sequence item.
    private static final Pattern SEQ_ANCHOR = Pattern.compile(
            "^\\s*(?:#\\s*)+-\\s+.*$"
    );

    // Decorative caption: a row of `#` characters, or a line that opens and
    // closes with `#`. Treated as a block boundary even if its inner text
    // looks YAML-like (e.g. `#   notification:   #`).
    private static final Pattern DECORATIVE = Pattern.compile(
            "^\\s*#+\\s*$|^\\s*#.*#\\s*$"
    );

    // Any line whose first non-whitespace character is `#`.
    private static final Pattern HASH_LINE = Pattern.compile(
            "^\\s*#.*$"
    );

    public record Result(String shadow, BitSet inactiveLines) {
    }

    private YamlShadow() {
    }

    public static Result build(String yamlText) {
        String normalized = yamlText.replace("\r\n", "\n").replace("\r", "\n");
        String[] lines = normalized.split("\n", -1);

        BitSet inactiveLines = new BitSet(lines.length);
        BitSet stripLines = new BitSet(lines.length);
        detectInactiveBlocks(lines, inactiveLines, stripLines);

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            if (stripLines.get(i)) {
                sb.append(stripAllLeadingHashes(line));
            } else {
                sb.append(line);
            }
            if (i < lines.length - 1) {
                sb.append('\n');
            }
        }
        return new Result(sb.toString(), inactiveLines);
    }

    public static boolean isAnchor(String line) {
        // Decorative captions can superficially match KEY_ANCHOR; reject them
        // first so box-lines don't become anchors.
        if (DECORATIVE.matcher(line).matches()) {
            return false;
        }
        return KEY_ANCHOR.matcher(line).matches() || SEQ_ANCHOR.matcher(line).matches();
    }

    /**
     * Removes every leading {@code #} marker (separated only by whitespace) from
     * the line. Stops at the first non-{@code #} non-whitespace character, so
     * inner {@code #} markers in comment text are preserved.
     */
    public static String stripAllLeadingHashes(String line) {
        String current = line;
        while (true) {
            int idx = firstNonWhitespace(current);
            if (idx < 0 || current.charAt(idx) != '#') {
                return current;
            }
            current = current.substring(0, idx) + current.substring(idx + 1);
        }
    }

    private static void detectInactiveBlocks(String[] lines, BitSet inactiveLines, BitSet stripLines) {
        int i = 0;
        while (i < lines.length) {
            if (!isAnchor(lines[i])) {
                i++;
                continue;
            }
            int start = i;
            while (start > 0 && belongsToBlock(lines[start - 1])) {
                start--;
            }
            int end = i;
            while (end + 1 < lines.length && belongsToBlock(lines[end + 1])) {
                end++;
            }
            for (int j = start; j <= end; j++) {
                inactiveLines.set(j);
                if (isAnchor(lines[j])) {
                    stripLines.set(j);
                }
            }
            i = end + 1;
        }
    }

    private static boolean belongsToBlock(String line) {
        if (DECORATIVE.matcher(line).matches()) {
            return false;
        }
        return HASH_LINE.matcher(line).matches();
    }

    private static int firstNonWhitespace(String s) {
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c != ' ' && c != '\t') {
                return i;
            }
        }
        return -1;
    }
}
