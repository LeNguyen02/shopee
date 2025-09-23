import {
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import { createPortal } from 'react-dom'

import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import authApi from 'src/apis/auth.api'
import cartApi from 'src/apis/cart.api'
import path from 'src/constants/path'
import { AppContext } from 'src/contexts/app.context'
import { locales } from 'src/i18n/i18n'
import { getAvatarUrl, formatCurrency } from 'src/utils/utils'
import { getImageUrl } from 'src/utils/imageUtils'
import useSearchProducts from 'src/hooks/useSearchProducts'

import {
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'


export default function Header() {
  const { t, i18n } = useTranslation('home')
  const currentLanguage = locales[i18n.language as keyof typeof locales]
  const { isAuthenticated, setIsAuthenticated, profile, setProfile } = useContext(AppContext)
  const navigate = useNavigate()
  
  // Search functionality
  const { onSubmitSearch, register } = useSearchProducts()

  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLLIElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const queryClient = useQueryClient()

  // Get cart count for badge
  const { data: cartCountData, error: cartCountError } = useQuery({
    queryKey: ['cart', 'count'],
    queryFn: () => cartApi.getCartCount(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Get cart data for hover preview
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.getCart(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 2 * 60 * 1000 // 2 minutes
  })

  const cartCount = cartCountData?.data.data.count || 0
  const cartItems = cartData?.data.data.items || []

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setIsAuthenticated(false)
      setProfile(null)
      queryClient.removeQueries({ queryKey: ['cart'] })
    }
  })

  const handleLogout = () => {
    console.log('Logout clicked')
    logoutMutation.mutate()
    setShowDropdown(false)
  }

  const handleCartClick = () => {
    if (!isAuthenticated) {
      navigate(path.login)
    } else {
      navigate(path.cart)
    }
  }

  const toggleDropdown = () => {
    if (!showDropdown && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        right: window.innerWidth - rect.right
      })
    }
    setShowDropdown(!showDropdown)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      // Don't close if clicking inside the dropdown or on the trigger
      if (dropdownRef.current && !dropdownRef.current.contains(target) &&
        !target.closest('[data-dropdown-content]')) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Close mobile menu on resize (when switching from mobile to desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 739) {
        setShowMobileMenu(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showMobileMenu])

  const changeLanguage = (lng: 'en' | 'vi') => {
    i18n.changeLanguage(lng)
  }
  return (
    <header id="header">
      <div className="grid wide">
        {/* start: nav */}
        <nav className="header__navbar hide-on-mobile-tablet">
          <ul className="header__navbar-list">
            <li className="header__navbar-item header__navbar-item-separate">
              {t('header.seller_channel')}
            </li>
            <a
              href="#"
              className="header__navbar-item header__navbar-item-separate"
            >
              {t('header.become_seller')}
            </a>
            <li className="header__navbar-item header__navbar-item--has-qr header__navbar-item-separate">
              {t('header.download_app')}
              {/* start: QR code */}
              <div className="header__qr">
                <img src="./assets/img/qr_code.png" alt="qr code" className="header__qr-img" />
                <div className="header__qr-apps">
                  <a
                    href="https://apps.apple.com/vn/app/id959841449"
                    target="_blank"
                    rel="noreferrer"
                    className="header__qr-link"
                  >
                    <img src="./assets/img/app_store.png" alt="App Store" className="header__qr-download-img" />
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.shopee.vn"
                    target="_blank"
                    rel="noreferrer"
                    className="header__qr-link"
                  >
                    <img src="./assets/img/google_play.png" alt="Google Play" className="header__qr-download-img" />
                  </a>
                  <a
                    href="https://appgallery.huawei.com/app/C101433653"
                    target="_blank"
                    rel="noreferrer"
                    className="header__qr-link"
                  >
                    <img src="./assets/img/app_gallery.png" alt="App Gallery" className="header__qr-download-img" />
                  </a>
                </div>
              </div>
              {/* end: QR code */}
            </li>
            <li className="header__navbar-item">
              <span className="header__navbar-title--no-pointer">{t('header.connect')}</span>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="header__navbar-icon-link"
              >
                <i className="header__navbar-icon fa-brands fa-facebook" />
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noreferrer"
                className="header__navbar-icon-link"
              >
                <i className="header__navbar-icon fa-brands fa-instagram" />
              </a>
            </li>
          </ul>
          <ul className="header__navbar-list">
            <li className="header__navbar-item header__navbar-item--has-notify">
              <a href="#" className="header__navbar-item-link">
                <i className="header__navbar-icon fa-regular fa-bell" /> {t('header.notifications')}
              </a>
              {/* start: Header Notification*/}
              <div className="header__notify">
                <div className="header__notify-main">
                  <img src="./assets/img/notification.png" alt="Notification" className="header__notify-main-img" />
                  <span className="header__notify-main-suggest">{t('header.login_to_view_notifications')}</span>
                </div>
                <div className="header__notify-footer">
                  <a href="#" className="header__notify-footer-item">{t('header.register')}</a>
                  <a href="#" className="header__notify-footer-item">{t('header.login')}</a>
                </div>
              </div>
              {/* end: Header Notification*/}
            </li>
            <li className="header__navbar-item">
              <a href="#" className="header__navbar-item-link">
                <i className="header__navbar-icon fa-regular fa-circle-question" /> {t('header.support')}
              </a>
            </li>
            <li className="header__navbar-item header__navbar-item--has-lang">
              <a href="#" className="header__navbar-item-link">
                <i className="header__navbar-icon fa-solid fa-globe" />
                <span className="header__navbar-title">{currentLanguage}</span>
                <i className="header__navbar-icon fa-solid fa-angle-down" style={{ fontSize: 12 }} />
              </a>
              {/* start: Header Language */}
              <div className="header__lang">
                <button 
                  className="header__lang-item" 
                  onClick={() => changeLanguage('vi')}
                  type="button"
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    width: '100%', 
                    textAlign: 'left',
                    fontSize: 'inherit',
                    color: 'inherit'
                  }}
                >
                  Tiếng Việt
                </button>
                <button 
                  className="header__lang-item" 
                  onClick={() => changeLanguage('en')}
                  type="button"
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    width: '100%', 
                    textAlign: 'left',
                    fontSize: 'inherit',
                    color: 'inherit'
                  }}
                >
                  English
                </button>
              </div>
              {/* end: Header Language */}
            </li>
            {!isAuthenticated && (
              <>
                <li className="header__navbar-item header__navbar-item-separate">
                  <Link to={path.register}>{t('header.register')}</Link>
                </li>
                <li className="header__navbar-item">
                  <Link to={path.login}>{t('header.login')}</Link>
                </li>
              </>
            )}
            {isAuthenticated && (
              <li className="header__navbar-item relative" ref={dropdownRef}>
                <div
                  className="flex cursor-pointer items-center"
                  onClick={toggleDropdown}
                >
                  <div className="mr-2 h-6 w-6 flex-shrink-0">
                    <img src={getAvatarUrl(profile?.avatar)} alt="avatar" className="h-full w-full rounded-full object-cover" />
                  </div>
                  <div>{profile?.email}</div>
                </div>
              </li>
            )}
            {showDropdown && createPortal(
              <div
                data-dropdown-content
                className="fixed rounded-sm border border-gray-200 bg-white shadow-md min-w-[200px]"
                style={{
                  top: dropdownPosition.top,
                  right: dropdownPosition.right,
                  zIndex: 999999999
                }}
              >
                <Link
                  to={path.profile}
                  className="block w-full bg-white py-3 px-4 text-left text-gray-800 hover:bg-slate-100 hover:text-cyan-500"
                  onClick={() => setShowDropdown(false)}
                >
                  {t('header.my_account')}
                </Link>
                <Link
                  to={path.historyPurchase}
                  className="block w-full bg-white py-3 px-4 text-left text-gray-800 hover:bg-slate-100 hover:text-cyan-500"
                  onClick={() => setShowDropdown(false)}
                >
                  {t('header.my_orders')}
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleLogout()
                  }}
                  className="block w-full bg-white py-3 px-4 text-left text-gray-800 hover:bg-slate-100 hover:text-cyan-500"
                >
                  {t('header.logout')}
                </button>
              </div>,
              document.body
            )}
          </ul>
        </nav>
        {/* end: nav */}

        {/* start: header with search */}
        <div className="header__with-search">
          <div className="header__logo hide-on-tablet">
            <a href="/" className="header__logo-link">
              <svg viewBox="0 0 192 65" className="header__logo-img">
                <g fillRule="evenodd">
                  <path
                    fill="#fff"
                    d="M35.6717403 44.953764c-.3333497 2.7510509-2.0003116 4.9543414-4.5823845 6.0575984-1.4379707.6145919-3.36871.9463856-4.896954.8421628-2.3840266-.0911143-4.6237865-.6708937-6.6883352-1.7307424-.7375522-.3788551-1.8370513-1.1352759-2.6813095-1.8437757-.213839-.1790053-.239235-.2937577-.0977428-.4944671.0764015-.1151823.2172535-.3229831.5286218-.7791994.45158-.6616533.5079208-.7446018.5587128-.8221779.14448-.2217688.3792333-.2411091.6107855-.0588804.0243289.0189105.0243289.0189105.0426824.0333083.0379873.0294402.0379873.0294402.1276204.0990653.0907002.0706996.14448.1123887.166248.1287205 2.2265285 1.7438508 4.8196989 2.7495466 7.4376251 2.8501162 3.6423042-.0496401 6.2615109-1.6873341 6.7308041-4.2020035.5160305-2.7675977-1.6565047-5.1582742-5.9070334-6.4908212-1.329344-.4166762-4.6895175-1.7616869-5.3090528-2.1250697-2.9094471-1.7071043-4.2697358-3.9430584-4.0763845-6.7048539.296216-3.8283059 3.8501677-6.6835796 8.340785-6.702705 2.0082079-.004083 4.0121475.4132378 5.937338 1.2244562.6816382.2873109 1.8987274.9496089 2.3189359 1.2633517.2420093.1777159.2898136.384872.1510957.60836-.0774686.12958-.2055158.3350171-.4754821.7632974l-.0029878.0047276c-.3553311.5640922-.3664286.5817134-.447952.7136572-.140852.2144625-.3064598.2344475-.5604202.0732783-2.0600669-1.3839063-4.3437898-2.0801572-6.8554368-2.130442-3.126914.061889-5.4706057 1.9228561-5.6246892 4.4579402-.0409751 2.2896772 1.676352 3.9613243 5.3858811 5.2358503 7.529819 2.4196871 10.4113092 5.25648 9.869029 9.7292478M26.3725216 5.42669372c4.9022893 0 8.8982174 4.65220288 9.0851664 10.47578358H17.2875686c.186949-5.8235807 4.1828771-10.47578358 9.084953-10.47578358m25.370857 11.57065968c0-.6047069-.4870064-1.0948761-1.0875481-1.0948761h-11.77736c-.28896-7.68927544-5.7774923-13.82058185-12.5059489-13.82058185-6.7282432 0-12.2167755 6.13130641-12.5057355 13.82058185l-11.79421958.0002149c-.59136492.0107446-1.06748731.4968309-1.06748731 1.0946612 0 .0285807.00106706.0569465.00320118.0848825H.99995732l1.6812605 37.0613963c.00021341.1031483.00405483.2071562.01173767.3118087.00170729.0236381.003628.0470614.00554871.0704847l.00362801.0782207.00405483.004083c.25545428 2.5789222 2.12707837 4.6560709 4.67201764 4.7519129l.00576212.0055872h37.4122078c.0177132.0002149.0354264.0004298.0531396.0004298.0177132 0 .0354264-.0002149.0531396-.0004298h.0796027l.0017073-.0015043c2.589329-.0706995 4.6867431-2.1768587 4.9082648-4.787585l.0012805-.0012893.0017073-.0350275c.0021341-.0275062.0040548-.0547975.0057621-.0823037.0040548-.065757.0068292-.1312992.0078963-.1964115l1.8344904-37.207738h-.0012805c.001067-.0186956.0014939-.0376062.0014939-.0565167M176.465457 41.1518926c.720839-2.3512494 2.900423-3.9186779 5.443734-3.9186779 2.427686 0 4.739107 1.6486899 5.537598 3.9141989l.054826.1556978h-11.082664l.046506-.1512188zm13.50267 3.4063683c.014933.0006399.014933.0006399.036906.0008531.021973-.0002132.021973-.0002132.044372-.0008531.53055-.0243144.950595-.4766911.950595-1.0271786 0-.0266606-.000853-.0496953-.00256-.0865936.000427-.0068251.000427-.020262.000427-.0635588 0-5.1926268-4.070748-9.4007319-9.09145-9.4007319-5.020488 0-9.091235 4.2081051-9.091235 9.4007319 0 .3871116.022399.7731567.067838 1.1568557l.00256.0204753.01408.1013102c.250022 1.8683731 1.047233 3.5831812 2.306302 4.9708108-.00064-.0006399.00064.0006399.007253.0078915 1.396026 1.536289 3.291455 2.5833031 5.393601 2.9748936l.02752.0053321v-.0027727l.13653.0228215c.070186.0119439.144211.0236746.243409.039031 2.766879.332724 5.221231-.0661182 7.299484-1.1127057.511777-.2578611.971928-.5423827 1.37064-.8429007.128211-.0968312.243622-.1904632.34346-.2781231.051412-.0452164.092372-.083181.114131-.1051493.468898-.4830897.498124-.6543572.215249-1.0954297-.31146-.4956734-.586228-.9179769-.821744-1.2675504-.082345-.1224254-.154023-.2267215-.214396-.3133151-.033279-.0475624-.033279-.0475624-.054399-.0776356-.008319-.0117306-.008319-.0117306-.013866-.0191956l-.00256-.0038391c-.256208-.3188605-.431565-.3480805-.715933-.0970445-.030292.0268739-.131624.1051493-.14997.1245582-1.999321 1.775381-4.729508 2.3465571-7.455854 1.7760208-.507724-.1362888-.982595-.3094759-1.419919-.5184948-1.708127-.8565509-2.918343-2.3826022-3.267563-4.1490253l-.02752-.1394881h13.754612zM154.831964 41.1518926c.720831-2.3512494 2.900389-3.9186779 5.44367-3.9186779 2.427657 0 4.739052 1.6486899 5.537747 3.9141989l.054612.1556978h-11.082534l.046505-.1512188zm13.502512 3.4063683c.015146.0006399.015146.0006399.037118.0008531.02176-.0002132.02176-.0002132.044159-.0008531.530543-.0243144.950584-.4766911.950584-1.0271786 0-.0266606-.000854-.0496953-.00256-.0865936.000426-.0068251.000426-.020262.000426-.0635588 0-5.1926268-4.070699-9.4007319-9.091342-9.4007319-5.020217 0-9.091343 4.2081051-9.091343 9.4007319 0 .3871116.022826.7731567.068051 1.1568557l.00256.0204753.01408.1013102c.250019 1.8683731 1.04722 3.5831812 2.306274 4.9708108-.00064-.0006399.00064.0006399.007254.0078915 1.396009 1.536289 3.291417 2.5833031 5.393538 2.9748936l.027519.0053321v-.0027727l.136529.0228215c.070184.0119439.144209.0236746.243619.039031 2.766847.332724 5.22117-.0661182 7.299185-1.1127057.511771-.2578611.971917-.5423827 1.370624-.8429007.128209-.0968312.243619-.1904632.343456-.2781231.051412-.0452164.09237-.083181.11413-.1051493.468892-.4830897.498118-.6543572.215246-1.0954297-.311457-.4956734-.586221-.9179769-.821734-1.2675504-.082344-.1224254-.154022-.2267215-.21418-.3133151-.033492-.0475624-.033492-.0475624-.054612-.0776356-.008319-.0117306-.008319-.0117306-.013866-.0191956l-.002346-.0038391c-.256419-.3188605-.431774-.3480805-.716138-.0970445-.030292.0268739-.131623.1051493-.149969.1245582-1.999084 1.775381-4.729452 2.3465571-7.455767 1.7760208-.507717-.1362888-.982582-.3094759-1.419902-.5184948-1.708107-.8565509-2.918095-2.3826022-3.267311-4.1490253l-.027733-.1394881h13.754451zM138.32144123 49.7357905c-3.38129629 0-6.14681004-2.6808521-6.23169343-6.04042014v-.31621743c.08401943-3.35418649 2.85039714-6.03546919 6.23169343-6.03546919 3.44242097 0 6.23320537 2.7740599 6.23320537 6.1960534 0 3.42199346-2.7907844 6.19605336-6.23320537 6.19605336m.00172791-15.67913203c-2.21776751 0-4.33682838.7553485-6.03989586 2.140764l-.19352548.1573553V34.6208558c0-.4623792-.0993546-.56419733-.56740117-.56419733h-2.17651376c-.47409424 0-.56761716.09428403-.56761716.56419733v27.6400724c0 .4539841.10583425.5641973.56761716.5641973h2.17651376c.46351081 0 .56740117-.1078454.56740117-.5641973V50.734168l.19352548.1573553c1.70328347 1.3856307 3.82234434 2.1409792 6.03989586 2.1409792 5.27140956 0 9.54473746-4.2479474 9.54473746-9.48802964 0-5.239867-4.2733279-9.48781439-9.54473746-9.48781439M115.907646 49.5240292c-3.449458 0-6.245805-2.7496948-6.245805-6.1425854 0-3.3928907 2.79656-6.1427988 6.245805-6.1427988 3.448821 0 6.24538 2.7499081 6.24538 6.1427988 0 3.3926772-2.796346 6.1425854-6.24538 6.1425854m.001914-15.5438312c-5.28187 0-9.563025 4.2112903-9.563025 9.4059406 0 5.1944369 4.281155 9.4059406 9.563025 9.4059406 5.281657 0 9.562387-4.2115037 9.562387-9.4059406 0-5.1946503-4.280517-9.4059406-9.562387-9.4059406M94.5919049 34.1890939c-1.9281307 0-3.7938902.6198995-5.3417715 1.7656047l-.188189.1393105V23.2574169c0-.4254677-.1395825-.5643476-.5649971-.5643476h-2.2782698c-.4600414 0-.5652122.1100273-.5652122.5643476v29.2834155c0 .443339.1135587.5647782.5652122.5647782h2.2782698c.4226187 0 .5649971-.1457701.5649971-.5647782v-9.5648406c.023658-3.011002 2.4931278-5.4412923 5.5299605-5.4412923 3.0445753 0 5.516841 2.4421328 5.5297454 5.4630394v9.5430935c0 .4844647.0806524.5645628.5652122.5645628h2.2726775c.481764 0 .565212-.0824666.565212-.5645628v-9.5710848c-.018066-4.8280677-4.0440197-8.7806537-8.9328471-8.7806537M62.8459442 47.7938061l-.0053397.0081519c-.3248668.4921188-.4609221.6991347-.5369593.8179812-.2560916.3812097-.224267.551113.1668119.8816949.91266.7358184 2.0858968 1.508535 2.8774525 1.8955369 2.2023021 1.076912 4.5810275 1.646045 7.1017886 1.6975309 1.6283921.0821628 3.6734936-.3050536 5.1963734-.9842376 2.7569891-1.2298679 4.5131066-3.6269626 4.8208863-6.5794607.4985136-4.7841067-2.6143125-7.7747902-10.6321784-10.1849709l-.0021359-.0006435c-3.7356476-1.2047686-5.4904836-2.8064071-5.4911243-5.0426086.1099976-2.4715346 2.4015793-4.3179454 5.4932602-4.4331449 2.4904317.0062212 4.6923065.6675996 6.8557356 2.0598624.4562232.2767364.666607.2256796.9733188-.172263.035242-.0587797.1332787-.2012238.543367-.790093l.0012815-.0019308c.3829626-.5500403.5089793-.7336731.5403767-.7879478.258441-.4863266.2214903-.6738208-.244985-1.0046173-.459427-.3290803-1.7535544-1.0024722-2.4936356-1.2978721-2.0583439-.8211991-4.1863175-1.2199998-6.3042524-1.1788111-4.8198184.1046878-8.578747 3.2393171-8.8265087 7.3515337-.1572005 2.9703036 1.350301 5.3588174 4.5000778 7.124567.8829712.4661613 4.1115618 1.6865902 5.6184225 2.1278667 4.2847814 1.2547527 6.5186944 3.5630343 6.0571315 6.2864205-.4192725 2.4743234-3.0117991 4.1199394-6.6498372 4.2325647-2.6382344-.0549182-5.2963324-1.0217793-7.6043603-2.7562084-.0115337-.0083664-.0700567-.0519149-.1779185-.1323615-.1516472-.1130543-.1516472-.1130543-.1742875-.1300017-.4705335-.3247898-.7473431-.2977598-1.0346184.1302162-.0346012.0529875-.3919333.5963776-.5681431.8632459"
                  ></path>
                </g>
              </svg>
            </a>
          </div>
          <div className="header__search-contain hide-on-mobile">
            <form className="header__search" onSubmit={onSubmitSearch}>
              <div className="header__search-input-wrap">
                <input
                  type="text"
                  className="header__search-input"
                  placeholder={t('header.search_placeholder')}
                  autoComplete="off"
                  {...register('name')}
                />
                {/* start: search history */}
                <div className="header__search-history">
                  <div className="header__search-history-heading">
                    <div className="header__search-history-text">
                      {t('header.voucher_text')}
                    </div>
                    <img className="header__search-history-img" src="./assets/img/voucher.png" alt="voucher" />
                  </div>
                  {/* <ul className="header__search-history-list">
                    <li className="header__search-history-item">
                      <button 
                        type="button"
                        onClick={() => {
                          const searchInput = document.querySelector('.header__search-input') as HTMLInputElement
                          if (searchInput) {
                            searchInput.value = 'Tay cầm chơi game'
                            onSubmitSearch({ name: 'Tay cầm chơi game' } as any)
                          }
                        }}
                        className="header__search-history-link"
                      >
                        Tay cầm chơi game
                      </button>
                    </li>
                    <li className="header__search-history-item">
                      <button 
                        type="button"
                        onClick={() => {
                          const searchInput = document.querySelector('.header__search-input') as HTMLInputElement
                          if (searchInput) {
                            searchInput.value = 'Laptop giá 0đ'
                            onSubmitSearch({ name: 'Laptop giá 0đ' } as any)
                          }
                        }}
                        className="header__search-history-link"
                      >
                        Laptop giá 0đ
                      </button>
                    </li>
                  </ul> */}
                </div>
                {/* end: search history */}
              </div>
              <button type="submit" className="header__search-btn btn btn--primary">
                <i className="header__search-icon fa-solid fa-magnifying-glass" />
              </button>
            </form>
            {/* start: header search suggest */}
            <div className="header__search-suggest hide-on-mobile-tablet">
              <div className="header__search-suggest-list">
                {(t('search_suggestions', { returnObjects: true }) as string[]).map(item => (
                  <button 
                    key={item} 
                    type="button"
                    className="header__search-suggest-item"
                    onClick={() => {
                      // Set the search input value and submit
                      const searchInput = document.querySelector('.header__search-input') as HTMLInputElement
                      if (searchInput) {
                        searchInput.value = item
                        onSubmitSearch({ name: item } as any)
                      }
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* end: header search suggest */}

          {/* Mobile-only authentication and hamburger menu - positioned on the right */}
          <div className="only-mobile" style={{ alignItems: 'center', gap: '8px' }}>            {isAuthenticated ? (
              <Link to={path.profile} aria-label="Profile">
                <img src={getAvatarUrl(profile?.avatar)} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              </Link>
            ) : (
              <>
                <Link 
                  to={path.login} 
                  style={{ 
                    color: 'white', 
                    textDecoration: 'none', 
                    fontSize: '13px',
                    padding: '6px 10px',
                    border: '1px solid white',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.color = '#ee4d2d'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'white'
                  }}
                >
                  {t('auth.login')}
                </Link>
                <Link 
                  to={path.register} 
                  style={{ 
                    color: '#ee4d2d', 
                    backgroundColor: 'white', 
                    textDecoration: 'none', 
                    fontSize: '13px',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                  }}
                >
                  {t('auth.register')}
                </Link>
              </>
            )}
            
            {/* Cart icon - part of the right group */}
            <div className="header__cart" style={{ position: 'relative' }}>
              <div className="header__cart-wrap" onClick={handleCartClick} style={{ cursor: 'pointer' }}>
                <i className="header__cart-icon fa-solid fa-cart-shopping" style={{ color: 'white', fontSize: '18px' }} />
                {cartCount > 0 && (
                  <span 
                    className="header__cart-notice" 
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: '#ee4d2d',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </div>
            </div>
            
            {/* Mobile hamburger menu - at the far right */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Menu"
            >
              <i className={`fa-solid ${showMobileMenu ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>

          {/* start: header cart - desktop only */}
          <div className="header__cart hide-on-mobile">
            <div className="header__cart-wrap" onClick={handleCartClick}>
              <i className="header__cart-icon fa-solid fa-cart-shopping" />
              {cartCount > 0 && <span className="header__cart-notice">{cartCount}</span>}
              <div className="header__cart-list">
                {cartItems.length === 0 ? (
                  <div className="header__cart-list--no-cart">
                    <div>
                      <img src="./assets/img/no_cart.png" alt="No Cart" className="header__cart-list-no-cart-img" />
                    </div>
                    <span className="header__cart-list-no-cart-msg">{t('header.no_products')}</span>
                  </div>
                ) : (
                  <div className="header__cart-list--has-cart">
                    <h4 className="header__cart-heading">{t('header.new_products')}</h4>
                    <ul className="header__cart-list-item">
                      {cartItems.slice(0, 3).map((item) => (
                        <li key={item.id} className="header__cart-item">
                          <img src={getImageUrl(item.product_image)} alt={item.product_name} className="header__cart-item-img" />
                          <div className="header__cart-item-info">
                            <h5 className="header__cart-item-name">{item.product_name}</h5>
                            <span className="header__cart-item-price">₫{formatCurrency(item.price)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="header__cart-view-cart">
                      <Link to={path.cart} className="header__cart-view-cart-btn btn btn--primary">
                        {t('header.view_cart')}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* end: header cart */}
        </div>
        {/* end: header with search */}
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div 
          className="only-mobile"
          style={{
            position: 'fixed',
            top: 'var(--header-height)',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999999,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setShowMobileMenu(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              width: '280px',
              height: '100%',
              padding: '20px',
              boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Navigation Menu */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: 'bold' }}>
                {t('header.seller_channel')}
              </h3>
              <div style={{ paddingLeft: '10px' }}>
                <a href="#" style={{ display: 'block', padding: '8px 0', color: '#666', textDecoration: 'none', fontSize: '14px' }}>
                  {t('header.become_seller')}
                </a>
                <a href="#" style={{ display: 'block', padding: '8px 0', color: '#666', textDecoration: 'none', fontSize: '14px' }}>
                  {t('header.download_app')}
                </a>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: 'bold' }}>
                {t('header.connect')}
              </h3>
              <div style={{ paddingLeft: '10px' }}>
                <a href="#" style={{ display: 'block', padding: '8px 0', color: '#666', textDecoration: 'none', fontSize: '14px' }}>
                  <i className="fa-brands fa-facebook" style={{ marginRight: '8px', color: '#1877f2' }}></i>
                  Facebook
                </a>
                <a href="#" style={{ display: 'block', padding: '8px 0', color: '#666', textDecoration: 'none', fontSize: '14px' }}>
                  <i className="fa-brands fa-instagram" style={{ marginRight: '8px', color: '#e4405f' }}></i>
                  Instagram
                </a>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: 'bold' }}>
                {t('header.notifications')}
              </h3>
              <div style={{ paddingLeft: '10px' }}>
                <a href="#" style={{ display: 'block', padding: '8px 0', color: '#666', textDecoration: 'none', fontSize: '14px' }}>
                  {t('header.login_to_view_notifications')}
                </a>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: 'bold' }}>
                {t('header.support')}
              </h3>
            </div>

            {/* Language Switcher */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: 'bold' }}>
                <i className="fa-solid fa-globe" style={{ marginRight: '8px' }}></i>
                {currentLanguage}
              </h3>
              <div style={{ paddingLeft: '10px' }}>
                <button 
                  onClick={() => {
                    changeLanguage('vi')
                    setShowMobileMenu(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 0',
                    background: 'none',
                    border: 'none',
                    color: i18n.language === 'vi' ? '#ee4d2d' : '#666',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: i18n.language === 'vi' ? 'bold' : 'normal'
                  }}
                >
                  Tiếng Việt
                </button>
                <button 
                  onClick={() => {
                    changeLanguage('en')
                    setShowMobileMenu(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 0',
                    background: 'none',
                    border: 'none',
                    color: i18n.language === 'en' ? '#ee4d2d' : '#666',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: i18n.language === 'en' ? 'bold' : 'normal'
                  }}
                >
                  English
                </button>
              </div>
            </div>

            {/* Authentication Section */}
            {!isAuthenticated && (
              <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link 
                    to={path.login}
                    onClick={() => setShowMobileMenu(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      textAlign: 'center',
                      border: '1px solid #ee4d2d',
                      borderRadius: '4px',
                      color: '#ee4d2d',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {t('auth.login')}
                  </Link>
                  <Link 
                    to={path.register}
                    onClick={() => setShowMobileMenu(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      textAlign: 'center',
                      backgroundColor: '#ee4d2d',
                      borderRadius: '4px',
                      color: 'white',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {t('auth.register')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
