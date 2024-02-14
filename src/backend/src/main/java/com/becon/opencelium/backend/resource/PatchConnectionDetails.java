package com.becon.opencelium.backend.resource;

import java.util.ArrayList;
import java.util.List;

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

    public static class PatchOperationDetail {
        private boolean methodDeleted;
        private boolean methodModified;
        private boolean methodAdded;
        private boolean methodReplaced;
        private boolean replacedMethodList;
        private int indexOfMethod;
        private boolean operatorDeleted;
        private boolean operatorModified;
        private boolean operatorAdded;
        private boolean operatorReplaced;
        private boolean replacedOperatorList;
        private int indexOfOperator;
        private boolean enhancementDeleted;
        private boolean enhancementModified;
        private boolean enhancementAdded;
        private boolean enhancementReplaced;
        private boolean replacedEnhancementList;
        private int indexOfEnhancement;
        private boolean from;

        public boolean isItEnh() {
            return enhancementAdded
                    || enhancementModified
                    || enhancementReplaced
                    || enhancementDeleted
                    || replacedEnhancementList;
        }

        public boolean isItMethod() {
            return methodAdded
                    || methodModified
                    || methodReplaced
                    || methodDeleted
                    || replacedMethodList;
        }

        public boolean isItOperator() {
            return operatorAdded
                    || operatorModified
                    || operatorReplaced
                    || operatorDeleted
                    || replacedOperatorList;
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

        public boolean isMethodModified() {
            return methodModified;
        }

        public void setMethodModified(boolean methodModified) {
            this.methodModified = methodModified;
        }

        public boolean isOperatorModified() {
            return operatorModified;
        }

        public void setOperatorModified(boolean operatorModified) {
            this.operatorModified = operatorModified;
        }

        public boolean isEnhancementModified() {
            return enhancementModified;
        }

        public void setEnhancementModified(boolean enhancementModified) {
            this.enhancementModified = enhancementModified;
        }

        public boolean isMethodReplaced() {
            return methodReplaced;
        }

        public void setMethodReplaced(boolean methodReplaced) {
            this.methodReplaced = methodReplaced;
        }

        public boolean isReplacedMethodList() {
            return replacedMethodList;
        }

        public void setReplacedMethodList(boolean replacedMethodList) {
            this.replacedMethodList = replacedMethodList;
        }

        public boolean isOperatorReplaced() {
            return operatorReplaced;
        }

        public void setOperatorReplaced(boolean operatorReplaced) {
            this.operatorReplaced = operatorReplaced;
        }

        public boolean isReplacedOperatorList() {
            return replacedOperatorList;
        }

        public void setReplacedOperatorList(boolean replacedOperatorList) {
            this.replacedOperatorList = replacedOperatorList;
        }

        public boolean isEnhancementReplaced() {
            return enhancementReplaced;
        }

        public void setEnhancementReplaced(boolean enhancementReplaced) {
            this.enhancementReplaced = enhancementReplaced;
        }

        public boolean isReplacedEnhancementList() {
            return replacedEnhancementList;
        }

        public void setReplacedEnhancementList(boolean replacedEnhancementList) {
            this.replacedEnhancementList = replacedEnhancementList;
        }

        public boolean isFrom() {
            return from;
        }

        public void setFrom(boolean from) {
            this.from = from;
        }
    }

}
