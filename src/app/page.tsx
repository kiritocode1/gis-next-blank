"use client";

import GoogleMap from "@/components/GoogleMap";
import Sidebar from "@/components/Sidebar";
import { Toggle, GooeyFilter } from "@/components/LiquidToggle";
import { useState, useEffect } from "react";

export default function Home() {
	// State for selected point and search
	const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number; zoom?: number } | undefined>();
	const [searchQuery, setSearchQuery] = useState("");
	const [clickedPoint, setClickedPoint] = useState<{ lat: number; lng: number; title?: string; group?: string } | null>(null);
	const [kmlLayerVisible, setKmlLayerVisible] = useState(false); // Start disabled by default
	const [geoJsonLayerVisible, setGeoJsonLayerVisible] = useState(false);
	const [markersVisible, setMarkersVisible] = useState(true); // Already enabled by default
	const [heatmapVisible, setHeatmapVisible] = useState(true); // Already enabled by default

	// State for absolute URLs (client-side only)
	const [kmlAbsoluteUrl, setKmlAbsoluteUrl] = useState("/kml/nashik_gramin.kml");

	// Only construct absolute URL for GoogleMap component
	useEffect(() => {
		if (typeof window !== "undefined") {
			setKmlAbsoluteUrl(`${window.location.origin}/kml/nashik_gramin.kml`);
		}
	}, []);

	// KML Layer configuration
	// Note: Google Maps KmlLayer requires absolute URLs, so we use window.location.origin
	const kmlLayerConfig = {
		url: kmlAbsoluteUrl,
		visible: kmlLayerVisible,
		preserveBounds: true,
		suppressInfoWindows: false,
	};

	// GeoJSON Layer configuration
	const geoJsonLayerConfig = {
		url: "/kml/nashik_gramin.geojson",
		visible: geoJsonLayerVisible,
		style: {
			strokeColor: "#FF0000",
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: "#FF0000",
			fillOpacity: 0.35,
		},
	};

	// Sample marker groups for different categories
	const markerGroups = [
		{
			name: "Parks",
			color: "#22C55E", // Green
			visible: markersVisible,
			markers: [
				{
					position: { lat: 37.7749, lng: -122.4194 },
					title: "Union Square",
				},
				{
					position: { lat: 37.7849, lng: -122.4094 },
					title: "Washington Square Park",
				},
				{
					position: { lat: 37.7549, lng: -122.4494 },
					title: "Golden Gate Park",
				},
			],
		},
		{
			name: "Bus Stations",
			color: "#3B82F6", // Blue
			visible: markersVisible,
			markers: [
				{
					position: { lat: 37.7849, lng: -122.4194 },
					title: "Montgomery Station",
				},
				{
					position: { lat: 37.7649, lng: -122.4094 },
					title: "Powell Station",
				},
				{
					position: { lat: 37.7749, lng: -122.3994 },
					title: "Embarcadero Station",
				},
				{
					position: { lat: 37.7549, lng: -122.4194 },
					title: "Civic Center Station",
				},
			],
		},
		{
			name: "Restaurants",
			color: "#EF4444", // Red
			visible: markersVisible,
			markers: [
				{
					position: { lat: 37.7949, lng: -122.4194 },
					title: "Tony's Little Star Pizza",
				},
				{
					position: { lat: 37.7849, lng: -122.4294 },
					title: "Fisherman's Wharf Seafood",
				},
				{
					position: { lat: 37.7649, lng: -122.4394 },
					title: "Chinatown Express",
				},
			],
		},
		{
			name: "Hotels",
			color: "#8B5CF6", // Purple
			visible: markersVisible,
			markers: [
				{
					position: { lat: 37.7889, lng: -122.4094 },
					title: "The Ritz-Carlton",
				},
				{
					position: { lat: 37.7789, lng: -122.4194 },
					title: "Hotel Union Square",
				},
			],
		},
	];

	// Sample heatmap data - population density or activity hotspots
	const heatmapData = {
		data: [
			// Downtown SF - High activity
			{ position: { lat: 37.7749, lng: -122.4194 }, weight: 100 },
			{ position: { lat: 37.775, lng: -122.4195 }, weight: 90 },
			{ position: { lat: 37.7748, lng: -122.4193 }, weight: 95 },
			{ position: { lat: 37.7751, lng: -122.4196 }, weight: 85 },

			// Chinatown area - Medium-high activity
			{ position: { lat: 37.7849, lng: -122.4094 }, weight: 75 },
			{ position: { lat: 37.785, lng: -122.4095 }, weight: 70 },
			{ position: { lat: 37.7848, lng: -122.4093 }, weight: 80 },

			// Financial District - High activity
			{ position: { lat: 37.7949, lng: -122.3994 }, weight: 90 },
			{ position: { lat: 37.795, lng: -122.3995 }, weight: 85 },
			{ position: { lat: 37.7948, lng: -122.3993 }, weight: 95 },

			// Mission District - Medium activity
			{ position: { lat: 37.7649, lng: -122.4194 }, weight: 60 },
			{ position: { lat: 37.765, lng: -122.4195 }, weight: 55 },
			{ position: { lat: 37.7648, lng: -122.4193 }, weight: 65 },

			// Castro District - Medium activity
			{ position: { lat: 37.7609, lng: -122.435 }, weight: 50 },
			{ position: { lat: 37.761, lng: -122.4351 }, weight: 45 },
			{ position: { lat: 37.7608, lng: -122.4349 }, weight: 55 },

			// Fisherman's Wharf - Tourist activity
			{ position: { lat: 37.8049, lng: -122.4194 }, weight: 70 },
			{ position: { lat: 37.805, lng: -122.4195 }, weight: 65 },
			{ position: { lat: 37.8048, lng: -122.4193 }, weight: 75 },

			// Golden Gate Park - Recreational activity
			{ position: { lat: 37.7694, lng: -122.4862 }, weight: 40 },
			{ position: { lat: 37.7695, lng: -122.4863 }, weight: 35 },
			{ position: { lat: 37.7693, lng: -122.4861 }, weight: 45 },
		],
		visible: heatmapVisible,
		radius: 25,
		opacity: 0.7,
		maxIntensity: 100,
		dissipating: true,
		gradient: [
			"rgba(0, 255, 255, 0)",
			"rgba(0, 255, 255, 1)",
			"rgba(0, 191, 255, 1)",
			"rgba(0, 127, 255, 1)",
			"rgba(0, 63, 255, 1)",
			"rgba(0, 0, 255, 1)",
			"rgba(0, 0, 223, 1)",
			"rgba(0, 0, 191, 1)",
			"rgba(0, 0, 159, 1)",
			"rgba(0, 0, 127, 1)",
			"rgba(63, 0, 91, 1)",
			"rgba(127, 0, 63, 1)",
			"rgba(191, 0, 31, 1)",
			"rgba(255, 0, 0, 1)",
		],
	};

	// Create searchable points from all markers
	const createSearchablePoints = () => {
		const points: Array<{
			id: string;
			position: { lat: number; lng: number };
			title: string;
			description?: string;
			tags?: string[];
			group?: string;
		}> = [];

		markerGroups.forEach((group) => {
			group.markers.forEach((marker, index) => {
				points.push({
					id: `${group.name.toLowerCase()}-${index}`,
					position: marker.position,
					title: marker.title || `${group.name} ${index + 1}`,
					description: `${group.name} location in San Francisco`,
					tags: [group.name.toLowerCase(), marker.title?.toLowerCase() || ""],
					group: group.name,
				});
			});
		});

		return points;
	};

	const searchablePoints = createSearchablePoints();

	// Search function that can be used by AI or user input
	const searchPoints = (query: string) => {
		const lowerQuery = query.toLowerCase();
		return searchablePoints.filter(
			(point) =>
				point.title.toLowerCase().includes(lowerQuery) ||
				point.group?.toLowerCase().includes(lowerQuery) ||
				point.tags?.some((tag) => tag.includes(lowerQuery)) ||
				point.description?.toLowerCase().includes(lowerQuery),
		);
	};

	// Handle KML toggle
	const handleKMLToggle = (visible: boolean) => {
		console.log("🔄 Page: KML toggle handler called with:", visible);
		console.log("🔄 Page: Current KML state before toggle:", kmlLayerVisible);
		setKmlLayerVisible(visible);
		console.log("🔄 Page: KML toggle completed, new visible state should be:", visible);
	};

	// Handle GeoJSON toggle
	const handleGeoJSONToggle = (visible: boolean) => {
		console.log("🔄 Page: GeoJSON toggle handler called with:", visible);
		console.log("🔄 Page: Current GeoJSON state before toggle:", geoJsonLayerVisible);
		console.log("🔄 Page: GeoJSON config object:", geoJsonLayerConfig);
		setGeoJsonLayerVisible(visible);
		console.log("🔄 Page: GeoJSON toggle completed, new visible state should be:", visible);
	};

	// Handle Markers toggle
	const handleMarkersToggle = (visible: boolean) => {
		console.log("📍 Page: Markers toggle handler called with:", visible);
		setMarkersVisible(visible);
		console.log("📍 Page: Markers toggle completed, new visible state should be:", visible);
	};

	// Handle Heatmap toggle
	const handleHeatmapToggle = (visible: boolean) => {
		console.log("🔥 Page: Heatmap toggle handler called with:", visible);
		setHeatmapVisible(visible);
		console.log("🔥 Page: Heatmap toggle completed, new visible state should be:", visible);
	};

	// Navigate to a specific point
	const navigateToPoint = (point: { lat: number; lng: number; zoom?: number }) => {
		setSelectedPoint(point);
	};

	// Handle marker clicks
	const handlePointClick = (point: { lat: number; lng: number; title?: string; group?: string }) => {
		setClickedPoint(point);
		console.log("Clicked point:", point); // For AI integration
	};

	// Handle search and navigation
	const handleSearch = () => {
		if (searchQuery.trim()) {
			const results = searchPoints(searchQuery);
			if (results.length > 0) {
				const firstResult = results[0];
				navigateToPoint({ ...firstResult.position, zoom: 16 });
				setClickedPoint({
					lat: firstResult.position.lat,
					lng: firstResult.position.lng,
					title: firstResult.title,
					group: firstResult.group,
				});
			}
		}
	};

	// Debug logging for render props
	console.log("🗺️ Page: Rendering with current state:", {
		kmlLayerConfig,
		geoJsonLayerConfig,
		kmlLayerVisible,
		geoJsonLayerVisible,
		kmlLayerUrl: kmlLayerConfig.url,
		geoJsonLayerUrl: geoJsonLayerConfig.url,
		kmlAbsoluteUrl,
		isClient: typeof window !== "undefined",
	});

	return (
		<>
			{/* Header */}
			<div className="fixed top-0 left-0 right-0 z-50 bg-black backdrop-blur-md border-b border-white/10">
				<div className="flex items-center justify-center h-16 px-6">
					<h1 className="text-2xl font-bold text-white tracking-wide">NASHIK GIS 2.0</h1>
				</div>
			</div>

			<Sidebar>
				<div className="space-y-4">
					<div className="space-y-3">
						<h3 className="text-sm font-medium text-gray-300 mb-3">Map Layers</h3>
						<div className="space-y-3">
							{/* KML Layer Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🗺️ KML Boundaries</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												kmlLayerVisible ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{kmlLayerVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Nashik Gramin boundaries (auto-fallback)</p>
								</div>
								<Toggle
									checked={kmlLayerVisible}
									onCheckedChange={handleKMLToggle}
									variant="success"
								/>
							</div>

							{/* Points/Markers Layer Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">📍 Points of Interest</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												markersVisible ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{markersVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Restaurants, parks, hotels & stations</p>
								</div>
								<Toggle
									checked={markersVisible}
									onCheckedChange={handleMarkersToggle}
									variant="default"
								/>
							</div>

							{/* Heatmap Layer Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🔥 Activity Heatmap</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												heatmapVisible ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{heatmapVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Population & activity density</p>
								</div>
								<Toggle
									checked={heatmapVisible}
									onCheckedChange={handleHeatmapToggle}
									variant="warning"
								/>
							</div>

							{/* GeoJSON Layer Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🗺️ GeoJSON Layer</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												geoJsonLayerVisible ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{geoJsonLayerVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Alternative boundary display</p>
								</div>
								<Toggle
									checked={geoJsonLayerVisible}
									onCheckedChange={handleGeoJSONToggle}
									variant="default"
								/>
							</div>
						</div>

						{/* Layer Statistics */}
						<div className="border-t border-gray-700/50 pt-3 mt-4">
							<div className="text-xs text-gray-500 space-y-1">
								<div className="flex justify-between">
									<span>Active Layers:</span>
									<span className="font-medium">{[kmlLayerVisible, markersVisible, heatmapVisible, geoJsonLayerVisible].filter(Boolean).length}/4</span>
								</div>
								<div className="flex justify-between">
									<span>Marker Points:</span>
									<span className="font-medium">{markerGroups.reduce((sum, group) => sum + group.markers.length, 0)}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Sidebar>

			{/* Full-screen map positioned behind sidebar and header */}
			<div className="fixed inset-0 pt-16">
				<GoogleMap
					center={{ lat: 20.0112771, lng: 74.00833808 }}
					zoom={10}
					height="100vh"
					width="100vw"
					className="w-full h-full"
					markerGroups={markerGroups}
					heatmap={heatmapData}
					kmlLayer={kmlLayerConfig}
					geoJsonLayer={geoJsonLayerConfig}
					selectedPoint={selectedPoint}
					onPointClick={handlePointClick}
					searchablePoints={searchablePoints}
					onKMLToggle={handleKMLToggle}
					onGeoJSONToggle={handleGeoJSONToggle}
					onMarkersToggle={handleMarkersToggle}
					onHeatmapToggle={handleHeatmapToggle}
					showLayerControls={false}
				/>
			</div>

			{/* Add the GooeyFilter for the liquid toggle effects */}
			<GooeyFilter />
		</>
	);
}
