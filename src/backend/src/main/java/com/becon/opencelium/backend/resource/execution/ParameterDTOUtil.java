package com.becon.opencelium.backend.resource.execution;

import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;

import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
import java.util.stream.Collectors;

public class ParameterDTOUtil {

    private final static String EMPTY_STYLE_VALUE_ERROR = "PramStyle of %s should not be empty";

    public static ParameterDTO copy(ParameterDTO parameter) {
        ParameterDTO result = new ParameterDTO();
        result.setName(parameter.getName());
        result.setIn(parameter.getIn());
        result.setStyle(parameter.getStyle());
        result.setExplode(parameter.isExplode());
        result.setContent(parameter.getContent());
        result.setSchema(SchemaDTOUtil.copy(parameter.getSchema()));

        return result;
    }

    // conversions comply with oas v3.1.0
    public static String toString(ParameterDTO parameter) {
        if (parameter == null) {
            return null;
        } else if (parameter.getStyle() == null) {
            throw new IllegalStateException("Param style must be supplied to ParameterDTO");
        }

        return switch (parameter.getStyle()) {
            case MATRIX -> constructMatrix(parameter);
            case LABEL -> constructLabel(parameter);
            case FORM -> constructForm(parameter);
            case SIMPLE -> constructSimple(parameter);
            case SPACE_DELIMITED -> constructSpaceDelimited(parameter);
            case PIPE_DELIMITED -> constructPipeDelimited(parameter);
            case DEEP_OBJECT -> constructDeepObject(parameter);
        };
    }

    private static String constructMatrix(ParameterDTO parameter) {
        // parameter with style MATRIX comes in [PATH] location
        validateParamStyleAndLocationsPair(ParamStyle.MATRIX, parameter.getIn(), List.of(ParamLocation.PATH));

        SchemaDTO schema = parameter.getSchema();

        // parameter with style MATRIX can have [primitive, array, object] type
        if (schema.getType() == DataType.OBJECT) {
            Map<String, SchemaDTO> properties = schema.getProperties();

            // for empty or null object: ... => ;paramName
            if (CollectionUtils.isEmpty(properties)) {
                return ";" + parameter.getName();
            }

            // for paramName = color, paramValue = {"R": 100, "G": 200, "B": 150}
            // if 'explode' = false: ... => ;color=R,100,G,200,B,150
            // if 'explode' = true : ... => ;R=100;G=200;B=150
            String separator = parameter.isExplode() ? "=" : ",";
            String delimiter = parameter.isExplode() ? ";" : ",";
            String prefix = parameter.isExplode() ? ";" : ";" + parameter.getName() + "=";

            return mapToString(properties, prefix, separator, delimiter);
        }

        if (schema.getType() == DataType.ARRAY) {
            List<SchemaDTO> items = schema.getItems();

            // for empty or null array: ... => ;paramName
            if (CollectionUtils.isEmpty(items)) {
                return ";" + parameter.getName();
            }

            // for paramName = color, paramValue = ["blue","black","brown"]
            // if 'explode' = false: ... => ;color=blue,black,brown
            // if 'explode' = true : ... => ;color=blue;color=black;color=brown
            String delimiter = parameter.isExplode() ? ";" + parameter.getName() + "=" : ",";
            String prefix = ";" + parameter.getName() + "=";

            return listToString(items, prefix, delimiter);
        }

        String value = schema.getValue();

        // for primitive types (value of 'explode' does not have any effect):
        // if paramValue is empty    : ... => ;paramName=
        // if paramValue is not empty: ... => ;paramName=paramValue
        return ObjectUtils.isEmpty(value) ?
                ";" + parameter.getName() :
                ";" + parameter.getName() + "=" + value;
    }

    private static String constructLabel(ParameterDTO parameter) {
        // parameter with style LABEL comes in [PATH] location
        validateParamStyleAndLocationsPair(ParamStyle.LABEL, parameter.getIn(), List.of(ParamLocation.PATH));

        SchemaDTO schema = parameter.getSchema();

        // parameter with style LABEL can have [primitive, array, object] type
        final String prefix = ".";

        if (schema.getType() == DataType.OBJECT) {
            Map<String, SchemaDTO> properties = schema.getProperties();

            // for empty or null object: ... => .
            if (CollectionUtils.isEmpty(properties)) {
                return prefix;
            }

            // for paramName = color, paramValue = {"R": 100, "G": 200, "B": 150}
            // if 'explode' = false: ... => .R.100.G.200.B.150
            // if 'explode' = true : ... => .R=100.G=200.B=150
            String separator = parameter.isExplode() ? "=" : ".";

            return mapToString(properties, prefix, separator, ".");
        }

        if (schema.getType() == DataType.ARRAY) {
            List<SchemaDTO> items = schema.getItems();

            // for empty or null array: ... => .
            if (CollectionUtils.isEmpty(items)) {
                return prefix;
            }

            // for paramName = color, paramValue = ["blue","black","brown"]
            // if 'explode' = false: ... => .blue.black.brown
            // if 'explode' = true : ... => .blue.black.brown
            return listToString(items, prefix, ".");
        }

        String value = schema.getValue();

        // for primitive types (value of 'explode' does not have any effect):
        // if paramValue is empty    : ... => .
        // if paramValue is not empty: ... => .paramValue
        return ObjectUtils.isEmpty(value) ? prefix : prefix + value;
    }

