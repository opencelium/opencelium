package io.opencelium.core.setup.mongo;

/**
 * What the detector found on this host before the MongoDB step shows its menu.
 *
 * @param localServer whether a server accepts connections on the local MongoDB port
 */
public record MongoDetection(boolean localServer) {

}
