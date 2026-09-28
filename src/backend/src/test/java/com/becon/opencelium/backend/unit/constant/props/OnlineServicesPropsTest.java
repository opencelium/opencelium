package com.becon.opencelium.backend.unit.constant.props;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.constant.props.OnlineServicesProps;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link OnlineServicesProps#isServiceActive()}.
 *
 * The contract: online services are enabled unless the operator explicitly
 * sets {@code opencelium.online-services.active: false}. A commented-out or
 * removed key binds to {@code null} and therefore means enabled.
 *
 * Run with: ./gradlew test --tests "*.OnlineServicesPropsTest"
 */
@DisplayName("OnlineServicesProps — master switch defaults")
class OnlineServicesPropsTest {

    @Test
    void isServiceActiveReturnsTrueWhenActiveIsNull() {
        OnlineServicesProps props = new OnlineServicesProps();

        assertThat(props.isServiceActive()).isTrue();
    }

    @Test
    void isServiceActiveReturnsTrueWhenActiveIsTrue() {
        OnlineServicesProps props = new OnlineServicesProps();
        props.setActive(true);

        assertThat(props.isServiceActive()).isTrue();
    }

    @Test
    void isServiceActiveReturnsFalseWhenActiveIsFalse() {
        OnlineServicesProps props = new OnlineServicesProps();
        props.setActive(false);

        assertThat(props.isServiceActive()).isFalse();
    }
}
