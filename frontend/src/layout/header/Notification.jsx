import { Client } from "@stomp/stompjs";
import {
  Badge,
  Button,
  Dropdown,
  notification,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import { FaRegBell } from "react-icons/fa6";
import { timeFromNow } from "../../ultil";
import projectApi from "../../api/project";
import client from "./stompClient";

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (noti) => {
    api.open({
      ...noti,
      placement: "bottomRight",
    });
  };

  useEffect(() => {
    client.onConnect = async () => {
      console.log("Connected to broker");

      const fetchProjects = async () => {
        const response = await projectApi.getProjects();
        return response;
      };

      const projects = await fetchProjects();
      projects.forEach((project) => {
        client.subscribe(`/project/${project.name}`, (message) => {
          console.log("Received message:", message.body);
          const noti = JSON.parse(message.body);
          openNotification(noti);
          setNotifications((prevNotifications) => [...prevNotifications, noti]);
        });
      });
    }
    client.activate();
    return () => client.deactivate();
  }, []);

  return (
    <>
      {contextHolder}
      <Dropdown
        trigger={["click"]}
        menu={{
          items: notifications
            .map((noti) => ({
              label: (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    {noti.message}
                  </Typography.Title>
                  <Typography.Text>{noti.description}</Typography.Text>
                  <Typography.Text type="secondary">{timeFromNow(noti.timestamp)}</Typography.Text>
                </div>
              ),
              onClick: () => openNotification(noti),
            }))
            .reverse(),
        }}
        dropdownRender={(menu) => (
          <div style={{}}>
            {React.cloneElement(menu, {
              style: {
                overflow: "auto",
                width: "300px",
                maxHeight: "500px",
              },
            })}
          </div>
        )}
      >
        <Badge count={notifications.length}>
          <Button type="text" icon={<FaRegBell size={24} />} />
        </Badge>
      </Dropdown>
    </>
  );
}

export default Notification;
