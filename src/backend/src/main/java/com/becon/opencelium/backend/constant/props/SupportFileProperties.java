package com.becon.opencelium.backend.constant.props;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "opencelium.support.file")
public class SupportFileProperties {

    @NotBlank
    private String directory = "src/main/resources/support-files";

    @Valid
    @NotNull
    private Limit limit = new Limit();

    public String getDirectory() {
        return directory;
    }

    public void setDirectory(String directory) {
        this.directory = directory;
    }

    public Limit getLimit() {
        return limit;
    }

    public void setLimit(Limit limit) {
        this.limit = limit;
    }

    public static class Limit {

        @Min(0)
        private int success = 1;

        @Min(0)
        private int fail = 5;

        public int getSuccess() {
            return success;
        }

        public void setSuccess(int success) {
            this.success = success;
        }

        public int getFail() {
            return fail;
        }

        public void setFail(int fail) {
            this.fail = fail;
        }
    }
}