    private static String constructForm(ParameterDTO parameter) {
        // parameter with style FORM comes in [QUERY, COOKIE] location
        validateParamStyleAndLocationsPair(ParamStyle.FORM, parameter.getIn(), List.of(ParamLocation.QUERY, ParamLocation.COOKIE));

        SchemaDTO schema = parameter.getSchema();

        // parameter with style FORM can have [primitive, array, object] type
        if (schema.getType() == DataType.OBJECT) {
            Map<String, SchemaDTO> properties = schema.getProperties();

            // for empty or null object: ... => paramName=
            if (CollectionUtils.isEmpty(properties)) {
                return parameter.getName() + "=";
            }

            // for paramName = color, paramValue = {"R": 100, "G": 200, "B": 150}
            // if 'explode' = false: ... => color=R,100,G,200,B,150
            // if 'explode' = true : ... => R=100&G=200&B=150
            String separator = parameter.isExplode() ? "=" : ",";
            String delimiter = parameter.isExplode() ? "&" : ",";
            String prefix = parameter.isExplode() ? "" : parameter.getName() + "=";

            return mapToString(properties, prefix, separator, delimiter);
        }

        if (schema.getType() == DataType.ARRAY) {
            List<SchemaDTO> items = schema.getItems();

            // for empty or null array: ... => paramName=
            if (CollectionUtils.isEmpty(items)) {
                return parameter.getName() + "=";
            }

            // for paramName = color, paramValue = ["blue","black","brown"]
            // if 'explode' = false: ... => color=blue,black,brown
            // if 'explode' = true : ... => color=blue&color=black&color=brown
            String delimiter = parameter.isExplode() ? "&" + parameter.getName() + "=" : ",";
            String prefix = parameter.getName() + "=";

            return listToString(items, prefix, delimiter);
        }

        String value = schema.getValue();

        // for primitive types (value of 'explode' does not have any effect):
        // if paramValue is empty    : ... => paramName=
        // if paramValue is not empty: ... => paramName=paramValue
        return ObjectUtils.isEmpty(value) ? parameter.getName() + "=" : parameter.getName() + "=" + value;
    }

    private static String constructSimple(ParameterDTO parameter) {
        // parameter with style SIMPLE comes in [PATH, HEADER] location
        validateParamStyleAndLocationsPair(ParamStyle.SIMPLE, parameter.getIn(), List.of(ParamLocation.PATH, ParamLocation.HEADER));

        SchemaDTO schema = parameter.getSchema();

        // parameter with style SIMPLE can have [primitive, array, object] type
        if (schema.getType() == DataType.OBJECT) {
            Map<String, SchemaDTO> properties = schema.getProperties();

            // for empty or null object: ... => n/a
            if (CollectionUtils.isEmpty(properties)) {
                throw new IllegalStateException(String.format(EMPTY_STYLE_VALUE_ERROR, ParamStyle.SIMPLE.getStyle()));
            }

            // for paramName = color, paramValue = {"R": 100, "G": 200, "B": 150}
            // if 'explode' = false: ... => R,100,G,200,B,150
            // if 'explode' = true : ... => R=100,G=200,B=150
            String separator = parameter.isExplode() ? "=" : ",";

            return mapToString(properties, "", separator, ",");
        }

        if (schema.getType() == DataType.ARRAY) {
            List<SchemaDTO> items = schema.getItems();

            // for empty or null array: ... => n/a
            if (CollectionUtils.isEmpty(items)) {
                throw new IllegalStateException(String.format(EMPTY_STYLE_VALUE_ERROR, ParamStyle.SIMPLE.getStyle()));
            }

            // for paramName = color, paramValue = ["blue","black","brown"]
            // if 'explode' = false: ... => blue,black,brown
            // if 'explode' = true : ... => blue,black,brown

            return listToString(items, "", ",");
        }

        String value = schema.getValue();

        // for primitive types (value of 'explode' does not have any effect):
        // if paramValue is empty    : ... => n/a
        // if paramValue is not empty: ... => paramValue
        if (ObjectUtils.isEmpty(value)) {
            throw new IllegalStateException(String.format(EMPTY_STYLE_VALUE_ERROR, ParamStyle.SIMPLE.getStyle()));
        }

        return value;
    }

