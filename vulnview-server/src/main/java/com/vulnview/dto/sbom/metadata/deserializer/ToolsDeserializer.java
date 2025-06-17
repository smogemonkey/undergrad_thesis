package com.vulnview.dto.sbom.metadata.deserializer;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vulnview.dto.sbom.metadata.ToolDto;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ToolsDeserializer extends JsonDeserializer<List<ToolDto>> {

    @Override
    public List<ToolDto> deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) 
            throws IOException, JsonProcessingException {
        
        ObjectMapper mapper = (ObjectMapper) jsonParser.getCodec();
        JsonNode node = mapper.readTree(jsonParser);
        
        List<ToolDto> tools = new ArrayList<>();
        
        if (node.isArray()) {
            // Handle array format
            for (JsonNode toolNode : node) {
                ToolDto tool = mapper.treeToValue(toolNode, ToolDto.class);
                tools.add(tool);
            }
        } else if (node.isObject()) {
            // Handle single object format
            ToolDto tool = mapper.treeToValue(node, ToolDto.class);
            tools.add(tool);
        }
        
        return tools;
    }
} 