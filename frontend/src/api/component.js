import axiosClient from "./axiosClient";

const componentApi = {
  getComponents: () => {
    const url = "/components";
    return axiosClient.get(url);
  }
};

export default componentApi;