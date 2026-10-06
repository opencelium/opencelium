package io.opencelium.core.invoker;

/**
 * Turns the contents of an invoker file into an invoker.
 *
 * <pre>{@code
 * ReadResult result = reader.read(bytes);
 * result.invoker();    // always valid
 * result.upgraded();   // true when the file was in an older format
 * result.issues();     // what changed while upgrading, for the author to review
 * }</pre>
 *
 * <h2>Contract</h2>
 * <ul>
 *   <li>Every format generation the implementation supports is accepted; older generations are upgraded
 *       to the current model, and each change is reported in {@link ReadResult#issues()}.</li>
 *   <li>Either a valid invoker is returned or {@link InvokerReadException} is thrown. There is no third
 *       outcome: no {@code null}, no partially read invoker.</li>
 *   <li>On failure, every problem found is reported, not only the first, each with a location in the file.</li>
 *   <li>Reading never accesses the file system or the network, and content over the implementation's
 *       size limit is rejected before it is parsed, so it is safe for files uploaded by users.</li>
 *   <li>Implementations are thread-safe; one instance can serve concurrent requests.</li>
 * </ul>
 *
 * <p>Obtain one by injection. The XML implementation is {@code XmlInvokerReader}.
 */
public interface InvokerReader {

    /**
     * Reads one invoker file.
     *
     * @param content the file's bytes
     * @return the invoker, the format it was written in, and any changes made while upgrading
     * @throws InvokerReadException if the content cannot become a valid invoker; it lists every problem
     */
    ReadResult read(byte[] content);
}
