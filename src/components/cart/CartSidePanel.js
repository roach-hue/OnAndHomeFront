import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cartAPI } from "../../api";
import "./CartSidePanel.css";

const CartSidePanel = ({ isOpen, onClose, onCartUpdate }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // 패널이 닫힐 때 minimize 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  // 장바구니 목록 로드
  const loadCartItems = async () => {
    setLoading(true);
    try {
      const response = await cartAPI.getCartItems();
      console.log("=== 장바구니 API 응답 ===", response);

      if (response.success && response.data) {
        setCartItems(response.data);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("장바구니 조회 오류:", error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCartItems();
    }
  }, [isOpen]);

  const handleRemoveItem = async (cartItemId) => {
    if (!window.confirm("이 상품을 장바구니에서 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await cartAPI.removeItem(cartItemId);
      if (response.success) {
        await loadCartItems();
        if (onCartUpdate) onCartUpdate();
      } else {
        alert(response.message || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("삭제 오류:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleQuantityChange = async (cartItemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;

    if (newQuantity < 1) {
      alert("수량은 1개 이상이어야 합니다.");
      return;
    }

    try {
      const response = await cartAPI.updateQuantity(cartItemId, newQuantity);
      if (response.success) {
        await loadCartItems();
        if (onCartUpdate) onCartUpdate();
      } else {
        alert(response.message || "수량 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("수량 변경 오류:", error);
      alert("수량 변경 중 오류가 발생했습니다.");
    }
  };

  const toggleMinimize = () => {
    onClose();  // 접기 버튼을 클릭하면 완전히 닫기
  };

  const handleOverlayClick = () => {
    if (!isMinimized) {
      onClose();
    }
  };

  const handleGoToCart = () => {
    navigate("/cart");
    onClose();
  };

  const formatPrice = (price) => {
    if (!price) return "0";
    return price.toLocaleString();
  };

  const calculateDiscountRate = (originalPrice, salePrice) => {
    if (!originalPrice || !salePrice || salePrice >= originalPrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  const getImageUrl = (product) => {
    let imagePath =
      product?.thumbnailImage || product?.imageUrl || product?.mainImage;

    if (!imagePath) {
      return "/images/no-image.png";
    }

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    if (imagePath.startsWith("uploads/") || imagePath.startsWith("/uploads/")) {
      return `http://localhost:8080${
        imagePath.startsWith("/") ? "" : "/"
      }${imagePath}`;
    }

    if (!imagePath.includes("/") && !imagePath.startsWith("http")) {
      return `/product_img/${imagePath}.jpg`;
    }
  
    return imagePath;
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const originalPrice = item.product?.price || 0;
      const salePrice = item.product?.salePrice || 0;
      const finalPrice = salePrice > 0 ? salePrice : originalPrice;
      return total + finalPrice * (item.quantity || 0);
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 오버레이 */}
      {!isMinimized && (
        <div
          className={`cart-overlay ${isOpen ? "active" : ""}`}
          onClick={handleOverlayClick}
        />
      )}

      {/* 사이드 패널 */}
      <div
        className={`cart-side-panel ${isOpen ? "active" : ""} ${
          isMinimized ? "minimized" : ""
        }`}
      >
        {/* 헤더 */}
        <div className="cart-panel-header">
          <div className="cart-header-left">
            <h2>장바구니 ({cartItems.length})</h2>
            <button className="minimize-btn" onClick={toggleMinimize}>
              {isMinimized ? "펼치기" : "접기"}
            </button>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 상품 목록 */}
        {!isMinimized && (
          <div className="cart-panel-content">
            {loading ? (
              <div className="loading-cart">
                <p>로딩 중...</p>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="empty-cart">
                <p>장바구니가 비어있습니다.</p>
              </div>
            ) : (
              <div className="cart-items-list">
                {cartItems.map((item) => {
                  const product = item.product || {};
                  const originalPrice = product.price || 0;
                  const salePrice = product.salePrice || 0;
                  const finalPrice = salePrice > 0 ? salePrice : originalPrice;
                  const discountRate = calculateDiscountRate(
                    originalPrice,
                    salePrice
                  );
                  const quantity = item.quantity || 0;
                  const itemTotal = finalPrice * quantity;
                  const productName = product.name || "상품명 없음";

                  return (
                    <div key={item.id} className="cart-item-card">
                      <button
                        className="remove-item-btn"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        ✕
                      </button>
                      <div className="item-image">
                        <img
                          src={getImageUrl(product)}
                          alt={productName}
                          onError={(e) => {
                            e.target.src = "/images/no-image.png";
                          }}
                        />
                      </div>
                      <div className="item-info">
                        <h3 className="item-name">{productName}</h3>
                        <div className="item-price-container">
                          {discountRate > 0 ? (
                            <>
                              <div className="original-price">
                                {formatPrice(originalPrice)}원
                              </div>
                              <div className="sale-price-row">
                                <span className="sale-price">
                                  {formatPrice(salePrice)}원
                                </span>
                                <span className="discount-badge">
                                  {discountRate}% 할인
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="item-price">
                              {formatPrice(originalPrice)}원
                            </div>
                          )}
                        </div>
                        <div className="item-details">
                          <div className="item-quantity-control">
                            <span className="label">수량</span>
                            <div className="quantity-buttons">
                              <button
                                className="quantity-btn minus"
                                onClick={() =>
                                  handleQuantityChange(item.id, quantity, -1)
                                }
                                disabled={quantity <= 1}
                              >
                                −
                              </button>
                              <span className="quantity-value">{quantity}</span>
                              <button
                                className="quantity-btn plus"
                                onClick={() =>
                                  handleQuantityChange(item.id, quantity, 1)
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="item-subtotal">
                            <span className="label">소계</span>
                            <strong>{formatPrice(itemTotal)}원</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 푸터 */}
        {!isMinimized && (
          <div className="cart-panel-footer">
            <div className="total-price">
              <span>총 금액</span>
              <strong>{formatPrice(getTotalPrice())}원</strong>
            </div>
            <button
              className="go-to-cart-btn"
              onClick={handleGoToCart}
              disabled={cartItems.length === 0}
            >
              장바구니 가기
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidePanel;
