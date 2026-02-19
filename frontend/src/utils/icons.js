
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
  FiInfo
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
  
  // Status
  Check: FiCheck,
  CheckCircle: FiCheckCircle,
  Close: FiX,
  CloseCircle: FiXCircle,
  Alert: FiAlertCircle,
  Info: FiInfo,
  
  // Other
  TrendingUp: FiTrendingUp,
  ChevronRight: FiChevronRight,
  Grid: FiGrid,
  List: FiList,
  Location: FiMapPin,
  Phone: FiPhone,
  Email: FiMail,
  Clock: FiClock,
  Calendar: FiCalendar,
  Dollar: FiDollarSign,
  Truck: FiTruck,
  Bell: BsBell,
  Notification: BsBell
};

export default Icons;