"use client";

import GoogleMap from "@/components/GoogleMap";
import Sidebar from "@/components/Sidebar";
import { Toggle, GooeyFilter } from "@/components/LiquidToggle";
import { AnimatePresence } from "framer-motion";
import StreetViewPopup from "@/components/StreetViewPopup";
import { useState, useEffect, useRef } from "react";
import { fetchCCTVLocations, type CCTVLocation, type Dial112Call, streamDial112Calls } from "@/services/externalApi";

export default function Home() {
	// State for selected point and search
	const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number; zoom?: number } | undefined>();
	const [searchQuery, setSearchQuery] = useState("");
	const [clickedPoint, setClickedPoint] = useState<{ lat: number; lng: number; title?: string; group?: string } | null>(null);
	const [kmlLayerVisible, setKmlLayerVisible] = useState(false); // Start disabled by default
	const [geoJsonLayerVisible, setGeoJsonLayerVisible] = useState(false);
	const [cctvLayerVisible, setCctvLayerVisible] = useState(false); // New CCTV layer toggle
	const [dial112Visible, setDial112Visible] = useState(false); // Dial 112 points toggle
	const [dial112HeatmapVisible, setDial112HeatmapVisible] = useState(false); // Dial 112 heatmap toggle

	// External API data state
	const [cctvLocations, setCctvLocations] = useState<CCTVLocation[]>([]);
	const [cctvLoading, setCctvLoading] = useState(false);
	const [dial112AllCalls, setDial112AllCalls] = useState<Dial112Call[]>([]); // All calls cached
	const [dial112Calls, setDial112Calls] = useState<Dial112Call[]>([]); // Visible in viewport
	const [dial112Loading, setDial112Loading] = useState(false);
	const dial112LoadingRef = useRef(false); // Track if SSE is in progress
	const [mapBounds, setMapBounds] = useState<{
		north: number;
		south: number;
		east: number;
		west: number;
		zoom: number;
	} | null>(null);

	// State for absolute URLs (client-side only)
	const [kmlAbsoluteUrl, setKmlAbsoluteUrl] = useState("/kml/nashik_gramin.kml");

	// Only construct absolute URL for GoogleMap component
	useEffect(() => {
		if (typeof window !== "undefined") {
			setKmlAbsoluteUrl(`${window.location.origin}/kml/nashik_gramin.kml`);
		}
	}, []);

	// Load CCTV data when toggle is enabled
	useEffect(() => {
		const loadCCTVData = async () => {
			if (cctvLayerVisible && cctvLocations.length === 0 && !cctvLoading) {
				setCctvLoading(true);
				try {
					console.log("🎥 Loading CCTV data...");
					const data = await fetchCCTVLocations();
					setCctvLocations(data);
					console.log(`✅ Loaded ${data.length} CCTV locations`);
				} catch (error) {
					console.error("❌ Failed to load CCTV data:", error);
				} finally {
					setCctvLoading(false);
				}
			}
		};

		loadCCTVData();
	}, [cctvLayerVisible, cctvLocations.length, cctvLoading]);

	// Load Dial 112 via SSE (cache all points, no rendering yet)
	useEffect(() => {
		let buffer: Dial112Call[] = [];
		let rafHandle: number | null = null;

		const flushBuffer = () => {
			if (buffer.length > 0) {
				setDial112AllCalls((prev) => {
					const updated = [...prev, ...buffer];
					console.log(`🚨 Dial 112 cache updated: ${updated.length} total calls`);
					return updated;
				});
				buffer = [];
			}
			rafHandle = null;
		};

		if ((dial112Visible || dial112HeatmapVisible) && !dial112LoadingRef.current) {
			console.log("🚨 Starting Dial 112 SSE stream subscription...");
			dial112LoadingRef.current = true;
			setDial112Loading(true);
			setDial112AllCalls([]);
			streamDial112Calls(
				(row) => {
					buffer.push(row);
					// Batch every 100 rows for caching
					if (buffer.length >= 100) {
						if (rafHandle !== null) cancelAnimationFrame(rafHandle);
						rafHandle = requestAnimationFrame(flushBuffer);
					}
				},
				() => {
					// Flush remaining on done
					if (rafHandle !== null) cancelAnimationFrame(rafHandle);
					flushBuffer();
					console.log("✅ Dial 112 SSE stream complete");
					setDial112Loading(false);
					dial112LoadingRef.current = false;
				},
			);
		}
		return () => {
			// Only cleanup animation frame, NOT the SSE connection
			if (rafHandle !== null) cancelAnimationFrame(rafHandle);
			// Let the SSE stream complete naturally
		};
	}, [dial112Visible, dial112HeatmapVisible]);

	// Filter Dial 112 by viewport bounds AND zoom level (decimation)
	useEffect(() => {
		if (!dial112Visible) {
			setDial112Calls([]);
			return;
		}

		if (!mapBounds) {
			console.log("⏳ Waiting for map bounds...");
			return;
		}

		if (dial112AllCalls.length === 0) {
			console.log("⏳ Waiting for Dial 112 data...");
			return;
		}

		const { north, south, east, west, zoom } = mapBounds;
		console.log(`🗺️ Map bounds (zoom ${zoom}):`, { north, south, east, west });

		// Zoom-based decimation strategy:
		// zoom < 10: Show 1 in 50 points (very zoomed out - state/country level)
		// zoom 10-11: Show 1 in 20 points (city level)
		// zoom 12-13: Show 1 in 10 points (district level)
		// zoom 14-15: Show 1 in 5 points (neighborhood level)
		// zoom >= 16: Show all points (street level)
		let skipFactor = 1;
		if (zoom < 10) skipFactor = 50;
		else if (zoom < 12) skipFactor = 20;
		else if (zoom < 14) skipFactor = 10;
		else if (zoom < 16) skipFactor = 5;

		const filtered = dial112AllCalls.filter((call, index) => {
			// First check if in viewport
			const inViewport = call.latitude >= south && call.latitude <= north && call.longitude >= west && call.longitude <= east;
			if (!inViewport) return false;

			// Then apply decimation based on zoom
			return index % skipFactor === 0;
		});

		console.log(`📍 Dial 112: ${filtered.length}/${dial112AllCalls.length} in viewport (zoom ${zoom}, skip factor ${skipFactor})`);
		setDial112Calls(filtered);
	}, [dial112Visible, mapBounds, dial112AllCalls]);

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

	// Marker groups - only real data sources
	const markerGroups = [
		{
			name: "Dial 112 Calls",
			color: "#EAB308", // Amber
			visible: dial112Visible,
			markers: dial112Calls.map((c) => ({
				position: { lat: c.latitude, lng: c.longitude },
				title: c.eventId || c.policeStation || "Dial 112 Call",
				label: "112",
			})),
		},
		// Real CCTV data from external API
		{
			name: "CCTV Cameras",
			color: "#F97316", // Orange
			visible: cctvLayerVisible,
			markers: cctvLocations.map((cctv) => ({
				position: {
					lat: typeof cctv.latitude === "string" ? parseFloat(cctv.latitude) : cctv.latitude,
					lng: typeof cctv.longitude === "string" ? parseFloat(cctv.longitude) : cctv.longitude,
				},
				title: cctv.name || cctv.location_name || `CCTV ${cctv.id}`,
				label: cctv.is_working ? "🎥" : "📷",
				extraData: {
					address: cctv.address,
					cameraType: cctv.camera_type,
					isWorking: cctv.is_working,
					ward: cctv.ward,
					installationDate: cctv.installation_date,
				},
			})),
		},
	];

	// Dial 112 heatmap data
	const dial112HeatmapData = {
		data: dial112AllCalls.map((call) => ({
			position: { lat: call.latitude, lng: call.longitude },
			weight: 1,
		})),
		visible: dial112HeatmapVisible,
		radius: 20,
		opacity: 0.6,
		gradient: [
			"rgba(234, 179, 8, 0)", // amber transparent
			"rgba(234, 179, 8, 0.4)",
			"rgba(251, 191, 36, 0.6)",
			"rgba(245, 158, 11, 0.8)",
			"rgba(217, 119, 6, 1)",
			"rgba(180, 83, 9, 1)",
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
					description: `${group.name} location in Nashik Gramin`,
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

	// Handle CCTV toggle
	const handleCCTVToggle = (visible: boolean) => {
		console.log("🎥 Page: CCTV toggle handler called with:", visible);
		setCctvLayerVisible(visible);
		console.log("🎥 Page: CCTV toggle completed, new visible state should be:", visible);
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

							{/* CCTV Layer Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🎥 CCTV Cameras</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												cctvLayerVisible ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{cctvLayerVisible ? "ON" : "OFF"}
										</span>
										{cctvLoading && <div className="w-3 h-3 border border-orange-400 border-t-transparent rounded-full animate-spin"></div>}
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Real-time surveillance cameras ({cctvLocations.length} locations)</p>
								</div>
								<Toggle
									checked={cctvLayerVisible}
									onCheckedChange={handleCCTVToggle}
									variant="warning"
								/>
							</div>

							{/* Dial 112 Points Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🚨 Dial 112 Points</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												dial112Visible ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{dial112Visible ? "ON" : "OFF"}
										</span>
										{dial112Loading && <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin"></div>}
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Viewport-filtered markers ({dial112Calls.length} visible)</p>
								</div>
								<Toggle
									checked={dial112Visible}
									onCheckedChange={setDial112Visible}
									variant="warning"
								/>
							</div>

							{/* Dial 112 Heatmap Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🔥 Dial 112 Heatmap</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												dial112HeatmapVisible ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{dial112HeatmapVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Density visualization ({dial112AllCalls.length} total)</p>
								</div>
								<Toggle
									checked={dial112HeatmapVisible}
									onCheckedChange={setDial112HeatmapVisible}
									variant="warning"
								/>
							</div>
						</div>

						{/* Layer Statistics */}
						<div className="border-t border-gray-700/50 pt-3 mt-4">
							<div className="text-xs text-gray-500 space-y-1">
								<div className="flex justify-between">
									<span>Active Layers:</span>
									<span className="font-medium">{[kmlLayerVisible, geoJsonLayerVisible, cctvLayerVisible, dial112Visible, dial112HeatmapVisible].filter(Boolean).length}/5</span>
								</div>
								<div className="flex justify-between">
									<span>Dial 112 Calls:</span>
									<span className="font-medium text-amber-400">
										{dial112Calls.length} visible / {dial112AllCalls.length} total
									</span>
								</div>
								<div className="flex justify-between">
									<span>CCTV Cameras:</span>
									<span className="font-medium text-orange-400">{cctvLocations.length}</span>
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
					heatmap={{
						data: dial112HeatmapVisible ? dial112HeatmapData.data : [],
						visible: dial112HeatmapVisible,
						radius: 20,
						opacity: 0.6,
						gradient: dial112HeatmapData.gradient,
					}}
					kmlLayer={kmlLayerConfig}
					geoJsonLayer={geoJsonLayerConfig}
					selectedPoint={selectedPoint}
					onPointClick={handlePointClick}
					searchablePoints={searchablePoints}
					onKMLToggle={handleKMLToggle}
					onGeoJSONToggle={handleGeoJSONToggle}
					onCCTVToggle={handleCCTVToggle}
					onBoundsChanged={setMapBounds}
					showLayerControls={false}
				/>

				{/* Street View popup container (top-right) */}
				<div className="pointer-events-none fixed top-20 right-4 z-[60]">
					<AnimatePresence>
						{clickedPoint && (
							<div className="pointer-events-auto">
								<StreetViewPopup
									key={`${clickedPoint.lat.toFixed(6)}_${clickedPoint.lng.toFixed(6)}`}
									point={clickedPoint}
									onClose={() => setClickedPoint(null)}
								/>
							</div>
						)}
					</AnimatePresence>
				</div>
			</div>

			{/* Add the GooeyFilter for the liquid toggle effects */}
			<GooeyFilter />
		</>
	);
}
