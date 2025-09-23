import './footer.css'

import React from 'react'
import { useTranslation } from 'react-i18next'

const ShopeeFooter: React.FC = () => {
  const { t } = useTranslation('home')
  
  return (
    <footer className="footer">
      {/* === TOP 5 COLUMNS === */}
      <div className="footer-columns">
        {/* column 1 */}
        <div className="footer-column">
          <h4>{t('footer.customer_service')}</h4>
          <ul>
            <li><a href="#">{t('footer.help_center')}</a></li>
            <li><a href="#">{t('footer.shopee_blog')}</a></li>
            <li><a href="#">{t('footer.shopee_mall')}</a></li>
            <li><a href="#">{t('footer.buying_guide')}</a></li>
            <li><a href="#">{t('footer.selling_guide')}</a></li>
            <li><a href="#">{t('footer.shopee_pay')}</a></li>
            <li><a href="#">{t('footer.shopee_xu')}</a></li>
            <li><a href="#">{t('footer.orders')}</a></li>
            <li><a href="#">{t('footer.returns_refunds')}</a></li>
            <li><a href="#">{t('footer.contact_shopee')}</a></li>
            <li><a href="#">{t('footer.warranty_policy')}</a></li>
          </ul>
        </div>

        {/* column 2 */}
        <div className="footer-column">
          <h4>{t('footer.shopee_vietnam')}</h4>
          <ul>
            <li><a href="#">{t('footer.about_shopee')}</a></li>
            <li><a href="#">{t('footer.careers')}</a></li>
            <li><a href="#">{t('footer.terms_conditions')}</a></li>
            <li><a href="#">{t('footer.privacy_policy')}</a></li>
            <li><a href="#">{t('footer.shopee_mall')}</a></li>
            <li><a href="#">{t('footer.seller_channel')}</a></li>
            <li><a href="#">{t('footer.flash_sale')}</a></li>
            <li><a href="#">{t('footer.affiliate_marketing')}</a></li>
            <li><a href="#">{t('footer.media_contact')}</a></li>
          </ul>
        </div>

        {/* column 3 */}
        <div className="footer-column">
          <h4>{t('footer.payment_methods')}</h4>
          <div className="payment-methods">
            <img src="https://down-vn.img.susercontent.com/file/d4bbea4570b93bfd5fc652ca82a262a8" alt="Visa" />
            <img src="https://down-vn.img.susercontent.com/file/a0a9062ebe19b45c1ae0506f16af5c16" alt="Mastercard" />
            <img src="https://down-vn.img.susercontent.com/file/38fd98e55806c3b2e4535c4e4a6c4c08" alt="JCB" />
            <img src="https://down-vn.img.susercontent.com/file/bc2a874caeee705449c164be385b796c" alt="American Express" />
            <img src="https://down-vn.img.susercontent.com/file/2c46b83d84111ddc32cfd3b5995d9281" alt="Trahop" />
            <img src="https://down-vn.img.susercontent.com/file/5e3f0bee86058637ff23cfdf2e14ca09" alt="Shopee Pay" />
            <img src="https://down-vn.img.susercontent.com/file/9263fa8c83628f5deff55e2a90758b06" alt="SPay Later" />
          </div>

          <h4 style={{ marginTop: 20 }}>{t('footer.shipping_partners')}</h4>
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
          <h4>{t('footer.follow_shopee')}</h4>
          <div className="social-media">
            <a href="#"><i className="fab fa-facebook-square" /> {t('footer.facebook')}</a>
            <a href="#"><i className="fab fa-instagram" /> {t('footer.instagram')}</a>
            <a href="#"><i className="fab fa-linkedin" /> {t('footer.linkedin')}</a>
          </div>
        </div>

        {/* column 5 */}
        <div className="footer-column">
          <h4>{t('footer.download_app')}</h4>
          <div className="app-download">
            <img src="https://down-vn.img.susercontent.com/file/ad01628e90ddf248076685f73497c163" alt="App Store" />
            <img src="https://down-vn.img.susercontent.com/file/ae7dced05f7243d0f3171f786e123def" alt="Google Play" />
            <img src="https://down-vn.img.susercontent.com/file/35352374f39bdd03b25e7b83542b2cb0" alt="App Gallery" />

          </div>
        </div>
      </div>

      {/* === META TEXT === */}
      <div className="copyright">
        {t('footer.copyright')}
      </div>
      <div className="country-region">
        {t('footer.countries_regions')}
      </div>

      {/* === GREY LOWER STRIP === */}
      <div className="footer-bottom">
        <div className="bottom-links">
          <a href="#">{t('footer.privacy_policy_link')}</a>
          <a href="#">{t('footer.operating_regulations')}</a>
          <a href="#">{t('footer.shipping_policy')}</a>
          <a href="#">{t('footer.return_refund_policy')}</a>
        </div>
        <div className="bottom-logos">
          <img src="https://webmedia.com.vn/images/2021/09/logo-da-thong-bao-bo-cong-thuong-mau-xanh.png" alt="Đã đăng ký Bộ Công Thương" />
          <img src="https://quocluat.vn/photos/blog_post/truong-hop-nao-can-thong-bao-va-dang-ky-website-voi-bo-cong-thuong-3.png" alt="Đã đăng ký Bộ Công Thương" />
        </div>
        <div className="company-info">
          {t('footer.company_name')} <br />
          {t('footer.company_address')} <br />
          {t('footer.customer_care')} <br />
          {t('footer.content_manager')} <br />
          {t('footer.business_license')} <br />
          {t('footer.copyright_company')}
        </div>
      </div>
    </footer>
  );
};

export default ShopeeFooter;
