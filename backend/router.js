import express from 'express';
import loginController from './controller/login.js';
import db from './method.js';

// Import Architecture Components
import { auth, requireSuperAdmin, requireAdmin } from './middlewares/auth.js';
import responsedata from './middlewares/responsedata.js';
import CategoryController from './controller/category.js';
import SectionController from './controller/section.js';
import ProductController from './controller/product.js';
import AttributeController from './controller/attribute.js';
import BannerController from './controller/banner.js';
import specialCollection from './controller/specialCollection.js';
import { upload } from './config/cloudinary.js';
import appointment from './controller/appointment.js';
import discount from './controller/discount.js';
import { getTrendingProducts, getTrendingSetting, updateTrendingSetting, getMarqueeSetting, updateMarqueeSetting } from './controller/homeSetting.js';
import { getStoreSettings, updateStoreSettings } from './controller/storeSetting.js';

import * as customerAuth from './controller/customerAuth.js';
import order from './controller/order.js';
import dashboard from './controller/dashboard.js';
import authCustomer from './middlewares/customerAuth.js';

const router = express.Router();

const category = new CategoryController();
const section = new SectionController();
const product = new ProductController();
const attribute = AttributeController; // Already instantiated in the file
const banner = BannerController; // Already instantiated

// 2. Authentication Routes
router.post('/request-otp', loginController.requestOtp);
router.post('/verify-otp', loginController.verifyOtp);
router.post('/admin/login', loginController.adminLogin);

// SuperAdmin Only Routes
router.post('/superadmin/login', loginController.superAdminLogin);
router.post('/superadmin/admins/list', requireSuperAdmin, loginController.listAdmins);
router.post('/superadmin/admins/create', requireSuperAdmin, loginController.createAdmin);
router.post('/superadmin/admins/delete', requireSuperAdmin, loginController.deleteAdmin);

// 3. Category Routes
router.post('/dashboard/stats', requireAdmin, dashboard.getStats, responsedata);

router.post('/category/add', requireAdmin, upload.single('image'), category.addcategory, responsedata);
router.post('/category/list', requireAdmin, category.listcategory, responsedata);
router.post('/category/update', requireAdmin, upload.single('image'), category.updatecategory, responsedata);
router.post('/category/delete', requireAdmin, category.deletecategory, responsedata);

// 4. Section Routes
router.post('/section/add', requireAdmin, section.addsection, responsedata);
router.post('/section/list', requireAdmin, section.listsection, responsedata);
router.post('/section/update', requireAdmin, section.updatesection, responsedata);
router.post('/section/delete', requireAdmin, section.deletesection, responsedata);

// 5. Product Routes
router.post('/product/add', requireAdmin, upload.array('images', 10), product.addproduct, responsedata);
router.post('/product/list', requireAdmin, product.listproduct, responsedata);
router.post('/product/update', requireAdmin, upload.array('images', 10), product.updateproduct, responsedata);
router.post('/product/delete', requireAdmin, product.deleteproduct, responsedata);

// 6. Bulk Section Routes
router.post('/section/bulkadd', requireAdmin, section.bulkaddsection, responsedata);
router.post('/section/bulkupdate', requireAdmin, section.bulkupdatesection, responsedata);
router.post('/section/bulkdelete', requireAdmin, section.bulkdeletesection, responsedata);

// 7. Bulk Category Routes
router.post('/category/bulkadd', requireAdmin, upload.any(), category.bulkaddcategory, responsedata);
router.post('/category/bulkupdate', requireAdmin, upload.any(), category.bulkupdatecategory, responsedata);

// 8. Settings Routes
router.post('/settings/marquee/get', requireAdmin, getMarqueeSetting, responsedata);
router.post('/settings/marquee/update', requireAdmin, updateMarqueeSetting, responsedata);
router.get('/public/marquee', getMarqueeSetting);
router.post('/category/bulkdelete', requireAdmin, category.bulkdeletecategory, responsedata);

// 8. Bulk Product Routes
router.post('/product/bulkadd', requireAdmin, product.bulkaddproduct, responsedata);
router.post('/product/bulkupdate', requireAdmin, product.bulkupdateproduct, responsedata);
router.post('/product/bulkdelete', requireAdmin, product.bulkdeleteproduct, responsedata);

// 9. Attribute Routes
router.post('/attribute/add', requireAdmin, attribute.addattribute, responsedata);
router.post('/attribute/list', requireAdmin, attribute.listattribute, responsedata);
router.post('/attribute/update', requireAdmin, attribute.updateattribute, responsedata);
router.post('/attribute/delete', requireAdmin, attribute.deleteattribute, responsedata);

