import { Client } from "@stomp/stompjs";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import SockJS from "sockjs-client";

export const useAdminWebSocket = (userId, isAdmin) => {
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const stompClient = useRef(null);

  useEffect(() => {
    if (!userId || !isAdmin) {
      console.log("관리자가 아니거나 userId 없음 - 관리자 웹소켓 연결 안함");
      return;
    }

    console.log("=== 관리자 웹소켓 연결 시작 ===");
    console.log("userId:", userId);

    // WebSocket 연결 (백엔드 WebSocketConfig 에서 /ws 로 설정됨)
    const socket = new SockJS("http://localhost:8080/ws");

    // STOMP 클라이언트 생성
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log("[ADMIN STOMP DEBUG]", str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // WebSocket 연결 성공 시 실행
    client.onConnect = (frame) => {
      console.log("✅ 관리자 WebSocket 연결 성공");
      console.log("연결 정보:", frame);
      setIsConnected(true);

      // 1. 개인 알림 구독
      // convertAndSendToUser(userId, "/queue/notifications") 와 매칭됨
      const personalPath = `/user/${userId}/queue/notifications`;
      console.log("📍 개인 알림 구독:", personalPath);

      client.subscribe(personalPath, (message) => {
        console.log("📩 개인 알림 수신:", message.body);
        try {
          const notification = JSON.parse(message.body);

          toast.success(`📬 ${notification.title || "새 알림"}`, {
            duration: 3000,
          });
        } catch (error) {
          console.error("개인 알림 파싱 오류:", error);
        }
      });

      // 2. 관리자 브로드캐스트 알림 구독
      // WebSocketConfig.enableSimpleBroker("/topic") 와 매칭됨
      const adminPath = "/topic/admin-notifications";
      console.log("📍 관리자 브로드캐스트 구독:", adminPath);

      const adminSubscription = client.subscribe(adminPath, (message) => {
        console.log("📣 관리자 알림 수신 원본:", message);
        console.log("📣 관리자 알림 body:", message.body);

        try {
          const notification = JSON.parse(message.body);
          console.log("📣 파싱된 관리자 알림:", notification);

          setAdminNotifications((prev) => [notification, ...prev]);

          toast.success(`🔔 ${notification.title || "새 알림"}`, {
            duration: 4000,
            icon: "🔔",
          });

          showBrowserNotification(notification);
        } catch (error) {
          console.error("관리자 알림 파싱 오류:", error);
        }
      });

      console.log("관리자 브로드캐스트 구독 완료:", adminSubscription);
    };

    client.onStompError = (frame) => {
      console.error("❌ 관리자 STOMP 에러:", frame.headers["message"]);
      console.error("상세:", frame.body);
      setIsConnected(false);
    };

    client.onDisconnect = () => {
      console.log("🔌 관리자 WebSocket 연결 끊김");
      setIsConnected(false);
    };

    client.onWebSocketError = (error) => {
      console.error("❌ 관리자 WebSocket 에러:", error);
    };

    try {
      client.activate(); // 서버와 WebSocket 연결 시작
      stompClient.current = client;
      console.log("관리자 WebSocket 활성화 완료");
    } catch (error) {
      console.error("관리자 WebSocket 활성화 실패:", error);
    }

    return () => {
      console.log("🔌 관리자 WebSocket 연결 해제");
      if (stompClient.current) {
        stompClient.current.deactivate(); // 웹소켓 연결 종료
      }
    };
  }, [userId, isAdmin]);

  // 브라우저 알림 표시
  const showBrowserNotification = (notification) => {
    if (Notification.permission === "granted") {
      const n = new Notification(notification.title || "새 관리자 알림", {
        body: notification.message,
        icon: "/logo192.png",
        tag: `admin-notification-${
          notification.orderId || notification.qnaId || notification.reviewId
        }`,
      });

      n.onclick = () => {
        window.focus();
        if (notification.type === "ADMIN_ORDER" && notification.orderId) {
          window.location.href = `/admin/orders/${notification.orderId}`;
        } else if (notification.type === "ADMIN_QNA" && notification.qnaId) {
          window.location.href = `/admin/qna/${notification.qnaId}`;
        } else if (
          notification.type === "ADMIN_REVIEW" &&
          notification.reviewId
        ) {
          window.location.href = `/admin/reviews`;
        }
      };
    }
  };

  return { adminNotifications, isConnected, setAdminNotifications };
};
