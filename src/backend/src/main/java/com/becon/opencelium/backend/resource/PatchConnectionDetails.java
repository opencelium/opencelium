package com.becon.opencelium.backend.resource;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Predicate;

public class PatchConnectionDetails {
    private List<PatchOperationDetail> opDetails;

    public PatchConnectionDetails() {
        this.opDetails = new ArrayList<>();
    }

    public List<PatchOperationDetail> getOpDetails() {
        return opDetails;
    }

    public void setOpDetails(List<PatchOperationDetail> opDetails) {
        this.opDetails = opDetails;
    }

    public boolean methodListModified() {
        return someListModified(p -> p.isMethodAdded() || p.isMethodDeleted());
    }

    public boolean operatorListModified() {
        return someListModified(p -> p.isOperatorAdded() || p.isOperatorDeleted());
    }

    public boolean enhancementListModified() {
        return someListModified(p -> p.isEnhancementAdded() || p.isEnhancementDeleted());
    }

    public boolean isArray() {
        return opDetails.size() > 1;
    }

    private boolean someListModified(Predicate<PatchOperationDetail> condition) {
        for (PatchOperationDetail opDetail : opDetails) {
            if (condition.test(opDetail)) {
                return true;
            }
        }
        return false;
    }


    public static class PatchOperationDetail {
        private boolean methodDeleted;
        private boolean operatorDeleted;
        private boolean enhancementDeleted;
        private boolean methodAdded;
        private boolean operatorAdded;
        private boolean enhancementAdded;
        private Integer indexOfMethod;
        private Integer indexOfOperator;
        private Integer indexOfEnhancement;
        private boolean setNullToMethods;
        private boolean setNullToOperators;
        private boolean setNullToEnhancements;

        public boolean isSetNullToMethods() {
            return setNullToMethods;
        }

        public void setSetNullToMethods(boolean setNullToMethods) {
            this.setNullToMethods = setNullToMethods;
        }

        public boolean isSetNullToOperators() {
            return setNullToOperators;
        }

        public void setSetNullToOperators(boolean setNullToOperators) {
            this.setNullToOperators = setNullToOperators;
        }

        public boolean isSetNullToEnhancements() {
            return setNullToEnhancements;
        }

        public void setSetNullToEnhancements(boolean setNullToEnhancements) {
            this.setNullToEnhancements = setNullToEnhancements;
        }

        public boolean isMethodDeleted() {
            return methodDeleted;
        }

        public void setMethodDeleted(boolean methodDeleted) {
            this.methodDeleted = methodDeleted;
        }

        public boolean isOperatorDeleted() {
            return operatorDeleted;
        }

        public void setOperatorDeleted(boolean operatorDeleted) {
            this.operatorDeleted = operatorDeleted;
        }

        public boolean isEnhancementDeleted() {
            return enhancementDeleted;
        }

        public void setEnhancementDeleted(boolean enhancementDeleted) {
            this.enhancementDeleted = enhancementDeleted;
        }

        public boolean isMethodAdded() {
            return methodAdded;
        }

        public void setMethodAdded(boolean methodAdded) {
            this.methodAdded = methodAdded;
        }

        public boolean isOperatorAdded() {
            return operatorAdded;
        }

        public void setOperatorAdded(boolean operatorAdded) {
            this.operatorAdded = operatorAdded;
        }

        public boolean isEnhancementAdded() {
            return enhancementAdded;
        }

        public void setEnhancementAdded(boolean enhancementAdded) {
            this.enhancementAdded = enhancementAdded;
        }

        public Integer getIndexOfMethod() {
            return indexOfMethod;
        }

        public void setIndexOfMethod(Integer indexOfMethod) {
            this.indexOfMethod = indexOfMethod;
        }

        public Integer getIndexOfOperator() {
            return indexOfOperator;
        }

        public void setIndexOfOperator(Integer indexOfOperator) {
            this.indexOfOperator = indexOfOperator;
        }

        public Integer getIndexOfEnhancement() {
            return indexOfEnhancement;
        }

        public void setIndexOfEnhancement(Integer indexOfEnhancement) {
            this.indexOfEnhancement = indexOfEnhancement;
        }
    }

}
