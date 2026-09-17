package io.opencelium.core.invoker;

/**
 * The generations of the invoker file format.
 *
 * <p>An {@link InvokerReader} recognises the generation of every file it reads and reports it in
 * {@link ReadResult#format()}; files in an older generation are upgraded to the current model.
 */
public enum InvokerFormat {

    /** OpenCelium 5.x. Read and upgraded; never written. */
    LEGACY_V5,

    /** The current format. */
    V6
}
