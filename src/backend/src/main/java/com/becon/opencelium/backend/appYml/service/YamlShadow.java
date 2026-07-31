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

import org.snakeyaml.engine.v2.exceptions.Mark;
import org.snakeyaml.engine.v2.exceptions.MarkedYamlEngineException;

import java.util.BitSet;
import java.util.Optional;
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

    /**
     * Turns a snakeyaml parse failure into a message an operator can act on.
     *
     * <p>The shadow only deletes {@code #} characters <em>within</em> lines — it
     * never adds or removes newlines — so a problem mark's line number maps 1:1
     * back to {@code originalYaml}. We surface the offending line as the user
     * actually wrote it (with its {@code #}), 1-based.</p>
     *
     * <p>The most common and most confusing cause is a hand-edited commented-out
     * property whose indentation, once the {@code #} is removed, no longer lines
     * up with the active keys at its level — e.g. {@code "  #     address: x"}
     * under {@code "  port: 9090"} re-aligns to column 7 and reads as a child of
     * {@code port} instead of its sibling. When the flagged line is such an
     * inactive anchor we explain exactly that; otherwise we fall back to a
     * generic-but-located syntax message. Either way the result is never less
     * informative than the raw {@code "Failed to parse application.yml"}.</p>
     *
     * @param originalYaml the file as it is on disk (not the shadow)
     * @param cause        the exception thrown by snakeyaml's compose step
     * @return a human-readable, located description of the failure
     */
    public static String describeParseFailure(String originalYaml, Throwable cause) {
        Optional<Mark> markOpt = problemMark(cause);
        if (markOpt.isEmpty()) {
            return "Failed to parse application.yml: the file contains invalid YAML. "
                    + "Please review it for syntax or indentation errors.";
        }

        Mark mark = markOpt.get();
        String[] lines = originalYaml.replace("\r\n", "\n").replace("\r", "\n").split("\n", -1);
        int lineIdx = mark.getLine();
        if (lineIdx < 0 || lineIdx >= lines.length) {
            return "Failed to parse application.yml: the file contains invalid YAML "
                    + "(near line " + (lineIdx + 1) + "). Please review it for syntax "
                    + "or indentation errors.";
        }

        String originalLine = lines[lineIdx];
        int lineNo = lineIdx + 1;

        if (isAnchor(originalLine)) {
            return "Failed to parse application.yml: the commented-out property on line "
                    + lineNo + " is mis-indented. Once its leading '#' is removed it is "
                    + "indented more deeply than the active properties around it, so it "
                    + "reads as a child of the line above instead of a sibling at the same "
                    + "level. Fix it by making the spaces after '#' match the indentation "
                    + "of the other keys at that level (the spaces after '#' decide its "
                    + "nesting). Offending line:\n"
                    + lineNo + ": " + originalLine;
        }

        return "Failed to parse application.yml: invalid YAML syntax on line " + lineNo
                + ". Please check this line's indentation and structure.\n"
                + lineNo + ": " + originalLine;
    }

    private static Optional<Mark> problemMark(Throwable cause) {
        for (Throwable t = cause; t != null; t = t.getCause()) {
            if (t instanceof MarkedYamlEngineException marked) {
                return marked.getProblemMark();
            }
        }
        return Optional.empty();
    }
}
