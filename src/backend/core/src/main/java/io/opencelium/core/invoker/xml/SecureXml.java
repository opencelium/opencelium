package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
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
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;

/**
 * The only place invoker XML is parsed, validated or written.
 *
 * <p>Invoker files come from users, so parsing is locked down against XML attacks: DOCTYPE declarations
 * are refused outright, which rules out external entities (file and network access through XXE) and
 * entity expansion bombs, and nothing is ever fetched from outside the file.
 */
final class SecureXml {

    private static final Pattern XERCES_CODE = Pattern.compile("^cvc-[\\w.\\-]+: ");

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

    /** An empty namespace-aware document to build XML into. */
    static Document newDocument() {
        try {
            return documentBuilderFactory().newDocumentBuilder().newDocument();
        } catch (ParserConfigurationException e) {
            throw new IllegalStateException("the XML parser does not support the required security features", e);
        }
    }

    /** Loads an XML Schema from the classpath. Schemas are thread-safe, so load each one once. */
    static Schema loadSchema(String resource) {
        URL url = SecureXml.class.getResource(resource);
        if (url == null) {
            throw new IllegalStateException("schema resource " + resource + " is missing from the classpath");
        }
        try (InputStream in = url.openStream()) {
            SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
            factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
            factory.setProperty(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setProperty(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            return factory.newSchema(new StreamSource(in, url.toExternalForm()));
        } catch (SAXException | IOException e) {
            throw new IllegalStateException("schema resource " + resource + " could not be loaded", e);
        }
    }

    /**
     * Validates a file against a schema, collecting every violation rather than stopping at the first.
     * The file is validated from its bytes so each problem carries a line and column.
     *
     * @throws InvokerReadException listing every violation, if there are any
     */
    static void validate(Schema schema, byte[] xml) {
        Validator validator = schema.newValidator();
        List<InvokerIssue> errors = new ArrayList<>();
        try {
            validator.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
            validator.setProperty(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            validator.setProperty(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            validator.setErrorHandler(new ErrorHandler() {
                @Override
                public void warning(SAXParseException e) {
                }

                @Override
                public void error(SAXParseException e) {
                    errors.add(InvokerIssue.error(position(e), readable(e.getMessage())));
                }

                @Override
                public void fatalError(SAXParseException e) throws SAXParseException {
                    throw e;
                }
            });
            validator.validate(new StreamSource(new ByteArrayInputStream(xml)));
        } catch (SAXParseException e) {
            errors.add(InvokerIssue.error(position(e), readable(e.getMessage())));
        } catch (SAXException | IOException e) {
            errors.add(InvokerIssue.error("/", "the file could not be validated: " + e.getMessage()));
        }
        if (!errors.isEmpty()) {
            throw new InvokerReadException(InvokerFormat.V6, errors);
        }
    }

    /** Serialises a document as indented UTF-8. */
    static byte[] serialize(Document document) {
        try {
            TransformerFactory factory = TransformerFactory.newInstance();
            factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_STYLESHEET, "");
            Transformer transformer = factory.newTransformer();
            transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
            transformer.setOutputProperty(OutputKeys.INDENT, "yes");
            transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "4");
            document.setXmlStandalone(true);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            transformer.transform(new DOMSource(document), new StreamResult(out));
            return out.toByteArray();
        } catch (TransformerException e) {
            throw new IllegalStateException("an invoker document could not be serialised", e);
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

    /** Strips the validator's internal rule code from a message. */
    private static String readable(String message) {
        String text = message == null ? "the file does not match the invoker schema" : message;
        return XERCES_CODE.matcher(text).replaceFirst("");
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
