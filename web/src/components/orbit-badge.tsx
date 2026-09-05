import { ShieldCheck } from "lucide-react";
import { useId } from "react";

import { cn } from "@/lib/utils";

interface OrbitBadgeProps {
	text: string;
	repeat?: number;
	className?: string;
	children?: React.ReactNode;
}

/**
 * Circular seal with a slowly rotating text ring and a static center mark
 * (the getversive.com compliance-badge pattern). The text sits on an SVG
 * textPath; only the ring layer rotates, the center icon stays upright.
 * Only pass claims that are true for your product; the showcase ships
 * neutral demo copy on purpose.
 */
export function OrbitBadge({
	text,
	repeat = 4,
	className,
	children,
}: OrbitBadgeProps) {
	const pathId = useId();
	const ring = `${Array.from({ length: repeat }, () => text).join(" / ")} /`;

	return (
		<div
			role="img"
			aria-label={text}
			className={cn(
				"relative size-36 rounded-full bg-linear-to-b from-primary/85 to-primary",
				className,
			)}
		>
			{/* The spin runs on a plain div: Chrome cannot composite transform
			   animations on SVG elements, so animating the svg itself forces
			   layout + paint on the main thread every frame. */}
			<div aria-hidden="true" className="absolute inset-0 animate-spin-slow">
				<svg viewBox="0 0 200 200" className="size-full">
					<defs>
						<path
							id={pathId}
							d="M 100 100 m -78 0 a 78 78 0 1 1 156 0 a 78 78 0 1 1 -156 0"
						/>
					</defs>
					<text
						className="fill-primary-foreground/40 font-bold uppercase"
						style={{ fontSize: 11, letterSpacing: "0.165em" }}
						textAnchor="middle"
					>
						<textPath href={`#${pathId}`} startOffset="50%">
							{ring}
						</textPath>
					</text>
				</svg>
			</div>
			<div className="absolute inset-0 flex items-center justify-center text-primary-foreground">
				{children ?? (
					<ShieldCheck size={40} strokeWidth={1.3} aria-hidden="true" />
				)}
			</div>
		</div>
	);
}
