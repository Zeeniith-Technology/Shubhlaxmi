import { Phone, MapPin, Mail, MessageCircle, Clock } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getWhatsappNumber(): Promise<string> {
    try {
        const res = await fetch(`${API_BASE}/public/store-settings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
            next: { revalidate: 300 }
        });
        const data = await res.json();
        return data?.data?.whatsappNumber || "919876543210";
    } catch {
        return "919876543210";
    }
}

export default async function ContactUs() {
    const whatsappNumber = await getWhatsappNumber();

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 font-[var(--font-body)]">
            <h1 className="text-3xl md:text-4xl font-bold font-[var(--font-heading)] mb-8 tracking-widest text-[#1a1a1a]">CONTACT US</h1>

            <p className="text-gray-700 leading-relaxed text-[15px] mb-10">
                Have a question about an order, sizing, or one of our collections? We're happy to help — reach us through any of the channels below.
            </p>

            <div className="grid sm:grid-cols-2 gap-8">
                <div className="flex items-start gap-4">
                    <Phone size={20} className="text-[var(--brand-pink)] shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Customer Care</h3>
                        <a href="tel:+919898576254" className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors">
                            +91 98985 76254
                        </a>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <MessageCircle size={20} className="text-[var(--brand-pink)] shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">WhatsApp</h3>
                        <a
                            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-700 hover:text-[var(--brand-pink)] transition-colors"
                        >
                            Chat with us
                        </a>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <MapPin size={20} className="text-[var(--brand-pink)] shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Store Address</h3>
                        <p className="text-gray-700">
                            Krishna Icon, Near Townhall,<br />
                            Anand - Vidhyanagar Road,<br />
                            Anand 388001, Gujarat, India
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <Clock size={20} className="text-[var(--brand-pink)] shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Store Hours</h3>
                        <p className="text-gray-700">Monday – Saturday, 10:00 AM – 8:00 PM</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
