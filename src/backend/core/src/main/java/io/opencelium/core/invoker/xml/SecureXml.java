package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import org.w3c.dom.Document;
import org.xml.sax.ErrorHandler;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Objects;

/**
 * The only place invoker XML is parsed.
 *
 * <p>Invoker files come from users, so parsing is locked down against XML attacks: DOCTYPE declarations
 * are refused outright, which rules out external entities (file and network access through XXE) and
 * entity expansion bombs, and nothing is ever fetched from outside the file.
 */
final class SecureXml {

    private SecureXml() {
    }

    /**
     * Parses a file into a namespace-aware DOM without validating it. Comments are dropped.
     *
     * @throws InvokerReadException if the bytes are not well-formed XML, or declare a DOCTYPE
     */
    static Document parse(byte[] xml) {
        Objects.requireNonNull(xml, "xml must not be null");
        try {
            DocumentBuilder builder = documentBuilderFactory().newDocumentBuilder();
            builder.setErrorHandler(new FailOnError());
            return builder.parse(new ByteArrayInputStream(xml));
        } catch (SAXParseException e) {
            String message = e.getMessage() != null && e.getMessage().contains("DOCTYPE")
                    ? "DOCTYPE declarations are not allowed in invoker files"
                    : "not well-formed XML: " + e.getMessage();
            throw new InvokerReadException(InvokerIssue.error(position(e), message));
        } catch (SAXException | IOException e) {
            throw new InvokerReadException(InvokerIssue.error("/", "the file could not be read as XML: " + e.getMessage()));
        } catch (ParserConfigurationException e) {
            throw new IllegalStateException("the XML parser does not support the required security features", e);
        }
    }

    private static DocumentBuilderFactory documentBuilderFactory() throws ParserConfigurationException {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setIgnoringComments(true);
        factory.setXIncludeAware(false);
        factory.setExpandEntityReferences(false);
        factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
        factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
        factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
        return factory;
    }

    private static String position(SAXParseException e) {
        return e.getLineNumber() > 0
                ? "line " + e.getLineNumber() + ", column " + e.getColumnNumber()
                : "/";
    }

    private static final class FailOnError implements ErrorHandler {

        @Override
        public void warning(SAXParseException e) {
        }

        @Override
        public void error(SAXParseException e) throws SAXParseException {
            throw e;
        }

        @Override
        public void fatalError(SAXParseException e) throws SAXParseException {
            throw e;
        }
    }
}