// 10. Banner Routes
const bannerUpload = upload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 }
]);
router.post('/banner/add', requireAdmin, bannerUpload, banner.addbanner, responsedata);
router.post('/banner/list', requireAdmin, banner.listbanner, responsedata);
router.post('/banner/update', requireAdmin, bannerUpload, banner.updatebanner, responsedata);
router.post('/banner/delete', requireAdmin, banner.deletebanner, responsedata);

// 10b. Special Collection Routes
const specialCollectionUpload = upload.fields([
    { name: 'image', maxCount: 1 }
]);
router.post('/special-collection/add', requireAdmin, specialCollectionUpload, specialCollection.addSpecialCollection, responsedata);
router.post('/special-collection/list', requireAdmin, specialCollection.listSpecialCollections, responsedata);
router.post('/special-collection/update', requireAdmin, specialCollectionUpload, specialCollection.updateSpecialCollection, responsedata);
router.post('/special-collection/delete', requireAdmin, specialCollection.deleteSpecialCollection, responsedata);

// 11. Public (No-Auth) Routes for Storefront
router.post('/public/banners', banner.listbanner, responsedata);
router.post('/public/categories', category.listcategory, responsedata);
router.post('/public/sections', section.listsection, responsedata);
router.post('/public/products', product.listproduct, responsedata);
router.post('/public/special-collections', specialCollection.listSpecialCollections, responsedata);

// 12. Customer Authentication Routes
router.post('/customer/register', customerAuth.register);
router.post('/customer/login', customerAuth.login);
router.post('/customer/forgot-password', customerAuth.forgotPassword);
router.post('/customer/reset-password', customerAuth.resetPassword);

// 13. Protected Customer Routes
router.post('/customer/profile', authCustomer, customerAuth.getProfile);
router.post('/customer/profile/update', authCustomer, customerAuth.updateProfile);
router.post('/customer/address/add', authCustomer, customerAuth.addAddress);
router.post('/customer/address/update', authCustomer, customerAuth.updateAddress);
router.post('/customer/address/delete', authCustomer, customerAuth.deleteAddress);

router.post('/customer/wishlist/get', authCustomer, customerAuth.getWishlist);
router.post('/customer/wishlist/toggle', authCustomer, customerAuth.toggleWishlist);

router.post('/customer/order/add', authCustomer, order.placeOrder, responsedata);
router.post('/customer/order/history', authCustomer, order.getMyOrders, responsedata);
router.post('/customer/appointment/history', authCustomer, appointment.getMyAppointments);

// Razorpay Payment Routes (Securely auth'd to Customer)
router.post('/customer/order/create-razorpay-order', authCustomer, order.createRazorpayOrder, responsedata);
router.post('/customer/order/verify-payment', authCustomer, order.verifyPayment, responsedata);

// Admin route to view all customers
router.post('/customer/list', requireAdmin, customerAuth.listUsers);

// 14. Appointment Routes
router.post('/public/appointment/add', appointment.addappointment, responsedata);
router.post('/public/appointment/booked-slots', appointment.listBookedSlots, responsedata);
router.post('/appointment/list', requireAdmin, appointment.listappointment, responsedata);
router.post('/appointment/update', requireAdmin, appointment.updateappointment, responsedata);
router.post('/appointment/delete', requireAdmin, appointment.deleteappointment, responsedata);

// 15. Order Routes (Admin)
router.post('/order/list', requireAdmin, order.listorders, responsedata);
router.post('/order/update-status', requireAdmin, order.updateorderstatus, responsedata);
router.post('/order/delete', requireAdmin, order.deleteorder, responsedata);

// ==========================================
// STOREFRONT - Settings APIs
// ==========================================

// Trending Styles setting & products
router.post('/settings/trending/get', getTrendingSetting);
router.post('/settings/trending/update', requireAdmin, updateTrendingSetting);
router.post('/storefront/trending-products', getTrendingProducts);

// Global Store Settings (WhatsApp Checkout, etc)
router.post('/public/store-settings', getStoreSettings);
router.post('/admin/store-settings/update', requireAdmin, updateStoreSettings);

// ==========================================
// DISCOUNT APIs
// ==========================================
router.post('/discount/add', requireAdmin, discount.addDiscount, responsedata);
router.post('/discount/list', requireAdmin, discount.listDiscounts, responsedata);
router.post('/discount/update', requireAdmin, discount.updateDiscount, responsedata);
router.post('/discount/delete', requireAdmin, discount.deleteDiscount, responsedata);
router.post('/discount/bulkdelete', requireAdmin, discount.bulkDeleteDiscounts, responsedata);

export default router;