    private static String constructSpaceDelimited(ParameterDTO parameter) {
        // parameter with style SPACE_DELIMITED comes in [QUERY] location
        validateParamStyleAndLocationsPair(ParamStyle.SPACE_DELIMITED, parameter.getIn(), List.of(ParamLocation.QUERY));

        // parameter with style SPACE_DELIMITED could not have 'explode'=true
        if (parameter.isExplode()) {
            throw new IllegalStateException("explode must be false for parameter with type " + ParamStyle.SPACE_DELIMITED.getStyle());
        }

        SchemaDTO schema = parameter.getSchema();

        // parameter with style SPACE_DELIMITED can have [array, object] type
        validateParamStyleAndDataTypesPair(ParamStyle.SPACE_DELIMITED, schema.getType(), List.of(DataType.OBJECT, DataType.ARRAY));

        // define delimiter (= space)
        final String SPACE = "%20";

        if (schema.getType() == DataType.ARRAY) {
            List<SchemaDTO> items = schema.getItems();

            // for empty or null array: ... => n/a
            if (CollectionUtils.isEmpty(items)) {
                throw new IllegalStateException(String.format(EMPTY_STYLE_VALUE_ERROR, ParamStyle.SPACE_DELIMITED.getStyle()));
            }

            // for paramName = color, paramValue = ["blue","black","brown"]
            // if 'explode' = false: ... => blue%20black%20brown
            // if 'explode' = true : ... => n/a

            return listToString(items, "", SPACE);
        }

        // at this point we have left only parameter type object
        Map<String, SchemaDTO> properties = schema.getProperties();

        // for empty or null object: ... => n/a
        if (CollectionUtils.isEmpty(properties)) {
            throw new IllegalStateException(String.format(EMPTY_STYLE_VALUE_ERROR, ParamStyle.SPACE_DELIMITED.getStyle()));
        }

        // for paramName = color, paramValue = {"R": 100, "G": 200, "B": 150}
        // if 'explode' = false: ... => R%20100%20G%20200%20B%20150
        // if 'explode' = true : ... => n/a

        return mapToString(properties, "", SPACE, SPACE);
    }

    private static String constructPipeDelimited(ParameterDTO parameter) {
        // parameter with style PIPE_DELIMITED comes in [QUERY] location
        validateParamStyleAndLocationsPair(ParamStyle.PIPE_DELIMITED, parameter.getIn(), List.of(ParamLocation.QUERY));

        // parameter with style PIPE_DELIMITED could not have 'explode'=true
        if (parameter.isExplode()) {
            throw new IllegalStateException("explode must be false for parameter with type " + ParamStyle.PIPE_DELIMITED.getStyle());
        }

        SchemaDTO schema = parameter.getSchema();

        // parameter with style PIPE_DELIMITED can have [array, object] type
        validateParamStyleAndDataTypesPair(ParamStyle.PIPE_DELIMITED, schema.getType(), List.of(DataType.OBJECT, DataType.ARRAY));

        // define delimiter (= pipe )
        final String PIPE = "|";

        if (schema.getType() == DataType.ARRAY) {
            List<SchemaDTO> items = schema.getItems();

            // for empty or null array: ... => n/a
            if (CollectionUtils.isEmpty(items)) {
                throw new IllegalStateException(String.format(EMPTY_STYLE_VALUE_ERROR, ParamStyle.PIPE_DELIMITED.getStyle()));
            }

            // for paramName = color, paramValue = ["blue","black","brown"]
            // if 'explode' = false: ... => blue|black|brown
            // if 'explode' = true : ... => n/a

            return listToString(items, "", PIPE);
        }

        // at this point we have left only parameter type object
        Map<String, SchemaDTO> properties = schema.getProperties();

        // for empty or null object: ... => n/a
        if (CollectionUtils.isEmpty(properties)) {
            throw new IllegalStateException(String.format(EMPTY_STYLE_VALUE_ERROR, ParamStyle.PIPE_DELIMITED.getStyle()));
        }

        // for paramName = color, paramValue = {"R": 100, "G": 200, "B": 150}
        // if 'explode' = false: ... => R|100|G|200|B|150
        // if 'explode' = true : ... => n/a

        return mapToString(properties, "", PIPE, PIPE);
    }

