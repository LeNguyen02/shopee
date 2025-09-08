import './footer.css'

import React from 'react'

const ShopeeFooter: React.FC = () => {
  return (
    <footer className="footer">
      {/* === TOP 5 COLUMNS === */}
      <div className="footer-columns">
        {/* column 1 */}
        <div className="footer-column">
          <h4>DỊCH VỤ KHÁCH HÀNG</h4>
          <ul>
            <li><a href="#">Trung Tâm Trợ Giúp Shopee</a></li>
            <li><a href="#">Shopee Blog</a></li>
            <li><a href="#">Shopee Mall</a></li>
            <li><a href="#">Hướng Dẫn Mua Hàng/Đặt Hàng</a></li>
            <li><a href="#">Hướng Dẫn Bán Hàng</a></li>
            <li><a href="#">Ví ShopeePay</a></li>
            <li><a href="#">Shopee Xu</a></li>
            <li><a href="#">Đơn Hàng</a></li>
            <li><a href="#">Trả Hàng/Hoàn Tiền</a></li>
            <li><a href="#">Liên Hệ Shopee</a></li>
            <li><a href="#">Chính Sách Bảo Hành</a></li>
          </ul>
        </div>

        {/* column 2 */}
        <div className="footer-column">
          <h4>SHOPEE VIỆT NAM</h4>
          <ul>
            <li><a href="#">Về Shopee</a></li>
            <li><a href="#">Tuyển Dụng</a></li>
            <li><a href="#">Điều Khoản Shopee</a></li>
            <li><a href="#">Chính Sách Bảo Mật</a></li>
            <li><a href="#">Shopee Mall</a></li>
            <li><a href="#">Kênh Người Bán</a></li>
            <li><a href="#">Flash Sale</a></li>
            <li><a href="#">Tiếp Thị Liên Kết</a></li>
            <li><a href="#">Liên Hệ Truyền Thông</a></li>
          </ul>
        </div>

        {/* column 3 */}
        <div className="footer-column">
          <h4>THANH TOÁN</h4>
          <div className="payment-methods">
            <img src="https://down-vn.img.susercontent.com/file/d4bbea4570b93bfd5fc652ca82a262a8" alt="Visa" />
            <img src="https://down-vn.img.susercontent.com/file/a0a9062ebe19b45c1ae0506f16af5c16" alt="Mastercard" />
            <img src="https://down-vn.img.susercontent.com/file/38fd98e55806c3b2e4535c4e4a6c4c08" alt="JCB" />
            <img src="https://down-vn.img.susercontent.com/file/bc2a874caeee705449c164be385b796c" alt="American Express" />
            <img src="https://down-vn.img.susercontent.com/file/2c46b83d84111ddc32cfd3b5995d9281" alt="Trahop" />
            <img src="https://down-vn.img.susercontent.com/file/5e3f0bee86058637ff23cfdf2e14ca09" alt="Shopee Pay" />
            <img src="https://down-vn.img.susercontent.com/file/9263fa8c83628f5deff55e2a90758b06" alt="SPay Later" />
          </div>

          <h4 style={{ marginTop: 20 }}>ĐƠN VỊ VẬN CHUYỂN</h4>
          <div className="shipping-partners">
            <img src="https://down-vn.img.susercontent.com/file/vn-11134258-7ras8-m20rc1wk8926cf" alt="SPX" />
            <img src="https://down-vn.img.susercontent.com/file/vn-50009109-64f0b242486a67a3d29fd4bcf024a8c6" alt="Viettel Post" />
            <img src="https://down-vn.img.susercontent.com/file/59270fb2f3fbb7cbc92fca3877edde3f" alt="J&T Express" />
            <img src="https://down-vn.img.susercontent.com/file/957f4eec32b963115f952835c779cd2c" alt="Grab Express" />
            <img src="https://down-vn.img.susercontent.com/file/0d349e22ca8d4337d11c9b134cf9fe63" alt="Ninja Van" />
            <img src="https://down-vn.img.susercontent.com/file/3900aefbf52b1c180ba66e5ec91190e5" alt="Best Express" />
            <img src="https://down-vn.img.susercontent.com/file/6e3be504f08f88a15a28a9a447d94d3d" alt="be" />
            <img src="https://down-vn.img.susercontent.com/file/0b3014da32de48c03340a4e4154328f6" alt="Ahamove" />
          </div>
        </div>

        {/* column 4 */}
        <div className="footer-column">
          <h4>THEO DÕI SHOPEE</h4>
          <div className="social-media">
            <a href="#"><i className="fab fa-facebook-square" /> Facebook</a>
            <a href="#"><i className="fab fa-instagram" /> Instagram</a>
            <a href="#"><i className="fab fa-linkedin" /> LinkedIn</a>
          </div>
        </div>

        {/* column 5 */}
        <div className="footer-column">
          <h4>TẢI ỨNG DỤNG SHOPEE</h4>
          <div className="app-download">
            <img src="https://down-vn.img.susercontent.com/file/ad01628e90ddf248076685f73497c163" alt="App Store" />
            <img src="https://down-vn.img.susercontent.com/file/ae7dced05f7243d0f3171f786e123def" alt="Google Play" />
            <img src="https://down-vn.img.susercontent.com/file/35352374f39bdd03b25e7b83542b2cb0" alt="App Gallery" />

          </div>
        </div>
      </div>

      {/* === META TEXT === */}
      <div className="copyright">
        © 2025 Shopee. Tất cả các quyền được bảo lưu.
      </div>
      <div className="country-region">
        Quốc gia & Khu vực: Singapore | Indonesia | Thái Lan | Malaysia |
        Việt Nam | Philippines | Brazil | México | Colombia | Chile | Đài Loan
      </div>

      {/* === GREY LOWER STRIP === */}
      <div className="footer-bottom">
        <div className="bottom-links">
          <a href="#">CHÍNH SÁCH BẢO MẬT</a>
          <a href="#">QUY CHẾ HOẠT ĐỘNG</a>
          <a href="#">CHÍNH SÁCH VẬN CHUYỂN</a>
          <a href="#">CHÍNH SÁCH TRẢ HÀNG VÀ HOÀN TIỀN</a>
        </div>
        <div className="bottom-logos">
          <img src="https://webmedia.com.vn/images/2021/09/logo-da-thong-bao-bo-cong-thuong-mau-xanh.png" alt="Đã đăng ký Bộ Công Thương" />
          <img src="https://quocluat.vn/photos/blog_post/truong-hop-nao-can-thong-bao-va-dang-ky-website-voi-bo-cong-thuong-3.png" alt="Đã đăng ký Bộ Công Thương" />
        </div>
        <div className="company-info">
          Công ty TNHH Shopee <br />
          Địa chỉ: Tầng 4-5-6, Tòa nhà Capital Place, số 29 đường Liễu Giai,
          Phường Ngọc Khánh, Quận Ba Đình, Thành phố Hà Nội, Việt Nam. <br />
          Chăm sóc khách hàng: Gọi tổng đài Shopee (miễn phí) hoặc Trò chuyện với Shopee ngay trên Trung tâm trợ giúp <br />
          Chịu Trách Nhiệm Quản Lý Nội Dung: Nguyễn Bùi Anh Tuấn <br />
          Mã số doanh nghiệp: 0106773786 do Sở Kế hoạch và Đầu tư TP Hà Nội cấp
          lần đầu ngày 10/02/2015 <br />
          © 2015 - Bản quyền thuộc về Công ty TNHH Shopee
        </div>
      </div>
    </footer>
  );
};

export default ShopeeFooter;
