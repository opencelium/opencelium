package io.opencelium.core.testsupport;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** A UTC clock that a test sets and moves forward. Replace the application's {@code clock} bean with it. */
public final class MutableClock extends Clock {

	private volatile Instant now;

	public MutableClock(Instant start) {
		this.now = start;
	}

	public void set(Instant instant) {
		now = instant;
	}

	public void advance(Duration duration) {
		now = now.plus(duration);
	}

	@Override
	public Instant instant() {
		return now;
	}

	@Override
	public ZoneId getZone() {
		return ZoneOffset.UTC;
	}

	@Override
	public Clock withZone(ZoneId zone) {
		throw new UnsupportedOperationException("MutableClock is UTC only");
	}

}
