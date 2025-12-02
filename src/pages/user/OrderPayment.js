import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import "./OrderPayment.css";

const OrderPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.user);

  // 주문 페이지로 전달된 상품 목록
  const { products, fromCart } = location.state || {
    products: [],
    fromCart: false,
  };

  const [orderInfo, setOrderInfo] = useState({
    name: user?.username || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: "",
    detailAddress: "",
    request: "",
    paymentMethod: "CARD", // 기본 결제 수단: 카드
  });

  const [loading, setLoading] = useState(false);

  // 결제 또는 주문 완료 후 표시되는 화면
  const [showSuccess, setShowSuccess] = useState(false);

  // 카카오 주소 검색
  const handleAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: function (data) {
        let fullAddress = data.address;
        let extraAddress = "";

        if (data.addressType === "R") {
          if (data.bname !== "") {
            extraAddress += data.bname;
          }
          if (data.buildingName !== "") {
            extraAddress +=
              extraAddress !== ""
                ? ", " + data.buildingName
                : data.buildingName;
          }
          fullAddress += extraAddress !== "" ? " (" + extraAddress + ")" : "";
        }

        setOrderInfo((prev) => ({
          ...prev,
          address: fullAddress,
        }));

        document.getElementById("detailAddress")?.focus();
      },
    }).open();
  };

  useEffect(() => {
    // 로그인 되어있지 않으면 이동
    if (!isAuthenticated) {
      toast.error("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    // 상품 목록 검증
    if (!products || products.length === 0) {
      toast.error("주문할 상품이 없습니다.");
      navigate("/");
      return;
    }
  }, [isAuthenticated, products, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateTotalPrice = () => {
    return products.reduce((total, item) => {
      const price = item.salePrice || item.price;
      return total + price * item.quantity;
    }, 0);
  };

  /**
   * 주문 생성 및 결제 요청 처리
   * - CARD: 주문 생성과 동시에 결제 완료 상태로 처리
   * - BANK_TRANSFER: 주문만 생성되고 결제 대기 상태로 저장됨
   *   (관리자가 입금 확인 시 ORDERED 처리)
   */
  const handlePayment = async () => {
    if (!orderInfo.address || orderInfo.address.trim() === "") {
      toast.error("주소를 입력해주세요.");
      return;
    }

    if (!orderInfo.name || !orderInfo.phone) {
      toast.error("이름과 연락처를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // 서버로 전달하는 주문 데이터
      const orderData = {
        userId: user.id,
        orderItems: products.map((product) => ({
          productId: product.id,
          quantity: product.quantity,
        })),
        paymentMethod: orderInfo.paymentMethod, // 주문 방식에 따라 결제 처리 로직 분기됨
        recipientName: orderInfo.name,
        recipientPhone: orderInfo.phone,
        shippingAddress:
          orderInfo.address +
          (orderInfo.detailAddress ? ` ${orderInfo.detailAddress}` : ""),
        shippingRequest: orderInfo.request,
      };

      const response = await fetch("http://localhost:8080/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      /**
       * 주문 성공 처리
       * - CARD: 바로 결제 완료 표시
       * - BANK_TRANSFER: 주문 완료(입금 대기) 메시지 표시
       * 두 경우 모두 동일한 완료 화면을 띄우고 잠시 후 다음 페이지로 이동
       */
      if (result.success) {
        setLoading(false);
        setShowSuccess(true);

        setTimeout(() => {
          navigate("/user/order-complete", {
            state: {
              orderInfo: orderInfo,
              products: products,
              totalPrice: calculateTotalPrice(),
              orderId: result.data.orderId,
            },
          });
        }, 1300);
      } else {
        toast.error(result.message || "주문 생성에 실패했습니다.");
        setLoading(false);
      }
    } catch (error) {
      let errorMessage = "주문 생성 중 오류가 발생했습니다.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage += " (" + error.message + ")";
      }

      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return price ? price.toLocaleString() + "원" : "0원";
  };

  // 주문 처리 중 화면
  if (loading) {
    return (
      <div className="order-payment-container">
        <div className="loading">처리 중...</div>
      </div>
    );
  }

  /**
   * 주문 완료 표시 화면
   * CARD → 결제 완료 메시지 표시
   * BANK_TRANSFER → 주문 완료(입금 대기) 메시지 표시
   */
  if (showSuccess) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>
          확인되었습니다
        </div>

        <div style={{ fontSize: "32px", fontWeight: "bold", color: "#4ade80" }}>
          {orderInfo.paymentMethod === "BANK_TRANSFER"
            ? "주문 완료"
            : "결제 완료"}
        </div>

        {orderInfo.paymentMethod === "BANK_TRANSFER" && (
          <div style={{ fontSize: "16px", color: "#666", marginTop: "10px" }}>
            입금 확인 후 배송이 시작됩니다
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="order-payment-container">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
            fontSize: "16px",
            padding: "16px",
          },
          success: { style: { background: "#4ade80" } },
          error: { style: { background: "#ef4444" } },
        }}
      />

      <div className="order-payment-content">
        <h1>주문/결제</h1>

        {/* 아래 기존 구조와 주석 모두 유지 (배송 정보, 결제 방법, 주문 정보, 버튼 등) */}
        {/* 주문결제/완료 로직은 위에서 handlePayment + showSuccess 부분에 모두 정리됨 */}

        {/* ... 이하 기존 코드 동일 ... */}
      </div>
    </div>
  );
};

export default OrderPayment;
