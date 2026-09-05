import type { ReactNode } from "react";

import { domAnimation, LazyMotion, MotionConfig } from "motion/react";

import { character } from "@/lib/motion";

type MotionCharacter = keyof typeof character;

type MotionShellProps = {
	children: ReactNode;
	/**
	 * Default transition register for this tree.
	 * Template default is `standard`. Use `productive` on dense app shells,
	 * `calm` near money, `expressive` only on rare marketing moments.
	 */
	register?: MotionCharacter;
};

/**
 * Lazy Motion features + reduced-motion respect for routes that use `m` /
 * AnimatePresence (showcase, chat). Keep this off the entry path; product
 * home and login stay CSS-only.
 */
export function MotionShell({
	children,
	register = "standard",
}: MotionShellProps) {
	return (
		<LazyMotion features={domAnimation} strict>
			<MotionConfig reducedMotion="user" transition={character[register]}>
				{children}
			</MotionConfig>
		</LazyMotion>
	);
}
