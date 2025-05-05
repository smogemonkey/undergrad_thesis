import axiosClient from "./axiosClient";

const projectApi = {
  getProjects: () => {
    const url = "/projects";
    return axiosClient.get(url);
  },
  getProjectByName: (name) => {
    const url = `/projects/${name}`;
    return axiosClient.get(url);
  },
  createProject: (data) => {
    const url = "/projects";
    return axiosClient.post(url, data);
  },
  updateProject: (id, data) => {
    const url = `/projects/${id}`;
    return axiosClient.put(url, data);
  },
  deleteProject: (id) => {
    const url = `/projects/${id}`;
    return axiosClient.delete(url);
  },
  getAllMembers: (name) => {
    const url = `/projects/${name}/members`;
    return axiosClient.get(url);
  },
  addMember: (data) => {
    const url = `/projects/members`;
    return axiosClient.post(url, data);
  },
  removeMember: (projectName, userId) => {
    const url = `/projects/${projectName}/members/${userId}`;
    return axiosClient.delete(url);
  },
  updateMember: (projectName, userId, data) => {
    const url = `/projects/${projectName}/members/${userId}`;
    return axiosClient.put(url, data);
  },
  getUsersNotInProject: (projectName) => {
    const url = `/projects/${projectName}/users-not-in`;
    return axiosClient.get(url);
  },
  getMembership: (projectName) => {
    const url = `/projects/${projectName}/membership`;
    return axiosClient.get(url);
  },
};

export default projectApi;