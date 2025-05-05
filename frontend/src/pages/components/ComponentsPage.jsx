import React, { useEffect, useState } from "react";
import { Input, Table } from "antd";
import componentApi from "../../api/component";
import { Link } from "react-router-dom";

function ComponentsPage() {
  const [components, setComponents] = useState([]);
  const [filteredComponents, setFilteredComponents] = useState([]);

  const columns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    // {
    //   title: "Version",
    //   key: "version",
    //   dataIndex: "version",
    //   render: (value, record) => {
    //     return (
    //       <span
    //         style={{
    //           display: "inline-flex",
    //           alignItems: "center",
    //           justifyContent: "space-between",
    //           minWidth: "100px",
    //         }}
    //       >
    //         <Typography.Text style={{ marginRight: "2px" }}>
    //           {value}
    //         </Typography.Text>
    //         {!record.isLatest ? (
    //           <Tooltip
    //             title={`Outdated component. Latest version is ${record.latestVersion}`}
    //           >
    //             <IoIosWarning color={yellow} />
    //           </Tooltip>
    //         ) : <Tooltip title="Latest version"><FaCheck color="green" /></Tooltip>}
    //       </span>
    //     );
    //   },
    // },
    {
      title: "Group",
      dataIndex: "groupName",
      key: "groupName",
    },
    {
      title: "Publisher",
      dataIndex: "publisher",
      key: "publisher",
      render: (value) => {
        return value ? value : "-";
      },
    },
    {
      title: "Pipeline",
      key: "pipeline",
      dataIndex: "appearIn",
      render: (values) => {
        return values.map((item) => {
          return (
            <span style={{ display: "inline-flex", alignItems: "center" }}>
            <Link
              style={{ marginRight: "2px" }}
              to={`/projects/${item.projectName}/${item.pipelineName}`}
              >
              {`${item.projectName}/${item.pipelineName}`}
            </Link>
          </span>
        )
      });
      },
    },
    // {
    //   title: "License",
    //   key: "licenses",
    //   dataIndex: "licenses",
    //   render: (value) => {
    //     return value.map((item) => (
    //       <div>
    //         <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "space-between"}}>
    //           <Link
    //             style={{ display: "block", marginRight: "2px" }}
    //             to={`/licenses/${item.licenseId}`}
    //           >
    //             {item.licenseId}
    //           </Link>
    //           {item.isDeprecated && (
    //             <Tooltip title={`This license is deprecated.`}>
    //               <IoIosWarning color={yellow} />
    //             </Tooltip>
    //           )}
    //         </span>
    //       </div>
    //     ));
    //   },
    // },
    // {
    //   title: "Vulnerabilities",
    //   key: "vulnerabilities",
    //   dataIndex: "vulnerabilities",
    //   render: (value) => {
    //     return value.map((item) => {
    //       const bugColor =
    //         item.cvssScore >= 9
    //           ? red
    //           : item.cvssScore >= 7
    //           ? orange
    //           : item.cvssScore >= 4
    //           ? yellow
    //           : blue;
    //       return (
    //         <span style={{ display: "inline-flex", alignItems: "center"}}>
    //           <Link style={{marginRight: "2px"}} to={`/vulnerabilities/${item.vulId}`}>{item.vulId}</Link>
    //           <Tooltip title={`CVSS Score: ${item.cvssScore}`}>
    //             <FaBug color={bugColor} />
    //           </Tooltip>
    //         </span>
    //       );
    //     });
    //   },
    // },
  ];

  useEffect(() => {
    const fetchComponent = async () => {
      const data = await componentApi.getComponents();
      setComponents(data);
      setFilteredComponents(
        data.map((component, index) => ({
          ...component,
          no: index + 1,
          key: index,
        }))
      );
    };
    fetchComponent();
  }, []);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "end",
        }}
      >
        <Input.Search
          style={{ width: "300px" }}
          placeholder="Search"
          onChange={(value) => {
            setFilteredComponents(
              components.filter((component) =>
                component.name.includes(value.target.value)
              )
            );
          }}
        />
      </div>
      <Table columns={columns} dataSource={filteredComponents} pagination />
    </div>
  );
}

export default ComponentsPage;
