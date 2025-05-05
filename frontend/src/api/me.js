import axiosClient from "./axiosClient";

const meApi = {
  changePassword: (data) => {
    const url = "/me/change-password";
    return axiosClient.patch(url, data);
  },
  getProfile: () => {
    const url = "/me";
    return axiosClient.get(url);
  },
  updateProfile: (data) => {
    const url = "/me";
    return axiosClient.patch(url, data);
  }
};

export default meApi;