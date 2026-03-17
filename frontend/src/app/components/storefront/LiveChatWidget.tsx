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
