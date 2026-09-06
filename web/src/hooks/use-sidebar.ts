import { createContext, useContext } from "react";

export type SidebarContextProps = {
	state: "expanded" | "collapsed";
	open: boolean;
	setOpen: (open: boolean) => void;
	openMobile: boolean;
	setOpenMobile: (open: boolean) => void;
	isMobile: boolean;
	toggleSidebar: () => void;
};

/* Lives here rather than beside the components in `ui/sidebar.tsx`: exporting a
   hook from a component file breaks fast refresh, which is why
   `react/only-export-components` is error-level on `src/components/ui/**`. */
export const SidebarContext = createContext<SidebarContextProps | null>(null);

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (!context) {
		throw new Error("useSidebar must be used within a SidebarProvider.");
	}

	return context;
}
