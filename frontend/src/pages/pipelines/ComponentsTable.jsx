import { Input, Table, theme, Tooltip, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBug, FaCheck  } from "react-icons/fa6";
import { IoIosWarning } from "react-icons/io";

function ComponentsTable({ dataSource }) {
  const [filteredComponents, setFilteredComponents] = useState(dataSource);
  useEffect(() => {
    setFilteredComponents(dataSource);
  }, [dataSource]);
  const {
    token: { red, yellow, orange, blue },
  } = theme.useToken();
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
    {
      title: "Version",
      key: "version",
      dataIndex: "version",
      render: (value, record) => {
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "space-between",
              minWidth: "100px",  
            }}
          >
            <Typography.Text style={{ marginRight: "2px" }}>
              {value}
            </Typography.Text>
            {!record.isLatest ? (
              <Tooltip
                title={`Outdated component. Latest version is ${record.latestVersion}`}
              >
                <IoIosWarning color={yellow} />
              </Tooltip>
            ) : <Tooltip title="Latest version"><FaCheck color="green" /></Tooltip>}
          </span>
        );
      },
    },
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
      title: "License",
      key: "licenses",
      dataIndex: "licenses",
      render: (value) => {
        return value.map((item) => (
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "space-between"}}>
              <Link
                style={{ display: "block", marginRight: "2px" }}
                to={`/licenses/${item.licenseId}`}
              >
                {item.licenseId}
              </Link>
              {item.isDeprecated && (
                <Tooltip title={`This license is deprecated.`}>
                  <IoIosWarning color={yellow} />
                </Tooltip>
              )}
            </span>
          </div>
        ));
      },
    },
    {
      title: "Vulnerabilities",
      key: "vulnerabilities",
      dataIndex: "vulnerabilities",
      render: (value) => {
        return value.map((item) => {
          const bugColor =
            item.cvssScore >= 9
              ? red
              : item.cvssScore >= 7
              ? orange
              : item.cvssScore >= 4
              ? yellow
              : blue;
          return (
            <span style={{ display: "inline-flex", alignItems: "center"}}>
              <Link style={{marginRight: "2px"}} to={`/vulnerabilities/${item.vulId}`}>{item.vulId}</Link>
              <Tooltip title={`CVSS Score: ${item.cvssScore}`}>
                <FaBug color={bugColor} />
              </Tooltip>
            </span>
          );
        });
      },
    },
  ];
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    }}>
      <Input.Search placeholder="Search components" style={{width: "300px", alignSelf: "end"}} onSearch={(value) => {
        setFilteredComponents(dataSource.filter((component) => component.name.includes(value) || component.groupName.includes(value)));
      }}/>
      <Table columns={columns} dataSource={filteredComponents} bordered />
    </div>
  );
}

export default ComponentsTable;
