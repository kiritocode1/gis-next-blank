"use client";

import { useState } from "react";

// Simple icon components to avoid external dependencies
const MapIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
		/>
	</svg>
);

const LayersIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
		/>
	</svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
		/>
	</svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
		/>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
		/>
	</svg>
);

const ChevronLeftIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M15 19l-7-7 7-7"
		/>
	</svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M9 5l7 7-7 7"
		/>
	</svg>
);

const GlobeIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
		/>
	</svg>
);

export interface SidebarProps {
	children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [activeSection, setActiveSection] = useState<string | null>("layers");

	const sidebarSections = [
		{
			id: "layers",
			icon: LayersIcon,
			title: "Layers",
			description: "Manage map layers",
		},
		{
			id: "search",
			icon: SearchIcon,
			title: "Search",
			description: "Search locations",
		},
		{
			id: "map",
			icon: GlobeIcon,
			title: "Map Settings",
			description: "Configure map display",
		},
		{
			id: "settings",
			icon: SettingsIcon,
			title: "Settings",
			description: "Application settings",
		},
	];

	const toggleSidebar = () => {
		setIsOpen(!isOpen);
		if (!isOpen) {
			setActiveSection(null);
		}
	};

	const selectSection = (sectionId: string) => {
		if (activeSection === sectionId) {
			setActiveSection(null);
		} else {
			setActiveSection(sectionId);
			if (!isOpen) {
				setIsOpen(true);
			}
		}
	};

	return (
		<div className="fixed left-0 top-0 h-full z-50 flex pointer-events-none">
			{/* Sidebar Container */}
			<div className="relative flex pointer-events-auto">
				{/* Icon Bar */}
				<div className="w-16 bg-gray-800/95 backdrop-blur-sm border-r border-gray-700/50 flex flex-col items-center py-4 space-y-2 shadow-lg">
					{/* Logo */}
					<div className="mb-6 p-2 rounded-lg bg-blue-600/20 border border-blue-500/30">
						<MapIcon className="w-6 h-6 text-blue-400" />
					</div>

					{/* Section Icons */}
					{sidebarSections.map((section) => {
						const IconComponent = section.icon;
						const isActive = activeSection === section.id;

						return (
							<button
								key={section.id}
								onClick={() => selectSection(section.id)}
								className={`
                  group relative w-10 h-10 rounded-lg flex items-center justify-center
                  transition-all duration-200 ease-out
                  ${isActive ? "bg-blue-600/30 border border-blue-500/50 text-blue-300" : "hover:bg-gray-700/50 text-gray-400 hover:text-gray-200"}
                `}
								title={section.title}
							>
								<IconComponent className="w-5 h-5" />

								{/* Tooltip */}
								<div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
									{section.title}
								</div>
							</button>
						);
					})}
				</div>

				{/* Expandable Content Panel */}
				<div
					className={`
          bg-gray-800/95 backdrop-blur-sm border-r border-gray-700/50 shadow-xl
          transition-all duration-300 ease-out overflow-hidden
          ${isOpen && activeSection ? "w-80" : "w-0"}
        `}
				>
					{activeSection && (
						<div className="h-full flex flex-col">
							{/* Header */}
							<div className="p-4 border-b border-gray-700/50">
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-lg font-semibold text-white">{sidebarSections.find((s) => s.id === activeSection)?.title}</h2>
										<p className="text-sm text-gray-400 mt-1">{sidebarSections.find((s) => s.id === activeSection)?.description}</p>
									</div>
									<button
										onClick={() => setActiveSection(null)}
										className="p-1 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-colors"
									>
										<ChevronLeftIcon className="w-4 h-4" />
									</button>
								</div>
							</div>

							{/* Content */}
							<div className="flex-1 overflow-y-auto">
								<div className="p-4">
									{activeSection === "layers" && <div className="space-y-4">{children}</div>}

									{activeSection === "search" && (
										<div className="space-y-4">
											<div className="relative">
												<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
												<input
													type="text"
													placeholder="Search locations..."
													className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
												/>
											</div>

											<div className="text-sm text-gray-400">
												<p>Quick locations:</p>
												<div className="mt-2 space-y-1">
													{["Union Square", "Golden Gate Park", "Fisherman's Wharf"].map((location) => (
														<button
															key={location}
															className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-700/50 text-gray-300 hover:text-white transition-colors"
														>
															📍 {location}
														</button>
													))}
												</div>
											</div>
										</div>
									)}

									{activeSection === "map" && (
										<div className="space-y-4">
											<div className="space-y-3">
												<label className="block text-sm font-medium text-gray-300">Map Style</label>
												<select className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
													<option>Standard</option>
													<option>Satellite</option>
													<option>Terrain</option>
													<option>Hybrid</option>
												</select>
											</div>

											<div className="space-y-3">
												<label className="block text-sm font-medium text-gray-300">Zoom Level</label>
												<input
													type="range"
													min="1"
													max="20"
													defaultValue="10"
													className="w-full accent-blue-500"
												/>
											</div>
										</div>
									)}

									{activeSection === "settings" && (
										<div className="space-y-4">
											<div className="space-y-3">
												<h3 className="text-sm font-medium text-gray-300">Preferences</h3>
												<div className="space-y-2">
													<label className="flex items-center space-x-3">
														<input
															type="checkbox"
															className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500/50"
														/>
														<span className="text-sm text-gray-300">Auto-save map state</span>
													</label>
													<label className="flex items-center space-x-3">
														<input
															type="checkbox"
															className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500/50"
														/>
														<span className="text-sm text-gray-300">Show coordinates</span>
													</label>
													<label className="flex items-center space-x-3">
														<input
															type="checkbox"
															className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500/50"
														/>
														<span className="text-sm text-gray-300">Enable clustering</span>
													</label>
												</div>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Toggle Button */}
				<button
					onClick={toggleSidebar}
					className={`
            absolute -right-3 top-6 w-6 h-6 bg-gray-700 hover:bg-gray-600 
            rounded-full border border-gray-600 flex items-center justify-center
            text-gray-300 hover:text-white transition-all duration-200 z-20 shadow-lg
            ${!isOpen ? "right-2" : ""}
          `}
				>
					{isOpen ? <ChevronLeftIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
				</button>
			</div>
		</div>
	);
}
