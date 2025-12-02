import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";

// ✅ 관리자용 WebSocket 훅 (개인 알림 + 관리자 알림 구독)
//    내부에서 SockJS + STOMP 클라이언트 생성 후
//    "/user/{id}/queue/notifications" 와 "/topic/admin-notifications" 구독함
import { useAdminWebSocket } from "../../hooks/useAdminWebSocket";

import "./AdminLayout.css";

const AdminLayout = () => {
  const user = useSelector((state) => state.user?.user);
  const userId = user?.userId;
  const isAdmin = user?.role === 0;

  //  관리자 WebSocket 연결
  // - useAdminWebSocket 훅에서 WebSocket 연결을 관리
  // - adminNotifications: 실시간으로 수신된 관리자 알림 목록
  // - isConnected: 서버 WebSocket 연결 여부
  const { adminNotifications, isConnected } = useAdminWebSocket(
    userId,
    isAdmin
  );

  useEffect(() => {
    console.log("📊 관리자 WebSocket 연결 상태:", isConnected);
    console.log("📬 수신한 관리자 알림 개수:", adminNotifications.length);

    if (adminNotifications.length > 0) {
      console.log("📋 최근 관리자 알림:", adminNotifications[0]);
    }
  }, [isConnected, adminNotifications]);

  return (
    <div className="admin-layout">
      {/* ✅ WebSocket 연결 시 상단에 연결 상태 표시 */}
      {isConnected && (
        <div
          style={{
            position: "fixed",
            top: "10px",
            right: "10px",
            background: "#4CAF50",
            color: "white",
            padding: "5px 10px",
            borderRadius: "5px",
            fontSize: "12px",
            zIndex: 9999,
          }}
        >
          🟢 실시간 알림 연결됨
        </div>
      )}

      <Outlet />
    </div>
  );
};

export default AdminLayout;
