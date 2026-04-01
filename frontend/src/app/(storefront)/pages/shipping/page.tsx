export default function ShippingPolicy() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 font-[var(--font-body)]">
            <h1 className="text-3xl md:text-4xl font-bold font-[var(--font-heading)] mb-8 tracking-widest text-[#1a1a1a]">SHIPPING POLICY</h1>
            
            <div className="space-y-6 text-gray-700 leading-relaxed text-[15px]">
                <p>Shubhlaxmi uses the best possible transport/courier agencies to deliver your product/s.</p>
                <p>Please go through the description thoroughly before placing your order.</p>
                
                <ul className="list-disc pl-5 space-y-2">
                    <li>All products shall be shipped from India.</li>
                    <li>Customers are requested to provide full addresses with the postal code and phone number.</li>
                    <li>Our average delivery time within India is 7-10 working days, in case of some unusual happenings it may take longer. Delivery timeline for make to order may differ and take up to 30 working days.</li>
                    <li>In case you purchase multiple products in one order, all products will be dispatched together.</li>
                    <li>Shipping cost will depend upon the area you have put up during check out.</li>
                    <li>Free delivery within India</li>
                    <li>Shubhlaxmi will not be liable for delays resulting from incomplete address listings or incorrect spelling or pin code errors. In such cases the customer will have to bear the reshipping charges.</li>
                </ul>

                <h2 className="text-xl font-bold text-[#1a1a1a] mt-10 mb-4 tracking-wider">INTERNATIONAL SHIPPING POLICY</h2>
                <p className="font-medium">We ship worldwide!</p>
                <p>Please go through the below description before placing your order.</p>

                <ul className="list-disc pl-5 space-y-2">
                    <li>All products shall be shipped from India.</li>
                    <li>It takes about 20-25 working days to ship the international orders. In case of any mishap, it may take a bit longer than usual.</li>
                    <li>You can track your order online.</li>
                </ul>
            </div>
        </div>
    );
}
