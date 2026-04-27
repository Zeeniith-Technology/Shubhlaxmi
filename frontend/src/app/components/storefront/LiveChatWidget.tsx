"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, ArrowLeft, Send, Image as ImageIcon, MessageSquareText } from "lucide-react";
import Link from "next/link";

interface ChatMessage {
    id: string;
    text: string | React.ReactNode;
    isUser: boolean;
    time: string;
    isAutomated?: boolean;
}

export default function LiveChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "1",
            text: "Welcome to Shubhlaxmi! 👋 How can we help you today?",
            isUser: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAutomated: true
        }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            text: inputValue,
            isUser: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMsg]);
        setInputValue("");

        // Mock auto-responder based on keywords
        setTimeout(() => {
            let botReply: React.ReactNode = "Thank you for reaching out. One of our agents will be with you shortly.";

            const lowerInput = (newMsg.text as string)?.toString()?.toLowerCase() || "";

            if (lowerInput.includes("latest") || lowerInput.includes("new") || lowerInput.includes("arrival")) {
                botReply = (
                    <div>
                        Sure, These are our Newest Arrivals products.
                        <br /><br />
                        <Link href="/collections/latest-salwar-kameez" className="underline hover:text-[var(--brand-pink)] block mb-1">Latest Salwar Kameez</Link>
                        <Link href="/collections/latest-sarees" className="underline hover:text-[var(--brand-pink)] block mb-1">Latest Sarees Design</Link>
                        <Link href="/collections/latest-lehengas" className="underline hover:text-[var(--brand-pink)] block">Latest Lehengas</Link>
                    </div>
                );
            } else if (lowerInput.includes("budget") || lowerInput.includes("cheap")) {
                botReply = (
                    <div>
                        We have a great Budget Friendly collection! Check it out here:
                        <br /><br />
                        <Link href="/collections/budget-friendly" className="underline hover:text-[var(--brand-pink)] block mb-1">Budget Friendly Sarees</Link>
                        <Link href="/collections/1000-sarees" className="underline hover:text-[var(--brand-pink)] block">₹1000 Sarees</Link>
                    </div>
                );
            } else if (lowerInput.includes("video") || lowerInput.includes("appointment")) {
                botReply = (
                    <div>
                        You can book a Live Video Shopping appointment directly from our site!
                        <br /><br />
                        <Link href="/video-appointment" className="font-bold underline text-[var(--brand-pink)] block">Book Appointment Here</Link>
                    </div>
                );
            }

            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: botReply,
                isUser: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isAutomated: true
            };
            setMessages(prev => [...prev, botMsg]);
        }, 1000);
    };

    return (
        <>
            {/* The Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[360px] max-w-[calc(100vw-48px)] h-[550px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden border border-gray-100">
                    {/* Header */}
                    <div className="bg-[#ea2083] text-white p-4 flex items-center justify-center relative shadow-sm">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute left-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h3 className="font-bold text-lg tracking-wider uppercase">Shubhlaxmi</h3>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.isUser ? "self-end items-end" : "self-start items-start"}`}>
                                <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${msg.isUser ? "bg-[#ea2083] text-white rounded-tr-sm" : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"}`}>
                                    {msg.text}
                                </div>
                                <div className={`text-[11px] text-gray-400 mt-1 flex items-center gap-1 ${msg.isUser ? "justify-end" : "justify-start"}`}>
                                    {msg.isAutomated && "Automated • "}
                                    {msg.time}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer / Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="text-[11px] text-center text-gray-400 mb-4 px-2 leading-relaxed">
                            Sign up for email promotions and updates or write a message to start a chat with SHUBHLAXMI.
                        </div>

                        <button className="w-full mb-3 py-2.5 rounded-lg border border-[#ea2083] text-[#ea2083] font-bold text-sm flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors">
                            <MessageSquareText size={18} />
                            Sign up for updates
                        </button>

                        <form onSubmit={handleSendMessage} className="relative flex items-center">
                            <button type="button" className="absolute left-3 text-[#ea2083] hover:text-pink-600 transition-colors">
                                <ImageIcon size={20} />
                            </button>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Write message"
                                className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#ea2083] focus:ring-1 focus:ring-[#ea2083] transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim()}
                                className="absolute right-3 text-gray-400 disabled:opacity-50 enabled:hover:text-[#ea2083] transition-colors"
                            >
                                <Send size={20} className={inputValue.trim() ? "fill-[var(--brand-pink)] text-[#ea2083]" : ""} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* WhatsApp Floating Button */}
            <a
                href="https://wa.me/910000000000" // Replace with actual WhatsApp number
                target="_blank"
                rel="noopener noreferrer"
                className={`fixed right-6 z-40 flex items-center justify-center w-[52px] h-[52px] bg-[#25D366] text-white rounded-full shadow-lg hover:bg-[#1ebe57] transition-all duration-300
                    ${isOpen ? "opacity-0 pointer-events-none scale-75 bottom-24" : "opacity-100 scale-100 bottom-[88px]"}
                `}
                aria-label="Chat on WhatsApp"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-7 h-7">
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157.1zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                </svg>
            </a>

            {/* Persistent Circular Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 flex items-center justify-center shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-pink-300
                    ${isOpen ? "w-14 h-14 bg-[#ea2083] text-white rounded-full rotate-0" : "bg-[#ea2083] text-white px-5 py-3 rounded-xl hover:bg-[#d01e7a]"}
                `}
            >
                {isOpen ? (
                    <X size={26} className="transition-transform duration-300" />
                ) : (
                    <div className="flex items-center gap-2">
                        <MessageCircle size={22} fill="currentColor" />
                        <span className="font-bold text-[15px] tracking-wide">Live chat</span>
                    </div>
                )}
            </button>
        </>
    );
}
