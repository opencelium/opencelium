package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import io.opencelium.core.invoker.InvokerReader;
import io.opencelium.core.invoker.ReadResult;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;

/**
 * Reads invoker files in XML: {@link XmlInvokerParser} turns the bytes into a document of a known
 * format, and the reader for that format maps it to an invoker.
 *
 * <p>5.x files are recognised but cannot be read yet; that arrives with the reader that upgrades them.
 *
 * <p>Depend on {@link InvokerReader} rather than on this class; see it for the contract.
 */
@Component
public final class XmlInvokerReader implements InvokerReader {

    /** The classpath location of the schema for the current format. */
    public static final String SCHEMA_RESOURCE = "/invoker-6.0.xsd";

    private final XmlInvokerParser parser;
    private final InvokerV6Reader v6Reader;

    public XmlInvokerReader(XmlInvokerParser parser) {
        this.parser = parser;
        this.v6Reader = new InvokerV6Reader(SecureXml.loadSchema(SCHEMA_RESOURCE));
    }

    @Override
    public ReadResult read(byte[] content) {
        Objects.requireNonNull(content, "content must not be null");
        InvokerDocument file = parser.parse(content);
        return switch (file.format()) {
            case V6 -> new ReadResult(file.format(), v6Reader.read(file.document(), content), List.of());
            case LEGACY_V5 -> throw new InvokerReadException(InvokerFormat.LEGACY_V5, List.of(InvokerIssue.error(
                    "/invoker", "5.x invoker files cannot be read yet; save the file in format 6.0")));
        };
    }
}
