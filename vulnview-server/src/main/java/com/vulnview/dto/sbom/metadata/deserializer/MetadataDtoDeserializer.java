package com.vulnview.dto.sbom.metadata.deserializer;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vulnview.dto.sbom.component.ComponentDto;
import com.vulnview.dto.sbom.metadata.AuthorDto;
import com.vulnview.dto.sbom.metadata.LifecycleDto;
import com.vulnview.dto.sbom.metadata.MetadataDto;
import com.vulnview.dto.sbom.metadata.PropertyDto;
import com.vulnview.dto.sbom.metadata.ToolDto;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class MetadataDtoDeserializer extends JsonDeserializer<MetadataDto> {

    @Override
    public MetadataDto deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
        ObjectMapper mapper = (ObjectMapper) p.getCodec();
        JsonNode rootNode = mapper.readTree(p);
        
        String timestamp = rootNode.has("timestamp") ? rootNode.get("timestamp").asText() : null;
        
        // Process tools
        List<ToolDto> tools = new ArrayList<>();
        if (rootNode.has("tools")) {
            JsonNode toolsNode = rootNode.get("tools");
            if (toolsNode.isArray()) {
                for (JsonNode toolNode : toolsNode) {
                    ToolDto tool = processToolNode(mapper, toolNode);
                    tools.add(tool);
                }
            } else if (toolsNode.isObject()) {
                ToolDto tool = processToolNode(mapper, toolsNode);
                tools.add(tool);
            }
        }
        
        // Process other fields as normal
        List<AuthorDto> authors = new ArrayList<>();
        if (rootNode.has("authors") && rootNode.get("authors").isArray()) {
            for (JsonNode authorNode : rootNode.get("authors")) {
                authors.add(mapper.treeToValue(authorNode, AuthorDto.class));
            }
        }
        
        List<LifecycleDto> lifecycles = new ArrayList<>();
        if (rootNode.has("lifecycles") && rootNode.get("lifecycles").isArray()) {
            for (JsonNode lifecycleNode : rootNode.get("lifecycles")) {
                lifecycles.add(mapper.treeToValue(lifecycleNode, LifecycleDto.class));
            }
        }
        
        ComponentDto component = rootNode.has("component") ? 
                mapper.treeToValue(rootNode.get("component"), ComponentDto.class) : null;
        
        List<PropertyDto> properties = new ArrayList<>();
        if (rootNode.has("properties") && rootNode.get("properties").isArray()) {
            for (JsonNode propertyNode : rootNode.get("properties")) {
                properties.add(mapper.treeToValue(propertyNode, PropertyDto.class));
            }
        }
        
        return MetadataDto.builder()
                .timestamp(timestamp)
                .tools(tools)
                .authors(authors)
                .lifecycles(lifecycles)
                .component(component)
                .properties(properties)
                .build();
    }
    
    private ToolDto processToolNode(ObjectMapper mapper, JsonNode toolNode) throws JsonProcessingException {
        String vendor = toolNode.has("vendor") ? toolNode.get("vendor").asText() : null;
        String name = toolNode.has("name") ? toolNode.get("name").asText() : null;
        String version = toolNode.has("version") ? toolNode.get("version").asText() : null;
        
        return ToolDto.builder()
                .vendor(vendor)
                .name(name)
                .version(version)
                .build();
    }
} 