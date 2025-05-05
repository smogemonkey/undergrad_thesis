import axiosClient from "./axiosClient";

const buildApi = {
  getBuilds: (projectName, pipelineName, params) => {
    const url = `/projects/${projectName}/pipelines/${pipelineName}/builds`;
    return axiosClient.get(url, { params });
  },
  getBuildById: (id) => {
    const url = `/builds/${id}`;
    return axiosClient.get(url);
  },
  compareBuild: (buildId1, buildId2) => {
    const url = `/builds/compare?from=${buildId1}&to=${buildId2}`;
    return axiosClient.get(url);
  },
  getComponentsByBuildId: (buildId) => {
    const url = `/builds/${buildId}/components`;
    return axiosClient.get(url);
  },
  getDependenciesByBuildId: (buildId) => {
    const url = `/builds/${buildId}/dependencies`;
    return axiosClient.get(url);
  },
};

export default buildApi;