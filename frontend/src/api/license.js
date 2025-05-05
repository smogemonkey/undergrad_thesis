import axiosClient from "./axiosClient";

const licenseApi = {
  getLicenses: (params) => {
    const url = "/licenses";
    return axiosClient.get(url, { params });
  },
  getLicenseById: (id) => {
    const url = `/licenses/${id}`;
    return axiosClient.get(url);
  },
};

export default licenseApi;