    private static String constructDeepObject(ParameterDTO parameter) {
        // parameter with style DEEP_OBJECT comes in [QUERY] location
        validateParamStyleAndLocationsPair(ParamStyle.DEEP_OBJECT, parameter.getIn(), List.of(ParamLocation.QUERY));

        // parameter with style DEEP_OBJECT could not have 'explode'=false
        if (!parameter.isExplode()) {
            throw new IllegalStateException("explode must be true for parameter with type " + ParamStyle.DEEP_OBJECT.getStyle());
        }

        SchemaDTO schema = parameter.getSchema();

        // parameter with style DEEP_OBJECT can have [object] type
        validateParamStyleAndDataTypesPair(ParamStyle.DEEP_OBJECT, schema.getType(), List.of(DataType.OBJECT));

        Map<String, SchemaDTO> properties = schema.getProperties();

        // for empty or null object: ... => n/a
        if (CollectionUtils.isEmpty(properties)) {
            throw new IllegalStateException("Empty object could not be converted using ParamStyle of DEEP_OBJECT");
        }

        // for paramName = color, paramValue = {"F1": 100, "F2": [200, 300], "F3": {"F31": 400}}
        // if 'explode' = false: ... => n/a
        // if 'explode' = true : ... => color[F1]=100&color[F2][0]=200&color[F2][1]=300&color[F3][F31]=400

        return properties.entrySet().stream()
                .map(entry -> deepObjectToString(parameter.getName() + "[" + entry.getKey() + "]", entry.getValue()))
                .collect(Collectors.joining("&"));
    }

    private static String deepObjectToString(String pointer, SchemaDTO schema) {
        DataType type = schema.getType();

        if (type == DataType.OBJECT) {
            Map<String, SchemaDTO> properties = schema.getProperties();

            // for empty or null object: ... => n/a
            if (CollectionUtils.isEmpty(properties)) {
                throw new IllegalStateException("Empty object could not be converted using ParamStyle of DEEP_OBJECT");
            }

            StringJoiner object = new StringJoiner("&");
            for (Map.Entry<String, SchemaDTO> property : schema.getProperties().entrySet()) {
                // continue entering deep by appending property name to 'pointer'
                object.add(deepObjectToString(pointer + "[" + property.getKey() + "]", property.getValue()));
            }

            return object.toString();
        }

        if (schema.getType() == DataType.ARRAY) {
            List<SchemaDTO> items = schema.getItems();

            // for empty or null array: ... => n/a
            if (CollectionUtils.isEmpty(items)) {
                throw new IllegalStateException("Empty array could not be converted using ParamStyle of DEEP_OBJECT");
            }

            StringJoiner array = new StringJoiner("&");
            int index = 0;
            for (SchemaDTO item : items) {
                // continue entering deep by appending element index to 'pointer'
                array.add(deepObjectToString(pointer + "[" + index + "]", item));
                index++;
            }

            return array.toString();
        }

        // at this point we have only primitives, stop recursion by returning pointer=schemaValue
        if (schema.getValue() == null) {
            throw new IllegalStateException("Null value could not be used in ParamStyle of DEEP_OBJECT");
        }

        return pointer + "=" + schema.getValue();
    }

    private static String listToString(List<SchemaDTO> items, String prefix, String delimiter) {
        return prefix + items.stream()
                .map(SchemaDTO::getValue)
                .collect(Collectors.joining(delimiter));
    }

    private static String mapToString(Map<String, SchemaDTO> properties, String prefix, String separator, String delimiter) {
        return prefix + properties.entrySet().stream()
                .map(entry -> entry.getKey() + separator + entry.getValue().getValue())
                .collect(Collectors.joining(delimiter));
    }

    private static void validateParamStyleAndLocationsPair(ParamStyle currentStyle, ParamLocation currentLocation, List<ParamLocation> validLocations) {
        if(validLocations.contains(currentLocation)) {
            return;
        }

        String locations = validLocations.stream().map(ParamLocation::getLocation).collect(Collectors.joining(", "));
        throw new IllegalStateException(String.format("ParamStyle of '%s' is used only in [%s]", currentStyle.getStyle(), locations));
    }

    private static void validateParamStyleAndDataTypesPair(ParamStyle currentStyle, DataType currentType, List<DataType> validTypes) {
        if(validTypes.contains(currentType)) {
            return;
        }

        String dataTypes = validTypes.stream().map(DataType::getType).collect(Collectors.joining(", "));
        throw new IllegalStateException(String.format("ParamStyle of '%s' is used only with [%s] types", currentStyle.getStyle(), dataTypes));
    }
}
