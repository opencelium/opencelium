import DefaultHelpImagePath from "@image/entities/connection/default_help_preview.png";
import APIMethodImagePath from "@image/entities/connection/animations/api_methods.png";
import OperatorsImagePath from "@image/entities/connection/animations/operators.png";
import FieldMappingImagePath from "@image/entities/connection/animations/field_mapping.png";
import EnhancementImagePath from "@image/entities/connection/animations/enhancement.png";

const basicsContentData: any = [
  {
    animationTitle: "API methods",
    animationImage: APIMethodImagePath,
    animationName: "apiMethods"
  },
  {
    animationTitle: "Operators",
    animationImage: OperatorsImagePath,
    animationName: "operators"
  }
];

const expertsContentData = [
  {
    animationTitle: "Field mapping",
    animationImage: FieldMappingImagePath,
    animationName: "fieldMapping"
  },
  {
    animationTitle: "Enhancement",
    animationImage: EnhancementImagePath,
    animationName: "enhancement"
  }
];

const advancedContentData = [
  {
    animationTitle: "Webhook",
    animationImage: DefaultHelpImagePath,
    animationName: "webhook"
  }
];

export { basicsContentData, expertsContentData, advancedContentData };
