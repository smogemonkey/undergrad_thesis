import axiosClient from "./axiosClient";

const userApi = {
  getUsers: (params) => {
    const url = "/users";
    return axiosClient.get(url, { params });
  },
  getUserByUsername: (username) => {
    const url = `/users/${username}`;
    return axiosClient.get(url);
  },
  changePassword: (data) => {
    const url = "/users/change-password";
    return axiosClient.patch(url, data);
  },
  patchUpdate: (userId, data) => {
    const url = `/users/${userId}`;
    return axiosClient.patch(url, data);
  },
  create: (data) => {
    const url = "/users";
    return axiosClient.post(url, data);
  }
};

export default userApi;