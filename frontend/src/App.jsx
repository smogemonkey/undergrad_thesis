import { ConfigProvider, theme } from "antd";
import MyLayout from "./layout/MyLayout";
import { useState } from "react";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/login/Login";
import ProjectsPage from "./pages/projects/ProjectsPage";
import ComponentsPage from "./pages/components/ComponentsPage";
import VulnerabilitiesPage from "./pages/vulnerabilities/VulnerabilitiesPage";
import LicensesPage from "./pages/licenses/LicensesPage";
import ProjectDetail from "./pages/projects/ProjectDetail";
import LicenseDetail, { loader as licenseDetailLoader } from "./pages/licenses/LicenseDetail";
import UserDetail, { loader as userDetailLoader } from "./pages/user-management/UserDetail";
import ErrorPage from "./pages/errors/ErrorPage";
import UserManagementPage from "./pages/user-management/UserManagementPage";
import PermissionsPage from "./pages/permission/PermissionsPage";
import PipelinePage from "./pages/pipelines/PipelinePage";
import VulnerabilityPage, {loader as vulnerabilityLoader} from "./pages/vulnerabilities/VulnerabilityPage";
import RolesPage from "./pages/roles/RolesPage";
import ProjectTab from "./pages/projects/ProjectTab";

function App() {
  const [isDarkMode, setDarkMode] = useState(false);
  const route = createBrowserRouter([
    {
      path: "/",
      element: <Navigate to="/projects" replace />,
    },
    {
      path: "/login",
      element: <Login />
    },
    {
      path: "/",
      element: <MyLayout setDarkMode={setDarkMode} />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "projects",
          element: <ProjectsPage />,
        },
        {
          path: "projects/:projectName",
          element: <ProjectTab />,
        },
        {
          path: "projects/:projectName/:pipelineName",
          element: <PipelinePage />
        },
        {
          path: "components",
          element: <ComponentsPage />
        },
        {
          path: "vulnerabilities",
          element: <VulnerabilitiesPage />
        },
        {
          path: "vulnerabilities/:id",
          element: <VulnerabilityPage />,
          loader: vulnerabilityLoader
        },
        {
          path: "licenses",
          element: <LicensesPage />,
        },
        {
          path: "licenses/:id",
          element: <LicenseDetail />,
          loader: licenseDetailLoader
        },
        {
          path: "users",
          element: <UserManagementPage />
        },
        {
          path: "users/:username",
          element: <UserDetail />,
          loader: userDetailLoader
        },
        {
          path: "roles",
          element: <RolesPage />
        },
        {
          path: "permissions",
          element: <PermissionsPage />
        }
      ]
    }
  ]);
  
  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#00B96B",
        },
      }}
    >
      <RouterProvider router={route}/>
    </ConfigProvider>
  );
}

export default App;
