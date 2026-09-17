package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Recognises the format generation of an invoker file from the {@code version} attribute of its root
 * element.
 *
 * <p>Invoker files use no XML namespace. The version attribute is the discriminator instead: 5.x files
 * never had one, so a root without it is a 5.x file, and a root with it names the format version the
 * file was written in.
 */
final class XmlFormatDetector {

    /** The major format version this reader understands. */
    static final int CURRENT_MAJOR_VERSION = 6;

    private static final Pattern VERSION = Pattern.compile("(\\d+)(?:\\.\\d+)?");

    private XmlFormatDetector() {
    }

    /**
     * @throws InvokerReadException if the root is not an {@code invoker} element, declares a namespace,
     *                              or states a version this reader does not support
     */
    static InvokerFormat detect(Document document) {
        Element root = document.getDocumentElement();
        if (!"invoker".equals(root.getLocalName())) {
            throw new InvokerReadException(InvokerIssue.error("/" + root.getNodeName(),
                    "the root element must be <invoker>, but this file starts with <" + root.getNodeName() + ">"));
        }
        if (root.getNamespaceURI() != null) {
            throw new InvokerReadException(InvokerIssue.error("/invoker", "invoker files do not use an XML "
                    + "namespace; remove the namespace '" + root.getNamespaceURI() + "' from <invoker>"));
        }
        if (!root.hasAttribute("version")) {
            return InvokerFormat.LEGACY_V5;
        }
        String version = root.getAttribute("version").trim();
        Matcher matcher = VERSION.matcher(version);
        if (!matcher.matches()) {
            throw new InvokerReadException(InvokerIssue.error("/invoker", "'" + version + "' is not a format "
                    + "version; expected " + CURRENT_MAJOR_VERSION + ".0"));
        }
        int major = Integer.parseInt(matcher.group(1));
        if (major == CURRENT_MAJOR_VERSION) {
            return InvokerFormat.V6;
        }
        String hint = major > CURRENT_MAJOR_VERSION
                ? "it was written for a newer version of OpenCelium"
                : "a 5.x file has no version attribute, and the current version is " + CURRENT_MAJOR_VERSION + ".0";
        throw new InvokerReadException(InvokerIssue.error("/invoker",
                "unsupported invoker format version '" + version + "'; " + hint));
    }
}
