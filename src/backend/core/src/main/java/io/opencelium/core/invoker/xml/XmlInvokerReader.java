package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import io.opencelium.core.invoker.ReadResult;
import io.opencelium.core.invoker.InvokerReader;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;

/**
 * Reads invoker files in XML, in every format generation: current v6 files are validated against
 * {@code invoker-6.0.xsd}, and 5.x files are upgraded.
 *
 * <p>Depend on {@link InvokerReader} rather than on this class; see it for the contract.
 */
@Component
public final class XmlInvokerReader implements InvokerReader {

    /**
     * The largest file accepted. The largest known real invoker is well under one megabyte; the limit
     * stops a crafted upload from exhausting memory before parsing even starts.
     */
    public static final int MAX_CONTENT_BYTES = 10 * 1024 * 1024;

    /** The classpath location of the schema for the current format. */
    public static final String SCHEMA_RESOURCE = "/invoker-6.0.xsd";

    private final InvokerV6Reader v6Reader;
    private final LegacyInvokerReader legacyReader;

    public XmlInvokerReader() {
        this.v6Reader = new InvokerV6Reader(SecureXml.loadSchema(SCHEMA_RESOURCE));
        this.legacyReader = new LegacyInvokerReader();
    }

    @Override
    public ReadResult read(byte[] content) {
        Objects.requireNonNull(content, "content must not be null");
        if (content.length > MAX_CONTENT_BYTES) {
            throw new InvokerReadException(InvokerIssue.error("/",
                    "the file is larger than the " + MAX_CONTENT_BYTES + "-byte limit for an invoker file"));
        }
        var document = SecureXml.parse(content);
        InvokerFormat format = XmlFormatDetector.detect(document);
        try {
            return switch (format) {
                case V6 -> new ReadResult(format, v6Reader.read(document, content), List.of());
                case LEGACY_V5 -> legacyReader.read(document);
            };
        } catch (InvokerReadException e) {
            throw e.format().isPresent() ? e : new InvokerReadException(format, e.issues());
        }
    }
}
