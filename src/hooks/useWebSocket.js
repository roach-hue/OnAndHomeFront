import { Client } from "@stomp/stompjs";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import SockJS from "sockjs-client";

export const useWebSocket = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // STOMP 클라이언트를 저장할 ref (연결 유지/종료에 필요)
  const stompClient = useRef(null);

  useEffect(() => {
    // userId가 없으면 개인 알림을 받을 수 없으므로 연결하지 않음
    if (!userId) {
      console.log("userId 없음 - 웹소켓 연결 안함");
      return;
    }

    console.log("=== 웹소켓 연결 시작 ===");
    console.log("userId:", userId);

    // WebSocket 연결 생성 (SockJS → STOMP)
    // /ws 엔드포인트로 서버와 실시간 연결 시도
    const socket = new SockJS("http://localhost:8080/ws");

    // STOMP 클라이언트 생성
    // reconnectDelay, heartbeat 등은 연결 안정성 향상 설정
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log("[STOMP DEBUG]", str);
      },
      reconnectDelay: 5000, // 끊기면 5초 후 자동 재연결
      heartbeatIncoming: 4000, // 서버 → 클라이언트 heartbeat
      heartbeatOutgoing: 4000, // 클라이언트 → 서버 heartbeat
    });

    // WebSocket 연결 성공 시 실행되는 콜백
    client.onConnect = (frame) => {
      console.log("✅ WebSocket 연결 성공");
      console.log("연결 정보:", frame);
      setIsConnected(true);

      // 개인 사용자 알림 경로
      // 서버에서 convertAndSendToUser(userId, "/queue/notifications") 로 보내는 메시지를 받음
      const subscriptionPath = `/user/${userId}/queue/notifications`;
      console.log("구독 경로:", subscriptionPath);

      // 개인 알림 구독
      const subscription = client.subscribe(subscriptionPath, (message) => {
        console.log("📩 알림 수신 원본:", message);
        console.log("📩 알림 body:", message.body);

        try {
          // 서버에서 보낸 JSON 알림 파싱
          const notification = JSON.parse(message.body);

          console.log("📩 파싱된 알림:", notification);
          console.log("📩 알림 타입:", notification.type);
          console.log("📩 QnA ID:", notification.qnaId);
          console.log("📩 상품 ID:", notification.productId);

          // 상태 업데이트: 최신 알림을 상단에 추가
          setNotifications((prev) => [notification, ...prev]);

          // 토스트 팝업 표시
          toast.success(`🔔 ${notification.title || "새 알림"}`, {
            duration: 3000,
          });

          // 브라우저 알림 표시
          showBrowserNotification(notification);
        } catch (error) {
          console.error("알림 파싱 오류:", error);
        }
      });

      console.log("구독 완료:", subscription);
    };

    // STOMP 프로토콜 관련 에러
    client.onStompError = (frame) => {
      console.error("❌ STOMP 에러:", frame.headers["message"]);
      console.error("상세:", frame.body);
      setIsConnected(false);
    };

    // WebSocket 연결 종료
    client.onDisconnect = () => {
      console.log("🔌 WebSocket 연결 끊김");
      setIsConnected(false);
    };

    // 네트워크/WebSocket 자체 에러
    client.onWebSocketError = (error) => {
      console.error("❌ WebSocket 에러:", error);
    };

    // WebSocket 연결 활성화
    try {
      client.activate();
      stompClient.current = client;
      console.log("WebSocket 활성화 완료");
    } catch (error) {
      console.error("WebSocket 활성화 실패:", error);
    }

    // cleanup: 컴포넌트 unmount 시 WebSocket 연결 종료
    return () => {
      console.log("🔌 WebSocket 연결 해제");
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, [userId]);

  // 브라우저 푸시 알림 표시
  // 서버 → WebSocket → STOMP 구독 → 여기서 OS Notification API 호출
  const showBrowserNotification = (notification) => {
    if (Notification.permission === "granted") {
      const n = new Notification(notification.title || "새 알림", {
        body: notification.message,
        icon: "/logo192.png",
        tag: `notification-${notification.qnaId}`,
      });

      // 알림 클릭 시 이동 (상품 알림이면 해당 상품 페이지로 이동)
      n.onclick = () => {
        console.log("🔔 알림 클릭됨");
        console.log("알림 데이터:", notification);

        if (notification.productId) {
          const targetUrl = `/products/${notification.productId}`;
          console.log("✅ 이동할 URL:", targetUrl);
          window.focus();
          window.location.href = targetUrl;
        } else {
          console.warn("⚠️ productId가 없습니다:", notification);
        }
      };
    }
  };

  return { notifications, isConnected, setNotifications };
};
