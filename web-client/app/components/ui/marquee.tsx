import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

interface MarqueeProps {
    children: React.ReactNode;
    direction?: "left" | "right" | "up" | "down";
    pauseOnHover?: boolean;
    reverse?: boolean;
    className?: string;
    speed?: number; // duration in seconds
}

export function Marquee({
    children,
    direction = "left",
    pauseOnHover = false,
    reverse = false,
    className,
    speed = 20,
}: MarqueeProps) {
    const [start, setStart] = useState(false);

    useEffect(() => {
        setStart(true);
    }, []);

    const isVertical = direction === "up" || direction === "down";

    return (
        <div
            className={cn(
                "group flex overflow-hidden p-2 [--gap:1rem] [gap:var(--gap)]",
                isVertical ? "flex-col h-full" : "flex-row w-full",
                className
            )}
        >
            {Array(2)
                .fill(0)
                .map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex shrink-0 justify-around [gap:var(--gap)]",
                            isVertical ? "flex-col min-h-full" : "flex-row min-w-full",
                            start && "animate-marquee",
                            pauseOnHover && "group-hover:[animation-play-state:paused]",
                            direction === "right" || direction === "down" ? "[animation-direction:reverse]" : ""
                        )}
                        style={{
                            animationDuration: `${speed}s`,
                        }}
                    >
                        {children}
                    </div>
                ))}
        </div>
    );
}
