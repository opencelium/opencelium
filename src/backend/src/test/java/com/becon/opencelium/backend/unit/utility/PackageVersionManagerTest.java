package com.becon.opencelium.backend.unit.utility;

import com.becon.opencelium.backend.application.entity.AvailableUpdate;
import com.becon.opencelium.backend.utility.PackageVersionManager;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

class PackageVersionManagerTest {

    @Test
    void compareVersionsReturnsZeroWhenVersionsAreEqual() {
        int result = PackageVersionManager.compareVersions("1.2.3", "1.2.3");

        assertThat(result).isZero();
    }

    @Test
    void compareVersionsReturnsNegativeWhenFirstMajorIsLower() {
        int result = PackageVersionManager.compareVersions("1.0.0", "2.0.0");

        assertThat(result).isNegative();
    }

    @Test
    void compareVersionsReturnsPositiveWhenFirstPatchIsHigher() {
        int result = PackageVersionManager.compareVersions("1.0.5", "1.0.4");

        assertThat(result).isPositive();
    }

    @Test
    void compareVersionsReturnsPositiveWhenLongerVersionHasNonZeroTail() {
        int result = PackageVersionManager.compareVersions("1.0.1", "1");

        assertThat(result).isPositive();
    }

    @Test
    void compareVersionsReturnsZeroWhenShorterIsZeroPaddedEqual() {
        int result = PackageVersionManager.compareVersions("1.0.0", "1");

        assertThat(result).isZero();
    }

    @Test
    void compareVersionsReturnsPositiveWhenSecondMinorSegmentIsNumericallyHigher() {
        int result = PackageVersionManager.compareVersions("1.10.0", "1.9.0");

        assertThat(result).isPositive();
    }

    @Test
    void compareVersionsThrowsNumberFormatExceptionWhenSegmentIsNotNumeric() {
        assertThatThrownBy(() -> PackageVersionManager.compareVersions("1.x.0", "1.0.0"))
                .isInstanceOf(NumberFormatException.class);
    }

    @Test
    void compareVersionsReturnsNegativeWhenMinorIsLowerEvenIfOtherHasMoreSegments() {
        int result = PackageVersionManager.compareVersions("4.4", "4.5.1");

        assertThat(result).isNegative();
    }

    @Test
    void compareVersionsReturnsZeroWhenFirstArgumentHasLeadingWhitespace() {
        int result = PackageVersionManager.compareVersions(" 1.2.3", "1.2.3");

        assertThat(result).isZero();
    }

    @Test
    void compareVersionsReturnsZeroWhenFirstArgumentHasTrailingWhitespace() {
        int result = PackageVersionManager.compareVersions("1.2.3 ", "1.2.3");

        assertThat(result).isZero();
    }

    @Test
    void parseVersionReturnsIntegerSegmentsWhenInputIsDotSeparated() {
        List<Integer> result = PackageVersionManager.parseVersion("1.2.3");

        assertThat(result).containsExactly(1, 2, 3);
    }

    @Test
    void parseVersionReturnsSingleElementListWhenNoDots() {
        List<Integer> result = PackageVersionManager.parseVersion("7");

        assertThat(result).containsExactly(7);
    }

    @Test
    void parseVersionReturnsIntegerSegmentsWhenSegmentsHaveMultipleDigits() {
        List<Integer> result = PackageVersionManager.parseVersion("10.20.30");

        assertThat(result).containsExactly(10, 20, 30);
    }

    @Test
    void parseVersionThrowsNumberFormatExceptionWhenSegmentIsNotNumeric() {
        assertThatThrownBy(() -> PackageVersionManager.parseVersion("1.x.3"))
                .isInstanceOf(NumberFormatException.class);
    }

    @Test
    void parseVersionReturnsIntegerSegmentsWhenInputHasLeadingWhitespace() {
        List<Integer> result = PackageVersionManager.parseVersion(" 1.2.3");

        assertThat(result).containsExactly(1, 2, 3);
    }

    @Test
    void parseVersionReturnsIntegerSegmentsWhenInputHasTrailingWhitespace() {
        List<Integer> result = PackageVersionManager.parseVersion("1.2.3 ");

        assertThat(result).containsExactly(1, 2, 3);
    }

