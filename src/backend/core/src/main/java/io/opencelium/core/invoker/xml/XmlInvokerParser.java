package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;

import java.util.Objects;

/**
 * Turns the bytes of an uploaded invoker file into a parsed document of a known format.
 *
 * <pre>{@code
 * InvokerDocument file = parser.parse(bytes);
 * file.format();     // LEGACY_V5 or V6
 * file.document();   // the parsed XML, ready to be read
 * }</pre>
 *
 * <p>This is the first step of reading an invoker; making an invoker out of the document is the job of
 * the readers built on top of it. Doing the parsing here, and only here, keeps the rules that make an
 * uploaded file safe to handle in one place:
 * <ul>
 *   <li>content larger than {@link #MAX_CONTENT_BYTES} is rejected before it is parsed;</li>
 *   <li>DOCTYPE declarations are refused, which rules out external entities (file and network access
 *       through XXE) and entity expansion bombs;</li>
 *   <li>nothing is ever fetched from the file system or the network;</li>
 *   <li>a file that is not well-formed, or whose format is not supported, is rejected with the line and
 *       column, or the element, where the problem is.</li>
 * </ul>
 *
 * <p>Parsing never modifies anything and keeps no state, so one instance serves concurrent requests.
 */
@Component
public final class XmlInvokerParser {

    /**
     * The largest file accepted. The largest known real invoker is well under one megabyte; the limit
     * stops a crafted upload from exhausting memory before parsing even starts.
     */
    public static final int MAX_CONTENT_BYTES = 10 * 1024 * 1024;

    /**
     * Parses one invoker file.
     *
     * @param content the file's bytes
     * @return the parsed document and the format it was written in
     * @throws InvokerReadException if the content is too large, is not well-formed XML, or is not an
     *                              invoker file this version understands
     */
    public InvokerDocument parse(byte[] content) {
        Objects.requireNonNull(content, "content must not be null");
        if (content.length > MAX_CONTENT_BYTES) {
            throw new InvokerReadException(InvokerIssue.error("/",
                    "the file is larger than the " + MAX_CONTENT_BYTES + "-byte limit for an invoker file"));
        }
        Document document = SecureXml.parse(content);
        return new InvokerDocument(XmlFormatDetector.detect(document), document);
    }
}
