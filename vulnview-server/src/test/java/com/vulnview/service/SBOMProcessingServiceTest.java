package com.vulnview.service;

import com.vulnview.dto.sbom.SBOMUploadResponse;
import com.vulnview.entity.Component;
import com.vulnview.entity.Project;
import com.vulnview.entity.User;
import com.vulnview.repository.BuildRepository;
import com.vulnview.repository.ComponentRepository;
import com.vulnview.repository.DependencyEdgeRepository;
import com.vulnview.repository.PipelineRepository;
import com.vulnview.repository.ProjectRepository;
import com.vulnview.repository.SbomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SBOMProcessingServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ComponentRepository componentRepository;

    @Mock
    private UserService userService;

    @Mock
    private BuildRepository buildRepository;

    @Mock
    private PipelineRepository pipelineRepository;

    @Mock
    private SbomRepository sbomRepository;

    @Mock
    private DependencyEdgeRepository dependencyEdgeRepository;

    @InjectMocks
    private SBOMProcessingService sbomProcessingService;

    private User testUser;
    private String validSBOMJson;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");

        validSBOMJson = """
            {
              "bomFormat": "CycloneDX",
              "specVersion": "1.4",
              "version": 1,
              "components": [
                {
                  "type": "library",
                  "name": "test-component",
                  "group": "test-group",
                  "version": "1.0.0"
                }
              ]
            }
            """;
    }

    @Test
    void processSBOMFile_ValidFile_ShouldReturnResponse() throws IOException {
        // Given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.json",
                "application/json",
                validSBOMJson.getBytes(StandardCharsets.UTF_8)
        );

        when(userService.getCurrentUser()).thenReturn(testUser);
        when(projectRepository.findByNameAndOwnerId(any(), any()))
                .thenReturn(Optional.empty());
        when(projectRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(componentRepository.findByNameAndGroupAndVersion(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(pipelineRepository.findByNameAndProjectName(any(), any()))
                .thenReturn(null);
        when(pipelineRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(buildRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(sbomRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // When
        SBOMUploadResponse response = sbomProcessingService.processSBOMFile(file, "test-project");

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getProjectName()).isEqualTo("test-project");
        assertThat(response.getTotalComponents()).isEqualTo(1);
        assertThat(response.getVulnerableComponents()).isEqualTo(0);
    }

    @Test
    void processSBOMFile_ExistingProject_ShouldUpdateProject() throws IOException {
        // Given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.json",
                "application/json",
                validSBOMJson.getBytes(StandardCharsets.UTF_8)
        );

        Project existingProject = Project.builder()
                .id(1L)
                .name("test-project")
                .version("1.0.0")
                .owner(testUser)
                .build();

        when(userService.getCurrentUser()).thenReturn(testUser);
        when(projectRepository.findByNameAndOwnerId(any(), any()))
                .thenReturn(Optional.of(existingProject));
        when(projectRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(componentRepository.findByNameAndGroupAndVersion(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(pipelineRepository.findByNameAndProjectName(any(), any()))
                .thenReturn(null);
        when(pipelineRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(buildRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(sbomRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // When
        SBOMUploadResponse response = sbomProcessingService.processSBOMFile(file, "test-project");

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getProjectName()).isEqualTo("test-project");
        assertThat(response.getTotalComponents()).isEqualTo(1);
    }

    @Test
    void processSBOMFile_ExistingComponent_ShouldReuseComponent() throws IOException {
        // Given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.json",
                "application/json",
                validSBOMJson.getBytes(StandardCharsets.UTF_8)
        );

        Component existingComponent = Component.builder()
                .id(1L)
                .name("test-component")
                .group("test-group")
                .version("1.0.0")
                .build();

        when(userService.getCurrentUser()).thenReturn(testUser);
        when(projectRepository.findByNameAndOwnerId(any(), any()))
                .thenReturn(Optional.empty());
        when(projectRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(componentRepository.findByNameAndGroupAndVersion(any(), any(), any()))
                .thenReturn(Optional.of(existingComponent));
        when(pipelineRepository.findByNameAndProjectName(any(), any()))
                .thenReturn(null);
        when(pipelineRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(buildRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(sbomRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // When
        SBOMUploadResponse response = sbomProcessingService.processSBOMFile(file, "test-project");

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTotalComponents()).isEqualTo(1);
    }
} 