    @Test
    void extractVersionOfJarFileReturnsVersionWhenFileNameIsStandard() {
        String result = PackageVersionManager.extractVersionOfJarFile("opencelium.backend-1.2.3.jar");

        assertThat(result).isEqualTo("1.2.3");
    }

    @Test
    void extractVersionOfJarFileUsesLastDotWhenVersionContainsMultipleDots() {
        String result = PackageVersionManager.extractVersionOfJarFile("opencelium.backend-1.2.3.4.jar");

        assertThat(result).isEqualTo("1.2.3.4");
    }

    @Test
    void extractVersionOfJarFileThrowsStringIndexOutOfBoundsExceptionWhenFileNameHasNoExtension() {
        assertThatThrownBy(() -> PackageVersionManager.extractVersionOfJarFile("opencelium.backend-1"))
                .isInstanceOf(StringIndexOutOfBoundsException.class);
    }

    @Test
    void getPackageVersionsReturnsEmptyListWhenInputIsEmpty() {
        List<AvailableUpdate> result = PackageVersionManager.getPackageVersions(Collections.emptySet(), "1.0.0");

        assertThat(result).isEmpty();
    }

    @Test
    void getPackageVersionsStripsOcPrefixAndZipSuffixWhenNamesAreWrapped() {
        List<AvailableUpdate> result = PackageVersionManager.getPackageVersions(Set.of("oc_1.0.0.zip"), "1.0.0");

        assertThat(result)
                .extracting(AvailableUpdate::getVersion)
                .containsExactly("1.0.0");
    }

    @Test
    void getPackageVersionsAssignsCurrentStatusWhenVersionEqualsCurrent() {
        List<AvailableUpdate> result = PackageVersionManager.getPackageVersions(Set.of("oc_1.0.0.zip"), "1.0.0");

        assertThat(result)
                .extracting(AvailableUpdate::getStatus)
                .containsExactly("current");
    }

    @Test
    void getPackageVersionsAssignsOldStatusWhenAllVersionsAreBelowCurrent() {
        List<AvailableUpdate> result = PackageVersionManager.getPackageVersions(
                Set.of("oc_0.9.0.zip", "oc_0.8.0.zip"), "1.0.0");

        assertThat(result)
                .extracting(AvailableUpdate::getStatus)
                .containsOnly("old");
    }

    @Test
    void getPackageVersionsMarksFirstHigherAsAvailableWhenMultipleAreNewer() {
        List<AvailableUpdate> result = PackageVersionManager.getPackageVersions(
                Set.of("oc_1.2.0.zip", "oc_1.1.0.zip", "oc_2.0.0.zip"), "1.0.0");

        assertThat(result)
                .extracting(AvailableUpdate::getVersion, AvailableUpdate::getStatus)
                .containsExactly(
                        tuple("1.1.0", "available"),
                        tuple("1.2.0", "not available"),
                        tuple("2.0.0", "not available"));
    }

    @Test
    void getPackageVersionsAssignsAllStatusesWhenInputMixesCategories() {
        List<AvailableUpdate> result = PackageVersionManager.getPackageVersions(
                Set.of("oc_0.9.0.zip", "oc_1.0.0.zip", "oc_1.1.0.zip", "oc_1.2.0.zip"), "1.0.0");

        assertThat(result)
                .extracting(AvailableUpdate::getVersion, AvailableUpdate::getStatus)
                .containsExactly(
                        tuple("0.9.0", "old"),
                        tuple("1.0.0", "current"),
                        tuple("1.1.0", "available"),
                        tuple("1.2.0", "not available"));
    }

    @Test
    void getPackageVersionsReturnsAscendingOrderWhenVersionsAreUnsorted() {
        List<AvailableUpdate> result = PackageVersionManager.getPackageVersions(
                Set.of("oc_1.10.0.zip", "oc_1.9.0.zip", "oc_1.2.0.zip"), "1.0.0");

        assertThat(result)
                .extracting(AvailableUpdate::getVersion)
                .containsExactly("1.2.0", "1.9.0", "1.10.0");
    }
}
