import express from 'express';
import loginController from './controller/login.js';
import db from './method.js';

// Import Architecture Components
import auth from './middlewares/auth.js';
import responsedata from './middlewares/responsedata.js';
import CategoryController from './controller/category.js';
import SectionController from './controller/section.js';
import ProductController from './controller/product.js';
import AttributeController from './controller/attribute.js';
import BannerController from './controller/banner.js';
import specialCollection from './controller/specialCollection.js';
import { upload } from './config/cloudinary.js';
import appointment from './controller/appointment.js';
import { getTrendingProducts, getTrendingSetting, updateTrendingSetting, getMarqueeSetting, updateMarqueeSetting } from './controller/homeSetting.js';

import * as customerAuth from './controller/customerAuth.js';
import order from './controller/order.js';
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

// 3. Category Routes
router.post('/category/add', auth, upload.single('image'), category.addcategory, responsedata);
router.post('/category/list', auth, category.listcategory, responsedata);
router.post('/category/update', auth, upload.single('image'), category.updatecategory, responsedata);
router.post('/category/delete', auth, category.deletecategory, responsedata);

// 4. Section Routes
router.post('/section/add', auth, section.addsection, responsedata);
router.post('/section/list', auth, section.listsection, responsedata);
router.post('/section/update', auth, section.updatesection, responsedata);
router.post('/section/delete', auth, section.deletesection, responsedata);

// 5. Product Routes
router.post('/product/add', auth, upload.array('images', 10), product.addproduct, responsedata);
router.post('/product/list', auth, product.listproduct, responsedata);
router.post('/product/update', auth, upload.array('images', 10), product.updateproduct, responsedata);
router.post('/product/delete', auth, product.deleteproduct, responsedata);

// 6. Bulk Section Routes
router.post('/section/bulkadd', auth, section.bulkaddsection, responsedata);
router.post('/section/bulkupdate', auth, section.bulkupdatesection, responsedata);
router.post('/section/bulkdelete', auth, section.bulkdeletesection, responsedata);

// 7. Bulk Category Routes
router.post('/category/bulkadd', auth, category.bulkaddcategory, responsedata);
router.post('/category/bulkupdate', auth, category.bulkupdatecategory, responsedata);

// 8. Settings Routes
router.post('/settings/marquee/get', auth, getMarqueeSetting, responsedata);
router.post('/settings/marquee/update', auth, updateMarqueeSetting, responsedata);
router.get('/public/marquee', getMarqueeSetting);
router.post('/category/bulkdelete', auth, category.bulkdeletecategory, responsedata);

// 8. Bulk Product Routes
router.post('/product/bulkadd', auth, product.bulkaddproduct, responsedata);
router.post('/product/bulkupdate', auth, product.bulkupdateproduct, responsedata);
router.post('/product/bulkdelete', auth, product.bulkdeleteproduct, responsedata);

// 9. Attribute Routes
router.post('/attribute/add', auth, attribute.addattribute, responsedata);
router.post('/attribute/list', auth, attribute.listattribute, responsedata);
router.post('/attribute/update', auth, attribute.updateattribute, responsedata);
router.post('/attribute/delete', auth, attribute.deleteattribute, responsedata);

// 10. Banner Routes
const bannerUpload = upload.fields([
    { name: 'desktopImage', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 }
]);
router.post('/banner/add', auth, bannerUpload, banner.addbanner, responsedata);
router.post('/banner/list', auth, banner.listbanner, responsedata);
router.post('/banner/update', auth, bannerUpload, banner.updatebanner, responsedata);
router.post('/banner/delete', auth, banner.deletebanner, responsedata);

// 10b. Special Collection Routes
const specialCollectionUpload = upload.fields([
    { name: 'image', maxCount: 1 }
]);
router.post('/special-collection/add', auth, specialCollectionUpload, specialCollection.addSpecialCollection, responsedata);
router.post('/special-collection/list', auth, specialCollection.listSpecialCollections, responsedata);
router.post('/special-collection/update', auth, specialCollectionUpload, specialCollection.updateSpecialCollection, responsedata);
router.post('/special-collection/delete', auth, specialCollection.deleteSpecialCollection, responsedata);

// 11. Public (No-Auth) Routes for Storefront
router.post('/public/banners', banner.listbanner, responsedata);
router.post('/public/categories', category.listcategory, responsedata);
router.post('/public/sections', section.listsection, responsedata);
router.post('/public/products', product.listproduct, responsedata);
router.post('/public/special-collections', specialCollection.listSpecialCollections, responsedata);

// 12. Customer Authentication Routes
router.post('/customer/register', customerAuth.register);
router.post('/customer/login', customerAuth.login);

// 13. Protected Customer Routes
router.post('/customer/profile', authCustomer, customerAuth.getProfile);
router.post('/customer/profile/update', authCustomer, customerAuth.updateProfile);
router.post('/customer/address/add', authCustomer, customerAuth.addAddress);
router.post('/customer/address/update', authCustomer, customerAuth.updateAddress);
router.post('/customer/address/delete', authCustomer, customerAuth.deleteAddress);

router.post('/customer/order/add', authCustomer, order.placeOrder, responsedata);
router.post('/customer/order/history', authCustomer, order.getMyOrders, responsedata);

// Razorpay Payment Routes (Securely auth'd to Customer)
router.post('/customer/order/create-razorpay-order', authCustomer, order.createRazorpayOrder, responsedata);
router.post('/customer/order/verify-payment', authCustomer, order.verifyPayment, responsedata);

// Admin route to view all customers
router.post('/customer/list', auth, customerAuth.listUsers);

// 14. Appointment Routes
router.post('/public/appointment/add', appointment.addappointment, responsedata);
router.post('/appointment/list', auth, appointment.listappointment, responsedata);
router.post('/appointment/update', auth, appointment.updateappointment, responsedata);
router.post('/appointment/delete', auth, appointment.deleteappointment, responsedata);

// 15. Order Routes (Admin)
router.post('/order/list', auth, order.listorders, responsedata);
router.post('/order/update-status', auth, order.updateorderstatus, responsedata);
router.post('/order/delete', auth, order.deleteorder, responsedata);

// ==========================================
// STOREFRONT - Settings APIs
// ==========================================

// Trending Styles setting & products
router.post('/settings/trending/get', getTrendingSetting);
router.post('/settings/trending/update', auth, updateTrendingSetting);
router.post('/storefront/trending-products', getTrendingProducts);

export default router;
