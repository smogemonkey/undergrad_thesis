import axiosClient from "./axiosClient";

const roleApi = {
  getRoles: () => {
    const url = "/roles";
    return axiosClient.get(url);
  },
  addRole: (data) => {
    const url = "/roles";
    return axiosClient.post(url, data);
  },
  deleteRole: (id) => {
    const url = `/roles/${id}`;
    return axiosClient.delete(url);
  },
  updateRole: (id, data) => {
    const url = `/roles/${id}`;
    return axiosClient.put(url, data);
  },
};

export default roleApi;