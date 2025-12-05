import { useEffect, useRef, useState } from "react";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { cartAPI, favoriteAPI, productAPI, qnaAPI, reviewAPI } from "../../api";
import QnaItem from "../../components/qna/QnaItem";
import ReviewItem from "../../components/review/ReviewItem";
import "./ProductDetail.css";
  // 리뷰 - 별점 기능
import StarRating from '../../components/StarRating.jsx';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useSelector((state) => state.user);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [qnas, setQnas] = useState([]);
  const [reviewContent, setReviewContent] = useState("");
  const [qnaTitle, setQnaTitle] = useState("");
  const [qnaContent, setQnaContent] = useState("");
  const [qnaIsPrivate, setQnaIsPrivate] = useState(false);
  const [activeTab, setActiveTab] = useState("detail");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [rating, setRating] = useState(0);

  const [imageModal, setImageModal] = useState({ open: false, src: "" });


  // 리뷰 이미지 첨부
  const reviewFileInputRef = useRef(null);
  const [reviewImages, setReviewImages] = useState([]);



  const handleRemoveReviewImage = (index) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReviewImageChange = (e) => {
  const files = Array.from(e.target.files);

  // 기존 이미지 + 새로 추가되는 이미지 합산
  if (reviewImages.length + files.length > 5) {
    alert("이미지는 최대 5장까지 첨부할 수 있습니다.");
    return;
  }

  const newImages = files.map((file, index) => ({
    id: `img_${Date.now()}_${index}`,
    file,
    preview: URL.createObjectURL(file)
  }));

  setReviewImages((prev) => [...prev, ...newImages]);
};

  // Refs for scrolling
  const detailRef = useRef(null);
  const reviewRef = useRef(null);
  const qnaRef = useRef(null);
  const returnRef = useRef(null);
  const reviewWriteRef = useRef(null);
  const qnaWriteRef = useRef(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadProductDetail();
    checkInitialFavoriteStatus();
  }, [id]);

  const checkInitialFavoriteStatus = async () => {
    try {
      const result = await favoriteAPI.check(id);
      if (result.success) {
        setIsFavorite(result.isFavorite);
      }
    } catch (error) {
      console.error("찜 상태 확인 오류:", error);
    }
  };

  useEffect(() => {
    if (product) {
      loadReviews();
      loadQnas();
    }
  }, [product]);

  // URL 쿼리 파라미터로 탭 전환 및 특정 리뷰로 스크롤
  useEffect(() => {
    const tab = searchParams.get('tab');
    const reviewId = searchParams.get('reviewId');
    
    if (tab === 'review' && reviews.length > 0) {
      setActiveTab('review');
      
      // 약간의 지연 후 스크롤 (DOM 렌더링 대기)
      setTimeout(() => {
        if (reviewId) {
          // 특정 리뷰로 스크롤
          const reviewElement = document.querySelector(`[data-review-id="${reviewId}"]`);
          if (reviewElement) {
            const yOffset = -150;
            const y = reviewElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
            
            // 하이라이트 효과
            reviewElement.classList.add('highlight-review');
            setTimeout(() => {
              reviewElement.classList.remove('highlight-review');
            }, 3000);
          }
        } else {
          // 리뷰 섹션으로만 스크롤
          if (reviewRef.current) {
            const yOffset = -200;
            const y = reviewRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }
      }, 100);
    }
  }, [searchParams, reviews]);

  // URL 쿼리 파라미터로 Q&A 탭 전환 및 특정 Q&A로 스크롤
  useEffect(() => {
    const tab = searchParams.get('tab');
    const qnaId = searchParams.get('qnaId');
    
    if (tab === 'qna' && qnas.length > 0) {
      setActiveTab('qna');
      
      // 약간의 지연 후 스크롤 (DOM 렌더링 대기)
      setTimeout(() => {
        if (qnaId) {
          // 특정 Q&A로 스크롤
          const qnaElement = document.querySelector(`[data-qna-id="${qnaId}"]`);
          if (qnaElement) {
            const yOffset = -150;
            const y = qnaElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
            
            // 하이라이트 효과
            qnaElement.classList.add('highlight-qna');
            setTimeout(() => {
              qnaElement.classList.remove('highlight-qna');
            }, 3000);
          }
        } else {
          // Q&A 섹션으로만 스크롤
          if (qnaRef.current) {
            const yOffset = -200;
            const y = qnaRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }
      }, 100);
    }
  }, [searchParams, qnas]);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        12,
        0,
        0
      );

      if (now.getHours() >= 12) {
        today.setDate(today.getDate() + 1);
      }

      const diff = today - now;

      if (diff <= 0) {
        return "00:00:00";
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`;
    };

    setTimeRemaining(calculateTimeRemaining());

    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadProductDetail = async () => {
    try {
      const response = await productAPI.getProductDetail(id);
      if (response.success && response.data) {
        setProduct(response.data);
      } else {
        alert("상품을 찾을 수 없습니다.");
        navigate("/products");
      }
    } catch (error) {
      console.error("상품 조회 오류:", error);
      alert("상품 정보를 불러올 수 없습니다.");
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const userId = user ? user.id : null;
      const response = await reviewAPI.getProductReviews(id, userId);
      if (Array.isArray(response)) {
        setReviews(response);
      }
    } catch (error) {
      console.error("리뷰 조회 오류:", error);
    }
  };

  const loadQnas = async () => {
    try {
      const response = await qnaAPI.getProductQnas(id);
      if (response.success && response.data) {
        setQnas(response.data);
      }
    } catch (error) {
      console.error("QnA 조회 오류:", error);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "0원";
    return `${price.toLocaleString()}원`;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/images/no-image.png";

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

  const handleTabClick = (tab) => {
    setActiveTab(tab);

    let targetRef;
    switch (tab) {
      case "detail":
        targetRef = detailRef;
        break;
      case "review":
        // 리뷰 작성란으로 스크롤 (비로그인 시 섹션으로)
        targetRef = reviewWriteRef.current ? reviewWriteRef : reviewRef;
        break;
      case "qna":
        // Q&A 작성란으로 스크롤 (비로그인 시 섹션으로)
        targetRef = qnaWriteRef.current ? qnaWriteRef : qnaRef;
        break;
      case "return":
        targetRef = returnRef;
        break;
      default:
        return;
    }

    if (targetRef && targetRef.current) {
      const yOffset = -200;
      const element = targetRef.current;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    if (quantity <= 1) {
      alert("최소 주문 수량은 1개입니다.");
      return;
    }
    setQuantity((prev) => prev - 1);
  };

  const getTotalPrice = () => {
    if (!product) return 0;
    const pricePerUnit =
      product.salePrice && product.salePrice < product.price
        ? product.salePrice
        : product.price;
    return pricePerUnit * quantity;
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    const productInfo = {
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      quantity: quantity,
      thumbnailImage: product.thumbnailImage,
    };

    navigate("/user/order-payment", {
      state: {
        products: [productInfo],
        fromCart: false,
      },
    });
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    try {
      const response = await cartAPI.addToCart(product.id, quantity);
      if (response.success) {
        if (
          window.confirm(
            "상품이 장바구니에 추가되었습니다. 장바구니로 이동하시겠습니까?"
          )
        ) {
          navigate("/cart");
        }
      } else {
        alert(response.message || "장바구니 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("장바구니 추가 오류:", error);
      alert("장바구니에 상품을 추가하는 중 오류가 발생했습니다.");
    }
  };

  const handleFavoriteToggle = async () => {
    try {
      const result = await favoriteAPI.toggle(product.id);

      if (result.success) {
        setIsFavorite(result.isFavorite);
      }
    } catch (error) {
      console.error("찜하기 오류:", error);
    }
  };

  const handleSubmitReview = async () => {
  if (!isAuthenticated) {
    alert("로그인이 필요합니다.");
    navigate("/login");
    return;
  }

  if (!reviewContent.trim()) {
    alert("리뷰 내용을 입력해주세요.");
    return;
  }

  if (rating === 0) {
    alert("별점을 선택해주세요.");
    return;
  }

  // FormData 생성
  const formData = new FormData();
  formData.append("productId", product.id);
  formData.append("content", reviewContent);
  formData.append("rating", rating);
  formData.append("userId", user.id);

  // 이미지 첨부
  reviewImages.forEach((item) => {
    formData.append("images", item.file);
  });

  try {
    const response = await reviewAPI.createReview(formData);

    if (response.success) {
      alert("리뷰가 등록되었습니다.");
      setReviewContent("");
      setRating(0);
      setReviewImages([]);  // 첨부 이미지 초기화
      // 파일 입력 필드 초기화
      if (reviewFileInputRef.current) {
        reviewFileInputRef.current.value = '';
      }
      loadReviews();
      loadProductDetail();
    } else {
      alert(response.message || "리뷰 등록에 실패했습니다.");
    }
  } catch (error) {
    console.error("리뷰 작성 오류:", error);
    alert("리뷰 작성 중 오류가 발생했습니다.");
  }
};


  const handleSubmitQna = async () => {
  if (!isAuthenticated) {
    alert("로그인이 필요합니다.");
    navigate("/login");
    return;
  }

  if (!qnaTitle.trim()) {
    alert("문의 제목을 입력해주세요.");
    return;
  }

  if (!qnaContent.trim()) {
    alert("문의 내용을 입력해주세요.");
    return;
  }

  try {
    const qnaData = {
      productId: product.id,
      title: qnaTitle,
      question: qnaContent,
      isPrivate: qnaIsPrivate,
      writer: user.username || user.userId
    };

    const response = await qnaAPI.createQna(qnaData);

    if (response.success) {
      alert("문의가 등록되었습니다.");
      setQnaTitle("");
      setQnaContent("");
      setQnaIsPrivate(false);
      loadQnas();
    } else {
      alert(response.message || "문의 등록에 실패했습니다.");
    }
  } catch (error) {
    console.error("QnA 작성 오류:", error);
    alert("문의 작성 중 오류가 발생했습니다.");
  }
};

  const handleEditReview = async (reviewId, data) => {
    try {
      const response = await reviewAPI.updateReview(reviewId, data);
      if (response.success) {
        alert("리뷰가 수정되었습니다.");
        loadReviews();
        loadProductDetail();
      } else {
        alert(response.message || "리뷰 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("리뷰 수정 오류:", error);
      alert("리뷰 수정에 실패했습니다.");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const response = await reviewAPI.deleteReview(reviewId);
      if (response.success) {
        alert("리뷰가 삭제되었습니다.");
        loadProductDetail();
        loadReviews();
      } else {
        alert(response.message || "리뷰 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("리뷰 삭제 오류:", error);
      alert("리뷰 삭제에 실패했습니다.");
    }
  };

  const handleEditQna = async (qnaId, data) => {
    try {
      const response = await qnaAPI.updateQna(qnaId, data);
      if (response.success) {
        alert("문의가 수정되었습니다.");
        loadQnas();
      } else {
        alert(response.message || "문의 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("QnA 수정 오류:", error);
      alert("문의 수정에 실패했습니다.");
    }
  };

  const handleDeleteQna = async (qnaId) => {
    try {
      const response = await qnaAPI.deleteQna(qnaId);
      if (response.success) {
        alert("문의가 삭제되었습니다.");
        loadQnas();
      } else {
        alert(response.message || "문의 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("QnA 삭제 오류:", error);
      alert("문의 삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!product) {
    return <div className="loading">상품을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="product-detail-container">
      <div className="product-detail-inner">
        <h2 className="page-title">상품 상세정보</h2>

        <div className="product-info-section">
          <div style={{ width: "100%" }}>
            <img
              src={getImageUrl(product.thumbnailImage)}
              alt={product.name}
              className="product-main-image"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                objectFit: "contain",
              }}
              onError={(e) => {
                e.target.src = "/images/item.png";
                e.target.onerror = null;
              }}
            />
          </div>

              <div className="product-info-wrapper">
     <h2 className="product-title">{product.name}</h2>
      <div className="product-rating-sum">
        <div className="product-rating">
          <span className="rating-stars">
            {(() => {
              const rating = product.averageRating || 0;
              const fullStars = Math.floor(rating);
              const hasHalfStar = (rating - fullStars) >= 0.5;
              const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

              return (
                <>
                  {Array(fullStars).fill().map((_, i) => <FaStar key={`full-${i}`} />)}
                  {hasHalfStar && <FaStarHalfAlt key="half" />}
                  {Array(emptyStars).fill().map((_, i) => <FaRegStar key={`empty-${i}`} />)}
                </>
              );
            })()}
            {(product.averageRating || 0).toFixed(1)}
            <span className="rating-sum">({product.reviewCount || 0}개 리뷰)</span>
          </span>
        </div>
      </div>

            <table className="product-info-table">
              <tbody>
                <tr>
                  <th>정상가격</th>
                  <td className="price-original">
                    {formatPrice(product.price)}
                  </td>
                </tr>
                {product.salePrice && product.salePrice < product.price && (
                  <tr>
                    <th>할인가격</th>
                    <td className="price-sale">
                      {formatPrice(product.salePrice)}
                    </td>
                  </tr>
                )}
                <tr>
                  <th>제조사</th>
                  <td>{product.manufacturer || "-"}</td>
                </tr>
                <tr>
                  <th>제조국</th>
                  <td>{product.country || "-"}</td>
                </tr>
                <tr>
                  <th>배송비</th>
                  <td>무료</td>
                </tr>
                <tr>
                  <th>판매처</th>
                  <td>On&Home</td>
                </tr>
              </tbody>
            </table>

            <div className="action-buttons">
              <button
                className="btn btn-favorite"
                onClick={handleFavoriteToggle}
              >
                {isFavorite ? "❤️" : "🤍"}
              </button>
              <button className="btn btn-buy" onClick={handleBuyNow}>
                바로구매
              </button>
              <button className="btn btn-cart" onClick={handleAddToCart}>
                장바구니 담기
              </button>
            </div>

            <div className="order-summary">
              <div className="quantity-control">
                <span>주문수량</span>
                <button className="btn-quantity" onClick={decreaseQuantity}>
                  -
                </button>
                <span className="quantity">{quantity}</span>
                <button className="btn-quantity" onClick={increaseQuantity}>
                  +
                </button>
              </div>
              <div className="total-price-wrapper">
                <span>합계금액</span>
                <span className="total-price">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="tab-menu">
          <button
            className={`tab-button ${activeTab === "detail" ? "active" : ""}`}
            onClick={() => handleTabClick("detail")}
          >
            상세정보
          </button>
          <button
            className={`tab-button ${activeTab === "review" ? "active" : ""}`}
            onClick={() => handleTabClick("review")}
          >
            리뷰 {reviews.length}
          </button>
          <button
            className={`tab-button ${activeTab === "qna" ? "active" : ""}`}
            onClick={() => handleTabClick("qna")}
          >
            Q&A {qnas.length}
          </button>
          <button
            className={`tab-button ${activeTab === "return" ? "active" : ""}`}
            onClick={() => handleTabClick("return")}
          >
            반품/교환정보
          </button>
        </div>

        {/* 상세정보 섹션 */}
        <div ref={detailRef} className="detail-section">
          {product.detailImage ? (
            <img
              src={getImageUrl(product.detailImage)}
              alt="상세 이미지"
              className="product-detail-image"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="empty-message">등록된 상세 이미지가 없습니다.</div>
          )}
        </div>

        {/* 리뷰 섹션 */}
        <div ref={reviewRef} className="review-section">
          <h2 className="section-title">리뷰 {reviews.length}</h2>
          <div className="review-list">
            {reviews.length === 0 ? (
              <div className="empty-message">등록된 리뷰가 없습니다.</div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} data-review-id={review.id} className="review-item-wrapper">
                  <ReviewItem
                    review={review}
                    onEdit={handleEditReview}
                    onDelete={handleDeleteReview}
                    // ✅ 썸네일 클릭 시 모달 열기
                    onImageClick={(src) => setImageModal({ open: true, src })}
                  />
                </div>
              ))
            )}
          </div>
           {isAuthenticated && (
              <div ref={reviewWriteRef} className="review-write-form">

                <div className="form-header">
                  <h3>리뷰 작성</h3>
                </div>

                <div className="review-write">
                  <textarea
                    className="textarea"
                    placeholder="리뷰 작성"
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                  />

                   {/* 별점 선택 컴포넌트 */} 
                    <div className="rating-row">
                      <StarRating
                        rating={rating}
                        onRatingChange={setRating}
                      />
                        <button
                          type="button"
                          className="btn-photo-upload"
                          onClick={() => reviewFileInputRef.current && reviewFileInputRef.current.click()}
                        >
                          사진 첨부
                        </button>

                    {/* 리뷰 이미지 미리보기 UI */}
                    <div className="review-image-preview-area">
                      {reviewImages.map((img, idx) => (
                        <div key={img.id || idx} className="preview-box">
                          <img
                            src={img.preview}
                            alt={`리뷰 이미지 ${idx + 1}`}
                            className="preview-image"
                            onClick={() => handleRemoveReviewImage(idx)}
                            title="클릭하면 이 이미지를 삭제합니다."
                          />
                          <button
                            type="button"
                            className="preview-remove-btn"
                            onClick={() => handleRemoveReviewImage(idx)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                       <input
                          type="file"
                          accept="image/*"
                          multiple
                          ref={reviewFileInputRef}
                          style={{ display: "none" }}
                          onChange={handleReviewImageChange}
                        />

                      </div>

                  </div>

                      {imageModal.open && (
                        <div
                          className="image-modal-backdrop"
                          onClick={() => setImageModal({ open: false, src: "" })}
                        >
                          <div
                            className="image-modal-content"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="image-modal-close"
                              onClick={() => setImageModal({ open: false, src: "" })}
                            >
                              ×
                            </button>
                            <img
                              src={imageModal.src}
                              alt="리뷰 이미지 확대"
                              className="image-modal-image"
                            />
                          </div>
                        </div>
                      )}

                  {/* ✅ 버튼들을 review-write 밖으로 */}
                  <div className="review-button-group">
                      <button className="btn btn-submit" onClick={handleSubmitReview}>
                          저장
                      </button>
                      <button className="btn-cancel-half" onClick={() => {
                          // 입력된 내용이 있을 때만 확인
                          if (reviewContent.trim() || rating > 0) {
                              if (window.confirm('작성 중인 내용이 삭제됩니다. 취소하시겠습니까?')) {
                                  setReviewContent('');
                                  setRating(0);
                              }
                          } else {
                              // 입력된 내용이 없으면 바로 초기화
                              setReviewContent('');
                              setRating(0);
                          }
                      }}>
                          취소
                      </button>
                  </div>
              </div>
          )}
        </div>

        {/* QnA 섹션 */}
        <div ref={qnaRef} className="qna-section">
          <h2 className="section-title">Q&A {qnas.length}</h2>

          <div className="qna-list">
            {qnas.length === 0 ? (
              <div className="empty-message">등록된 문의가 없습니다.</div>
            ) : (
              qnas.map((qna) => (
                <div key={qna.id} data-qna-id={qna.id} className="qna-item-container">
                  <QnaItem
                    qna={qna}
                    onEdit={handleEditQna}
                    onDelete={handleDeleteQna}
                  />
                </div>
              ))
            )}
          </div>

          {/* 문의 작성 폼 - 목록 아래에 위치 */}
          {isAuthenticated && (
            <div ref={qnaWriteRef} className="qna-write-form">
              <div className="form-header">
                <h3>문의 작성</h3>
              </div>
              <div className="input-group">
                <label>제목</label>
                <input
                  type="text"
                  className="qna-title-input"
                  placeholder="문의 제목을 입력해주세요"
                  value={qnaTitle}
                  onChange={(e) => setQnaTitle(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>내용</label>
                <textarea
                  className="qna-textarea"
                  placeholder="상품에 대한 문의 내용을 입력해주세요."
                  value={qnaContent}
                  onChange={(e) => setQnaContent(e.target.value)}
                  rows="5"
                />
              </div>

              {/* 비밀글 체크박스 추가 */}
              <div className="input-group">
                <label className="qna-private-checkbox">
                  <input
                    type="checkbox"
                    checked={qnaIsPrivate}
                    onChange={(e) => setQnaIsPrivate(e.target.checked)}
                  />
                  <span>비밀글로 작성</span>

                </label>
              </div>

              <div className="form-actions">
                <button className="btn btn-submit" onClick={handleSubmitQna}>
                  문의 등록
                </button>
                
                <button className="btn-cancel-half" onClick={() => {
                  // 입력된 내용이 있는지 확인
                  if (qnaTitle.trim() || qnaContent.trim() || qnaIsPrivate) {
                      // 내용이 있으면 확인 창 표시
                      if (window.confirm('작성 중인 내용이 삭제됩니다. 취소하시겠습니까?')) {
                          setQnaTitle('');
                          setQnaContent('');
                          setQnaIsPrivate(false);
                      }
                  } else {
                      // 입력된 내용이 없으면 바로 초기화 (확인 창 안 띄움)
                      setQnaTitle('');
                      setQnaContent('');
                      setQnaIsPrivate(false);
                  }
              }}>
                  취소
              </button>
            </div>
            </div>
          )}
        </div>

        {/* 반품/교환정보 섹션 */}
        <div ref={returnRef} className="return-section">
          <h2 className="section-title">반품/교환정보</h2>
          <div className="return-info-content">
            <div className="info-box">
              <h3>배송기간</h3>
              <p>오늘 바로 발송 시 도착</p>
              <p>
                <strong style={{ color: "#e94738", fontSize: "18px" }}>
                  {timeRemaining}
                </strong>{" "}
                내에 결제 시 오늘 바로 발송됩니다.
              </p>
              <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
                * 오늘 낮 12:00 이전까지 결제 시 당일 발송
              </p>
            </div>

            <div className="info-box">
              <h3>상품정보</h3>
              <table className="info-table">
                <tbody>
                  <tr>
                    <th>상품번호</th>
                    <td>{product.id}</td>
                    <th>상품상태</th>
                    <td>신상품</td>
                  </tr>
                  <tr>
                    <th>제조사</th>
                    <td>{product.manufacturer || "-"}</td>
                    <th>브랜드</th>
                    <td>{product.brand || "-"}</td>
                  </tr>
                  <tr>
                    <th>원산지</th>
                    <td colSpan="3">{product.country || "-"}</td>
                  </tr>
                  <tr>
                    <th>카테고리</th>
                    <td>{product.category || "-"}</td>
                    <th>재고</th>
                    <td>{product.stock || 0}개</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="info-box">
              <h3>반품/교환 안내</h3>
              <ul>
                <li>상품 수령 후 7일 이내 반품/교환 가능합니다.</li>
                <li>단순 변심의 경우 왕복 배송비가 발생할 수 있습니다.</li>
                <li>
                  상품의 하자, 오배송의 경우 무료로 반품/교환이 가능합니다.
                </li>
                <li>
                  포장을 개봉하였거나 훼손되어 상품 가치가 상실된 경우
                  반품/교환이 불가능합니다.
                </li>
                <li>
                  고객님의 책임 있는 사유로 상품이 멸실 또는 훼손된 경우
                  반품/교환이 불가능합니다.
                </li>
              </ul>
            </div>

            <div className="info-box">
              <h3>교환/반품 제한사항</h3>
              <ul>
                <li>
                  주문/제작 상품의 경우, 상품 제작이 시작된 후 취소 및 반품이
                  불가능합니다.
                </li>
                <li>
                  전자제품의 경우, 포장 개봉 시 반품/교환이 제한될 수 있습니다.
                </li>
                <li>
                  가전제품의 A/S 및 품질보증 기준은
                  소비자분쟁해결기준(공정거래위원회 고시)에 따릅니다.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
