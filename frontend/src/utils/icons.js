import { 
  FiShoppingCart, 
  FiHeart, 
  FiMessageCircle, 
  FiUser, 
  FiSearch,
  FiStar,
  FiPackage,
  FiTrendingUp,
  FiCheck,
  FiX,
  FiChevronRight,
  FiChevronDown, // ✅ ADD THIS for FAQ
  FiFilter,
  FiGrid,
  FiList,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiEdit2,
  FiEye,
  FiUpload,
  FiDownload,
  FiLogOut,
  FiSettings,
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiCalendar,
  FiDollarSign,
  FiTag,
  FiGift,
  FiTruck,
  FiHome,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiSend, // ✅ ADD THIS for Contact form
  FiLoader // ✅ ADD THIS for loading spinner
} from 'react-icons/fi';

import { 
  AiFillHeart,
  AiOutlineHeart,
  AiFillStar,
  AiOutlineStar
} from 'react-icons/ai';

import {
  BsShop,
  BsBoxSeam,
  BsChatDots,
  BsGift,
  BsBell,
  BsCart3
} from 'react-icons/bs';

// Export organized by category
export const Icons = {
  // Navigation
  Cart: FiShoppingCart,
  CartAlt: BsCart3,
  Messages: FiMessageCircle,
  Chat: BsChatDots,
  User: FiUser,
  Search: FiSearch,
  Home: FiHome,
  Settings: FiSettings,
  LogOut: FiLogOut,
  
  // Wishlist
  Heart: FiHeart,
  HeartFilled: AiFillHeart,
  HeartOutline: AiOutlineHeart,
  
  // Rating
  Star: FiStar,
  StarFilled: AiFillStar,
  StarOutline: AiOutlineStar,
  
  // Product/Shop
  Package: FiPackage,
  Box: BsBoxSeam,
  Shop: BsShop,
  Tag: FiTag,
  Gift: FiGift,
  GiftAlt: BsGift,
  
  // Actions
  Plus: FiPlus,
  Minus: FiMinus,
  Edit: FiEdit2,
  Delete: FiTrash2,
  View: FiEye,
  Upload: FiUpload,
  Download: FiDownload,
  Filter: FiFilter,
  Send: FiSend, // ✅ NEW
  
  // Status
  Check: FiCheck,
  CheckCircle: FiCheckCircle,
  Close: FiX,
  CloseCircle: FiXCircle,
  Alert: FiAlertCircle,
  Info: FiInfo,
  Loader: FiLoader, // ✅ NEW
  
  // Other
  TrendingUp: FiTrendingUp,
  ChevronRight: FiChevronRight,
  ChevronDown: FiChevronDown, // ✅ NEW
  Grid: FiGrid,
  List: FiList,
  Location: FiMapPin,
  MapPin: FiMapPin, // ✅ Alias
  Phone: FiPhone,
  Email: FiMail,
  Mail: FiMail, // ✅ NEW - Alias for Email
  Clock: FiClock,
  Calendar: FiCalendar,
  Dollar: FiDollarSign,
  Truck: FiTruck,
  Bell: BsBell,
  Notification: BsBell
};

export default Icons;