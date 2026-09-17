package io.opencelium.core.invoker;

import io.opencelium.common.invoker.Invoker;

/**
 * Turns an invoker into the contents of a file in the current format.
 *
 * <h2>Contract</h2>
 * <ul>
 *   <li>The output is always in the current format ({@link InvokerFormat#V6}), whatever format the
 *       invoker was originally read from. Writing is how an upgraded invoker becomes a current file.</li>
 *   <li>Reading the output with an {@link InvokerReader} gives back an equal invoker.</li>
 *   <li>The output is deterministic: the same invoker always produces the same bytes.</li>
 *   <li>Implementations are thread-safe.</li>
 * </ul>
 *
 * <p>Obtain one by injection. The XML implementation is {@code XmlInvokerWriter}.
 */
public interface InvokerWriter {

    /**
     * Writes one invoker.
     *
     * @return the file's bytes
     */
    byte[] write(Invoker invoker);
}
