import create from "@ant-design/icons/lib/components/IconFont";
import axiosClient from "./axiosClient";

const pipelineApi = {
  getPipelinesByProjectName: (projectName) => {
    const url = `/projects/${projectName}/pipelines`;
    return axiosClient.get(url);
  },
  getLatestBuildDependencies: (projectName, pipelineName) => {
    const url = `/projects/${projectName}/pipelines/${pipelineName}/builds/latest/dependencies`;
    return axiosClient.get(url);
  },
  getLatestBuildComponents: (projectName, pipelineName) => {
    const url = `/projects/${projectName}/pipelines/${pipelineName}/builds/latest/components`;
    return axiosClient.get(url);
  },
  createPipeline: (projectName, data) => {
    const url = `/projects/${projectName}/pipelines`;
    return axiosClient.post(url, data);
  },
  deletePipeline: (projectName, pipelineName) => {
    const url = `/projects/${projectName}/pipelines/${pipelineName}`;
    return axiosClient.delete(url);
  },
};

export default pipelineApi;