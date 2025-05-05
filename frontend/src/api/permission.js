import axiosClient from "./axiosClient";

const permissionApi = {
  getPermissions: () => {
    const url = "/permissions";
    return axiosClient.get(url);
  }
};

export default permissionApi;