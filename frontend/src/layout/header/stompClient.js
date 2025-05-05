import { Client } from "@stomp/stompjs";

const client = new Client({
  brokerURL: `${import.meta.env.VITE_WEBSOCKET_URL}/ws`,
  debug: (str) => console.log(str),
  onStompError: (frame) =>
    console.log("Broker reported error: " + frame.headers["message"]),
});

export default client;