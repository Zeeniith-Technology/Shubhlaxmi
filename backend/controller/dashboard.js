import db from '../method.js';
import productSchema from '../schema/product.js';
import orderSchema from '../schema/order.js';
import categorySchema from '../schema/category.js';

class DashboardController {
    async getStats(req, res, next) {
        try {
            await db.checkTableExists('tblproducts', productSchema);
            await db.checkTableExists('tblorders', orderSchema);
            await db.checkTableExists('tblcategory', categorySchema);

            // Fetch all products to count them
            const products = await db.fetchdata({}, 'tblproducts', productSchema);
            const totalProducts = products.length;

            // Fetch all categories to count them
            const categories = await db.fetchdata({}, 'tblcategory', categorySchema);
            const totalCategories = categories.length;

            // Fetch all orders to count and sum revenue
            const orders = await db.fetchdata({}, 'tblorders', orderSchema);
            const totalOrders = orders.length;

            // Calculate revenue (sum of all totalAmount in orders that aren't cancelled)
            let totalRevenue = 0;
            for (const order of orders) {
                if (order.status !== 'Cancelled') {
                    // Parse totalAmount which might be string or number
                    const amount = parseFloat(order.totalAmount || 0);
                    totalRevenue += amount;
                }
            }

            req.api_data = {
                totalProducts,
                totalCategories,
                totalOrders,
                totalRevenue
            };
            req.api_message = "Dashboard stats fetched successfully";
            next();
        } catch (error) {
            console.error("Dashboard stats error:", error);
            req.api_error = { statusCode: 500, message: "Failed to fetch dashboard stats", stack: error.stack };
            next();
        }
    }
}

export default new DashboardController();
