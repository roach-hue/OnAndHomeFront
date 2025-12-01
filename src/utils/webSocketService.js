import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect(userId, onMessageCallback, onConnectCallback) {
    if (this.connected) {
      return;
    }

    if (!userId) {
      return;
    }

    // WebSocket(SockJS) + STOMP 클라이언트 생성
    this.client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {},
    });

    // 연결 성공 시 실행
    this.client.onConnect = () => {
      this.connected = true;
      this.reconnectAttempts = 0;

      // 개인 알림 구독
      const subscription = this.client.subscribe(
        `/user/${userId}/queue/notifications`,
        (message) => {
          try {
            const notification = JSON.parse(message.body);
            onMessageCallback(notification);
          } catch (error) {
            console.error(error);
          }
        }
      );

      this.subscriptions.push(subscription);

      if (onConnectCallback) {
        onConnectCallback();
      }
    };

    // STOMP 프로토콜 에러
    this.client.onStompError = () => {
      this.connected = false;
    };

    // WebSocket 연결 종료 시 실행 (재연결 시도 포함)
    this.client.onWebSocketClose = () => {
      this.connected = false;

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          this.connect(userId, onMessageCallback, onConnectCallback);
        }, this.reconnectDelay);
      }
    };

    // 연결 시작
    this.client.activate();
  }

  // WebSocket + STOMP 해제
  disconnect() {
    if (this.client && this.connected) {
      // 모든 구독 해제
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions = [];

      // 연결 종료
      this.client.deactivate();
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new WebSocketService();
