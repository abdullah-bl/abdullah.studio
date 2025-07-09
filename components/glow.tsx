"use client";

import { useState, useEffect } from "react";

export default function Glow() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Use requestAnimationFrame for smoother animations
        let animationId: number;
        let startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const cycle = Math.sin(elapsed * 0.001) * 0.5 + 0.5; // Smooth sine wave oscillation

            setIsVisible(cycle > 0.5);
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Base glow layers with different animation phases */}
            <div
                className={`absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/20 to-pink-500/30 blur-3xl transition-all duration-1000 ease-in-out ${isVisible ? "opacity-30" : "opacity-10"
                    }`}
                style={{
                    transform: `scale(${isVisible ? 1.1 : 0.9})`,
                    transition: 'opacity 1s ease-in-out, transform 2s ease-in-out'
                }}
            />

            <div
                className={`absolute inset-0 bg-gradient-to-r from-purple-500/25 via-pink-500/20 to-red-500/25 blur-3xl transition-all duration-1200 ease-in-out ${isVisible ? "opacity-25" : "opacity-8"
                    }`}
                style={{
                    transform: `scale(${isVisible ? 0.95 : 1.05}) rotate(${isVisible ? 5 : -5}deg)`,
                    transition: 'opacity 1.2s ease-in-out, transform 2.5s ease-in-out'
                }}
            />

            <div
                className={`absolute inset-0 bg-gradient-to-r from-pink-500/20 via-red-500/15 to-orange-500/20 blur-3xl transition-all duration-1400 ease-in-out ${isVisible ? "opacity-20" : "opacity-6"
                    }`}
                style={{
                    transform: `scale(${isVisible ? 1.05 : 0.95}) rotate(${isVisible ? -3 : 3}deg)`,
                    transition: 'opacity 1.4s ease-in-out, transform 3s ease-in-out'
                }}
            />

            <div
                className={`absolute inset-0 bg-gradient-to-r from-red-500/15 via-orange-500/10 to-yellow-500/15 blur-3xl transition-all duration-1600 ease-in-out ${isVisible ? "opacity-15" : "opacity-4"
                    }`}
                style={{
                    transform: `scale(${isVisible ? 0.9 : 1.1}) rotate(${isVisible ? 2 : -2}deg)`,
                    transition: 'opacity 1.6s ease-in-out, transform 3.5s ease-in-out'
                }}
            />

            <div
                className={`absolute inset-0 bg-gradient-to-r from-orange-500/10 via-yellow-500/8 to-green-500/10 blur-3xl transition-all duration-1800 ease-in-out ${isVisible ? "opacity-10" : "opacity-3"
                    }`}
                style={{
                    transform: `scale(${isVisible ? 1.15 : 0.85}) rotate(${isVisible ? -1 : 1}deg)`,
                    transition: 'opacity 1.8s ease-in-out, transform 4s ease-in-out'
                }}
            />

            <div
                className={`absolute inset-0 bg-gradient-to-r from-yellow-500/8 via-green-500/6 to-teal-500/8 blur-3xl transition-all duration-2000 ease-in-out ${isVisible ? "opacity-8" : "opacity-2"
                    }`}
                style={{
                    transform: `scale(${isVisible ? 0.8 : 1.2}) rotate(${isVisible ? 4 : -4}deg)`,
                    transition: 'opacity 2s ease-in-out, transform 4.5s ease-in-out'
                }}
            />

            <div
                className={`absolute inset-0 bg-gradient-to-r from-green-500/6 via-teal-500/4 to-blue-500/6 blur-3xl transition-all duration-2200 ease-in-out ${isVisible ? "opacity-6" : "opacity-1"
                    }`}
                style={{
                    transform: `scale(${isVisible ? 1.25 : 0.75}) rotate(${isVisible ? -6 : 6}deg)`,
                    transition: 'opacity 2.2s ease-in-out, transform 5s ease-in-out'
                }}
            />

            <div
                className={`absolute inset-0 bg-gradient-to-r from-teal-500/4 via-blue-500/3 to-purple-500/4 blur-3xl transition-all duration-2400 ease-in-out ${isVisible ? "opacity-4" : "opacity-0"
                    }`}
                style={{
                    transform: `scale(${isVisible ? 0.7 : 1.3}) rotate(${isVisible ? 7 : -7}deg)`,
                    transition: 'opacity 2.4s ease-in-out, transform 5.5s ease-in-out'
                }}
            />

            {/* Subtle radial glow for depth */}
            <div
                className={`absolute inset-0 blur-2xl transition-all duration-3000 ease-in-out ${isVisible ? "opacity-5" : "opacity-0"
                    }`}
                style={{
                    background: 'radial-gradient(circle at center, transparent 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%)',
                    transform: `scale(${isVisible ? 1.2 : 0.8})`,
                    transition: 'opacity 3s ease-in-out, transform 6s ease-in-out'
                }}
            />
        </div>
    );
}