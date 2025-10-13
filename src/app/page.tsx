"use client";

import GoogleMap from "@/components/GoogleMap";
import Sidebar from "@/components/Sidebar";
import { Toggle, GooeyFilter } from "@/components/LiquidToggle";
import { AnimatePresence } from "framer-motion";
import StreetViewPopup from "@/components/StreetViewPopup";
import { useState, useEffect, useRef } from "react";
import {
	fetchCCTVLocations,
	type CCTVLocation,
	fetchATMLocations,
	type ATMLocation,
	fetchBankLocations,
	type BankLocation,
	fetchHospitals,
	type Hospital,
	type Dial112Call,
	streamDial112Calls,
	type AccidentRecord,
	streamAccidentData,
	fetchMapData,
	type MapDataPoint,
	fetchProcessionRoutes,
	type ProcessionRoute,
} from "@/services/externalApi";

export default function Home() {
	// State for selected point and search
	const [selectedPoint] = useState<{ lat: number; lng: number; zoom?: number } | undefined>();
	// const [searchQuery] = useState(""); // Currently unused
	const [clickedPoint, setClickedPoint] = useState<{ lat: number; lng: number; title?: string; group?: string } | null>(null);
	const [kmlLayerVisible, setKmlLayerVisible] = useState(false); // Start disabled by default
	const [geoJsonLayerVisible, setGeoJsonLayerVisible] = useState(false);
	const [cctvLayerVisible, setCctvLayerVisible] = useState(false); // New CCTV layer toggle
	const [dial112Visible, setDial112Visible] = useState(false); // Dial 112 points toggle
	const [dial112HeatmapVisible, setDial112HeatmapVisible] = useState(false); // Dial 112 heatmap toggle
	const [accidentVisible, setAccidentVisible] = useState(false); // Accident points toggle
	const [accidentHeatmapVisible, setAccidentHeatmapVisible] = useState(false); // Accident heatmap toggle

	// ATM layer state
	const [atmLayerVisible, setAtmLayerVisible] = useState(false);
	const [atmLocations, setAtmLocations] = useState<ATMLocation[]>([]);
	const [atmLoading, setAtmLoading] = useState(false);
	const [atmHeatmapVisible, setAtmHeatmapVisible] = useState(false);

	// Bank layer state
	const [bankLayerVisible, setBankLayerVisible] = useState(false);
	const [bankLocations, setBankLocations] = useState<BankLocation[]>([]);
	const [bankLoading, setBankLoading] = useState(false);
	const [bankHeatmapVisible, setBankHeatmapVisible] = useState(false);

	// Hospital layer state
	const [hospitalLayerVisible, setHospitalLayerVisible] = useState(false);
	const [hospitalLocations, setHospitalLocations] = useState<Hospital[]>([]);
	const [hospitalLoading, setHospitalLoading] = useState(false);
	const [hospitalHeatmapVisible, setHospitalHeatmapVisible] = useState(false);

	// Police station layer state
	const [policeLayerVisible, setPoliceLayerVisible] = useState(false);
	const [policeLocations, setPoliceLocations] = useState<MapDataPoint[]>([]);
	const [policeLoading, setPoliceLoading] = useState(false);
	const [policeHeatmapVisible, setPoliceHeatmapVisible] = useState(false);

	// Procession routes state
	const [processionRoutes, setProcessionRoutes] = useState<ProcessionRoute[]>([]);
	const [processionLoading, setProcessionLoading] = useState(false);
	const [processionsVisible, setProcessionsVisible] = useState<{ [festivalName: string]: boolean }>({});

	// External API data state
	const [cctvLocations, setCctvLocations] = useState<CCTVLocation[]>([]);
	const [cctvLoading, setCctvLoading] = useState(false);
	const [dial112AllCalls, setDial112AllCalls] = useState<Dial112Call[]>([]); // All calls cached
	const [dial112Calls, setDial112Calls] = useState<Dial112Call[]>([]); // Visible in viewport
	const [dial112Loading, setDial112Loading] = useState(false);
	const dial112LoadingRef = useRef(false); // Track if SSE is in progress
	const [accidentAllRecords, setAccidentAllRecords] = useState<AccidentRecord[]>([]); // All records cached
	const [accidentRecords, setAccidentRecords] = useState<AccidentRecord[]>([]); // Visible in viewport
	const [accidentLoading, setAccidentLoading] = useState(false);
	const accidentLoadingRef = useRef(false); // Track if SSE is in progress
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

	// Load ATM data when toggle is enabled
	useEffect(() => {
		const loadATMData = async () => {
			if (atmLayerVisible && atmLocations.length === 0 && !atmLoading) {
				setAtmLoading(true);
				try {
					console.log("🏧 Loading ATM data...");
					const data = await fetchATMLocations();
					setAtmLocations(data);
					console.log(`✅ Loaded ${data.length} ATM locations`);
				} catch (error) {
					console.error("❌ Failed to load ATM data:", error);
				} finally {
					setAtmLoading(false);
				}
			}
		};

		loadATMData();
	}, [atmLayerVisible, atmLocations.length, atmLoading]);

	// Load Bank data when toggle is enabled
	useEffect(() => {
		const loadBankData = async () => {
			if (bankLayerVisible && bankLocations.length === 0 && !bankLoading) {
				setBankLoading(true);
				try {
					console.log("🏦 Loading Bank data...");
					const data = await fetchBankLocations();
					setBankLocations(data);
					console.log(`✅ Loaded ${data.length} Bank locations`);
				} catch (error) {
					console.error("❌ Failed to load Bank data:", error);
				} finally {
					setBankLoading(false);
				}
			}
		};

		loadBankData();
	}, [bankLayerVisible, bankLocations.length, bankLoading]);

	// Load Hospital data when toggle is enabled
	useEffect(() => {
		const loadHospitalData = async () => {
			if (hospitalLayerVisible && hospitalLocations.length === 0 && !hospitalLoading) {
				setHospitalLoading(true);
				try {
					console.log("🏥 Loading Hospital data...");
					const data = await fetchHospitals();
					setHospitalLocations(data);
					console.log(`✅ Loaded ${data.length} Hospital locations`);
				} catch (error) {
					console.error("❌ Failed to load Hospital data:", error);
				} finally {
					setHospitalLoading(false);
				}
			}
		};

		loadHospitalData();
	}, [hospitalLayerVisible, hospitalLocations.length, hospitalLoading]);

	// Load Police Station data when toggle is enabled
	useEffect(() => {
		const loadPoliceData = async () => {
			if (policeLayerVisible && policeLocations.length === 0 && !policeLoading) {
				setPoliceLoading(true);
				try {
					console.log("🚔 Loading Police Station data...");
					const data = await fetchMapData();
					const policeStations = data.data_points.filter((item: MapDataPoint) => item.category_name === "पोलीस आस्थापना");
					setPoliceLocations(policeStations);
					console.log(`✅ Loaded ${policeStations.length} Police Station locations`);
				} catch (error) {
					console.error("❌ Failed to load Police Station data:", error);
				} finally {
					setPoliceLoading(false);
				}
			}
		};

		loadPoliceData();
	}, [policeLayerVisible, policeLocations.length, policeLoading]);

	// Load Procession Routes data when any festival toggle is enabled
	useEffect(() => {
		const loadProcessionData = async () => {
			const hasVisibleFestivals = Object.values(processionsVisible).some((visible) => visible);

			if (hasVisibleFestivals && processionRoutes.length === 0 && !processionLoading) {
				setProcessionLoading(true);
				try {
					console.log("🛤️ Loading Procession Routes data...");
					const data = await fetchProcessionRoutes();
					setProcessionRoutes(data);
					console.log(`✅ Loaded ${data.length} Procession Routes`);
				} catch (error) {
					console.error("❌ Failed to load Procession Routes data:", error);
				} finally {
					setProcessionLoading(false);
				}
			}
		};

		loadProcessionData();
	}, [processionsVisible, processionRoutes.length, processionLoading]);

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

	// Load Accident data via SSE (cache all points, no rendering yet)
	useEffect(() => {
		let buffer: AccidentRecord[] = [];
		let rafHandle: number | null = null;
		let accumulatedRecords: AccidentRecord[] = [];

		const flushBuffer = () => {
			if (buffer.length > 0) {
				console.log(`🚗 Flushing ${buffer.length} records to cache`);
				accumulatedRecords = [...accumulatedRecords, ...buffer];
				setAccidentAllRecords([...accumulatedRecords]);
				console.log(`🚗 Accident cache updated: ${accumulatedRecords.length} total records`);
				buffer = [];
			}
			rafHandle = null;
		};

		if ((accidentVisible || accidentHeatmapVisible) && !accidentLoadingRef.current) {
			console.log("🚗 Starting Accident Data SSE stream subscription...");
			accidentLoadingRef.current = true;
			setAccidentLoading(true);
			accumulatedRecords = [];
			setAccidentAllRecords([]);
			streamAccidentData(
				(row) => {
					console.log("🚗 Received accident row:", row);
					buffer.push(row);
					// Batch every 50 rows for caching (smaller batches for faster updates)
					if (buffer.length >= 50) {
						if (rafHandle !== null) cancelAnimationFrame(rafHandle);
						rafHandle = requestAnimationFrame(flushBuffer);
					}
				},
				() => {
					// Flush remaining on done
					if (rafHandle !== null) cancelAnimationFrame(rafHandle);
					flushBuffer();
					console.log("✅ Accident Data SSE stream complete");
					setAccidentLoading(false);
					accidentLoadingRef.current = false;
				},
			);
		}
		return () => {
			// Only cleanup animation frame, NOT the SSE connection
			if (rafHandle !== null) cancelAnimationFrame(rafHandle);
			// Let the SSE stream complete naturally
		};
	}, [accidentVisible, accidentHeatmapVisible]);

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

	// Filter Accident by viewport bounds AND zoom level (decimation)
	useEffect(() => {
		if (!accidentVisible) {
			setAccidentRecords([]);
			return;
		}

		if (!mapBounds) {
			console.log("⏳ Waiting for map bounds...");
			return;
		}

		if (accidentAllRecords.length === 0) {
			console.log("⏳ Waiting for Accident data...");
			return;
		}

		console.log(`🚗 Processing ${accidentAllRecords.length} accident records for viewport filtering`);
		console.log(`🚗 First few records:`, accidentAllRecords.slice(0, 3));

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

		const filtered = accidentAllRecords.filter((record, index) => {
			// First check if in viewport
			const inViewport = record.latitude >= south && record.latitude <= north && record.longitude >= west && record.longitude <= east;
			if (!inViewport) return false;

			// Then apply decimation based on zoom
			return index % skipFactor === 0;
		});

		console.log(`📍 Accident: ${filtered.length}/${accidentAllRecords.length} in viewport (zoom ${zoom}, skip factor ${skipFactor})`);
		setAccidentRecords(filtered);
	}, [accidentVisible, mapBounds, accidentAllRecords]);

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
		// ATM Locations
		{
			name: "ATM Locations",
			color: "#86EFAC", // Light green
			visible: atmLayerVisible,
			markers: atmLocations.map((atm) => ({
				position: {
					lat: typeof atm.latitude === "string" ? parseFloat(atm.latitude) : atm.latitude,
					lng: typeof atm.longitude === "string" ? parseFloat(atm.longitude) : atm.longitude,
				},
				title: atm.name || atm.bank_name || `ATM ${atm.id}`,
				label: "🏧",
				extraData: {
					bankName: atm.bank_name,
					address: atm.address,
					isWorking: atm.is_working,
					ward: atm.ward,
				},
			})),
		},
		// Bank Branches
		{
			name: "Bank Branches",
			color: "#16A34A", // Dark green
			visible: bankLayerVisible,
			markers: bankLocations.map((bank) => ({
				position: {
					lat: typeof bank.latitude === "string" ? parseFloat(bank.latitude) : bank.latitude,
					lng: typeof bank.longitude === "string" ? parseFloat(bank.longitude) : bank.longitude,
				},
				title: bank.name || bank.bank_name || `Bank ${bank.id}`,
				label: "🏦",
				extraData: {
					bankName: bank.bank_name,
					branchName: bank.branch_name,
					address: bank.address,
					ifscCode: bank.ifsc_code,
					contactNumber: bank.contact_number,
					isActive: bank.is_active,
					ward: bank.ward,
				},
			})),
		},
		// Hospitals
		{
			name: "Hospitals",
			color: "#FFFFFF", // White
			visible: hospitalLayerVisible,
			markers: hospitalLocations.map((hospital) => ({
				position: {
					lat: typeof hospital.latitude === "string" ? parseFloat(hospital.latitude) : hospital.latitude,
					lng: typeof hospital.longitude === "string" ? parseFloat(hospital.longitude) : hospital.longitude,
				},
				title: hospital.name || hospital.hospital_name || `Hospital ${hospital.id}`,
				label: "🏥",
				extraData: {
					hospitalName: hospital.hospital_name,
					address: hospital.address,
					contactNumber: hospital.contact_number,
					phone: hospital.phone,
					type: hospital.type,
					specialties: hospital.specialties,
					isActive: hospital.is_active,
					ward: hospital.ward,
				},
			})),
		},
		// Police Stations
		{
			name: "Police Stations",
			color: "#3B82F6", // Blue
			visible: policeLayerVisible,
			markers: policeLocations.map((police) => ({
				position: {
					lat: typeof police.latitude === "string" ? parseFloat(police.latitude) : police.latitude,
					lng: typeof police.longitude === "string" ? parseFloat(police.longitude) : police.longitude,
				},
				title: police.name || `Police Station ${police.id}`,
				label: "🚔",
				extraData: {
					policeName: police.name,
					address: police.address,
					description: police.description,
					status: police.status,
					verifiedBy: police.verified_by,
					verifiedAt: police.verified_at,
					imageUrl: police.image_url,
					userName: police.user_name,
					categoryName: police.category_name,
					categoryColor: police.category_color,
				},
			})),
		},
		// Accident data from CSV
		{
			name: "Accident Records",
			color: "#EF4444", // Red
			visible: accidentVisible,
			markers: (() => {
				console.log(`🚗 Creating ${accidentRecords.length} accident markers`);
				return accidentRecords.map((accident) => {
					console.log("🚗 Creating accident marker:", accident);
					return {
						position: { lat: accident.latitude, lng: accident.longitude },
						title: `Accident ${accident.srNo} - ${accident.accidentCount} accidents`,
						label: "🚗",
						extraData: {
							state: accident.state,
							district: accident.district,
							accidentCount: accident.accidentCount,
							allIndiaRank: accident.allIndiaRank,
							gridId: accident.gridId,
							ambulance: accident.ambulance,
						},
					};
				});
			})(),
		},
	];

	// Festival color palette
	const festivalColors = [
		"#EF4444", // red
		"#F97316", // orange
		"#EAB308", // amber
		"#22C55E", // green
		"#3B82F6", // blue
		"#8B5CF6", // purple
		"#EC4899", // pink
		"#06B6D4", // cyan
		"#84CC16", // lime
		"#F59E0B", // yellow
	];

	// Generate color for festival (consistent hash-based)
	const getFestivalColor = (festivalName: string) => {
		let hash = 0;
		for (let i = 0; i < festivalName.length; i++) {
			hash = festivalName.charCodeAt(i) + ((hash << 5) - hash);
		}
		return festivalColors[Math.abs(hash) % festivalColors.length];
	};

	// Process procession routes for rendering
	const processProcessionRoutes = () => {
		const groupedRoutes = processionRoutes.reduce((acc, route) => {
			if (!acc[route.festival_name]) {
				acc[route.festival_name] = [];
			}
			acc[route.festival_name].push(route);
			return acc;
		}, {} as { [festivalName: string]: ProcessionRoute[] });

		return Object.entries(groupedRoutes).map(([festivalName, routes]) => {
			const color = getFestivalColor(festivalName);
			return {
				festivalName,
				color,
				visible: processionsVisible[festivalName] || false,
				routes: routes
					.map((route) => {
						try {
							const coordinates = JSON.parse(route.route_coordinates);
							return {
								id: route.id,
								path: coordinates.map((coord: { latitude: string; longitude: string }) => ({
									lat: parseFloat(coord.latitude),
									lng: parseFloat(coord.longitude),
								})),
								startPoint: {
									lat: parseFloat(route.start_point_lat),
									lng: parseFloat(route.start_point_lng),
								},
								endPoint: {
									lat: parseFloat(route.end_point_lat),
									lng: parseFloat(route.end_point_lng),
								},
								festival_name: route.festival_name,
								procession_number: route.procession_number,
								start_address: route.start_address,
								end_address: route.end_address,
								total_distance: route.total_distance,
								description: route.description,
							};
						} catch (error) {
							console.error(`Failed to parse route coordinates for route ${route.id}:`, error);
							return null;
						}
					})
					.filter((route): route is NonNullable<typeof route> => route !== null),
			};
		});
	};

	const processedProcessionRoutes = processProcessionRoutes();

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

	// Accident heatmap data
	const accidentHeatmapData = {
		data: accidentAllRecords.map((record) => ({
			position: { lat: record.latitude, lng: record.longitude },
			weight: record.accidentCount || 1,
		})),
		visible: accidentHeatmapVisible,
		radius: 20,
		opacity: 0.6,
		gradient: [
			"rgba(239, 68, 68, 0)", // red transparent
			"rgba(239, 68, 68, 0.4)",
			"rgba(220, 38, 38, 0.6)",
			"rgba(185, 28, 28, 0.8)",
			"rgba(153, 27, 27, 1)",
			"rgba(127, 29, 29, 1)",
		],
	};

	// ATM heatmap data
	const atmHeatmapData = {
		data: atmLocations.map((atm) => ({
			position: {
				lat: typeof atm.latitude === "string" ? parseFloat(atm.latitude) : atm.latitude,
				lng: typeof atm.longitude === "string" ? parseFloat(atm.longitude) : atm.longitude,
			},
			weight: 1,
		})),
		visible: atmHeatmapVisible,
		radius: 20,
		opacity: 0.6,
		gradient: [
			"rgba(134, 239, 172, 0)", // light green transparent
			"rgba(134, 239, 172, 0.4)",
			"rgba(74, 222, 128, 0.6)",
			"rgba(34, 197, 94, 0.8)",
			"rgba(22, 163, 74, 1)",
		],
	};

	// Bank heatmap data
	const bankHeatmapData = {
		data: bankLocations.map((bank) => ({
			position: {
				lat: typeof bank.latitude === "string" ? parseFloat(bank.latitude) : bank.latitude,
				lng: typeof bank.longitude === "string" ? parseFloat(bank.longitude) : bank.longitude,
			},
			weight: 1,
		})),
		visible: bankHeatmapVisible,
		radius: 20,
		opacity: 0.6,
		gradient: [
			"rgba(22, 163, 74, 0)", // dark green transparent
			"rgba(22, 163, 74, 0.4)",
			"rgba(21, 128, 61, 0.6)",
			"rgba(20, 83, 45, 0.8)",
			"rgba(15, 46, 28, 1)",
		],
	};

	// Hospital heatmap data
	const hospitalHeatmapData = {
		data: hospitalLocations.map((hospital) => ({
			position: {
				lat: typeof hospital.latitude === "string" ? parseFloat(hospital.latitude) : hospital.latitude,
				lng: typeof hospital.longitude === "string" ? parseFloat(hospital.longitude) : hospital.longitude,
			},
			weight: 1,
		})),
		visible: hospitalHeatmapVisible,
		radius: 20,
		opacity: 0.6,
		gradient: [
			"rgba(255, 255, 255, 0)", // white transparent
			"rgba(255, 255, 255, 0.4)",
			"rgba(219, 234, 254, 0.6)",
			"rgba(147, 197, 253, 0.8)",
			"rgba(59, 130, 246, 1)",
		],
	};

	// Police Station heatmap data
	const policeHeatmapData = {
		data: policeLocations.map((police) => ({
			position: {
				lat: typeof police.latitude === "string" ? parseFloat(police.latitude) : police.latitude,
				lng: typeof police.longitude === "string" ? parseFloat(police.longitude) : police.longitude,
			},
			weight: 1,
		})),
		visible: policeHeatmapVisible,
		radius: 20,
		opacity: 0.6,
		gradient: [
			"rgba(59, 130, 246, 0)", // blue transparent
			"rgba(59, 130, 246, 0.4)",
			"rgba(37, 99, 235, 0.6)",
			"rgba(29, 78, 216, 0.8)",
			"rgba(30, 64, 175, 1)",
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

	// Search function that can be used by AI or user input - currently unused
	// const searchPoints = (query: string) => {
	// 	const lowerQuery = query.toLowerCase();
	// 	return searchablePoints.filter(
	// 		(point) =>
	// 			point.title.toLowerCase().includes(lowerQuery) ||
	// 			point.group?.toLowerCase().includes(lowerQuery) ||
	// 			point.tags?.some((tag) => tag.includes(lowerQuery)) ||
	// 			point.description?.toLowerCase().includes(lowerQuery),
	// 	);
	// };

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

	// Navigate to a specific point - currently unused
	// const navigateToPoint = (point: { lat: number; lng: number; zoom?: number }) => {
	// 	setSelectedPoint(point);
	// };

	// Handle marker clicks
	const handlePointClick = (point: { lat: number; lng: number; title?: string; group?: string }) => {
		setClickedPoint(point);
		console.log("Clicked point:", point); // For AI integration
	};

	// Handle search and navigation - currently unused
	// const handleSearch = () => {
	// 	if (searchQuery.trim()) {
	// 		const results = searchPoints(searchQuery);
	// 		if (results.length > 0) {
	// 			const firstResult = results[0];
	// 			navigateToPoint({ ...firstResult.position, zoom: 16 });
	// 			setClickedPoint({
	// 				lat: firstResult.position.lat,
	// 				lng: firstResult.position.lng,
	// 				title: firstResult.title,
	// 				group: firstResult.group,
	// 			});
	// 		}
	// 	}
	// };

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
				<div className="flex items-center justify-between h-16 px-6">
					<h1 className="text-2xl font-bold text-white tracking-wide">NASHIK GIS 2.0</h1>
					<a
						href="/health"
						className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
					>
						Health Check
					</a>
				</div>
			</div>

			<Sidebar
				processionRoutes={
					<div className="space-y-4">
						{processedProcessionRoutes.length > 0 ? (
							<div className="space-y-3">
								{/* ALL Toggle */}
								<div className="flex items-center justify-between cursor-pointer group border-b border-gray-700/50 pb-3 mb-3">
									<div className="flex-1 min-w-0">
										<div className="flex items-center space-x-2">
											<span className="text-sm font-medium text-gray-200">ALL</span>
											<span
												className={`px-2 py-0.5 text-xs rounded-full transition-colors flex-shrink-0 ${
													Object.values(processionsVisible).every((visible) => visible)
														? "bg-green-500/20 text-green-400 border border-green-500/30"
														: Object.values(processionsVisible).some((visible) => visible)
														? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
														: "bg-gray-700/50 text-gray-500 border border-gray-600/30"
												}`}
											>
												{Object.values(processionsVisible).every((visible) => visible)
													? "ALL ON"
													: Object.values(processionsVisible).some((visible) => visible)
													? "SOME ON"
													: "ALL OFF"}
											</span>
										</div>
										<p className="text-xs text-gray-400 mt-0.5">Toggle all {processedProcessionRoutes.length} festivals</p>
									</div>
									<Toggle
										checked={Object.values(processionsVisible).every((visible) => visible)}
										onCheckedChange={(checked) => {
											const newVisibility: { [festivalName: string]: boolean } = {};
											processedProcessionRoutes.forEach((festival) => {
												newVisibility[festival.festivalName] = checked;
											});
											setProcessionsVisible(newVisibility);
										}}
										variant="default"
									/>
								</div>

								{processedProcessionRoutes.map((festivalGroup) => (
									<div
										key={festivalGroup.festivalName}
										className="flex items-center justify-between cursor-pointer group"
									>
										<div className="flex-1 min-w-0">
											<div className="flex items-center space-x-2">
												<div
													className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0"
													style={{ backgroundColor: festivalGroup.color }}
												></div>
												<span className="text-sm font-medium text-gray-200 truncate max-w-[120px]">
													{festivalGroup.festivalName.length > 14 ? `${festivalGroup.festivalName.substring(0, 14)}...` : festivalGroup.festivalName}
												</span>
												<span
													className={`px-2 py-0.5 text-xs rounded-full transition-colors flex-shrink-0 ${
														processionsVisible[festivalGroup.festivalName]
															? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
															: "bg-gray-700/50 text-gray-500 border border-gray-600/30"
													}`}
												>
													{processionsVisible[festivalGroup.festivalName] ? "ON" : "OFF"}
												</span>
												{processionLoading && <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>}
											</div>
											<p className="text-xs text-gray-400 mt-0.5 truncate">
												{festivalGroup.routes.length} route{festivalGroup.routes.length !== 1 ? "s" : ""}
											</p>
										</div>
										<Toggle
											checked={processionsVisible[festivalGroup.festivalName] || false}
											onCheckedChange={(checked) => {
												setProcessionsVisible((prev) => ({
													...prev,
													[festivalGroup.festivalName]: checked,
												}));
											}}
											variant="default"
										/>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8">
								<div className="text-gray-400 mb-4">
									<svg
										className="w-12 h-12 mx-auto mb-3 text-gray-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={1.5}
											d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
										/>
									</svg>
									<p className="text-sm text-gray-400 mb-2">No procession routes loaded</p>
									<p className="text-xs text-gray-500">Click the button below to load available festival routes</p>
								</div>
								<button
									onClick={async () => {
										setProcessionLoading(true);
										try {
											console.log("🛤️ Loading Procession Routes data...");
											const data = await fetchProcessionRoutes();
											setProcessionRoutes(data);
											console.log(`✅ Loaded ${data.length} Procession Routes`);
										} catch (error) {
											console.error("❌ Failed to load Procession Routes data:", error);
										} finally {
											setProcessionLoading(false);
										}
									}}
									disabled={processionLoading}
									className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 mx-auto"
								>
									{processionLoading ? (
										<>
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
											<span>Loading...</span>
										</>
									) : (
										<>
											<svg
												className="w-4 h-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
												/>
											</svg>
											<span>Load Procession Routes</span>
										</>
									)}
								</button>
							</div>
						)}
					</div>
				}
			>
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

							{/* Accident Points Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🚗 Accident Points</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												accidentVisible ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{accidentVisible ? "ON" : "OFF"}
										</span>
										{accidentLoading && <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"></div>}
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Viewport-filtered markers ({accidentRecords.length} visible)</p>
								</div>
								<Toggle
									checked={accidentVisible}
									onCheckedChange={setAccidentVisible}
									variant="danger"
								/>
							</div>

							{/* Accident Heatmap Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🔥 Accident Heatmap</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												accidentHeatmapVisible ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{accidentHeatmapVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Density visualization ({accidentAllRecords.length} total)</p>
								</div>
								<Toggle
									checked={accidentHeatmapVisible}
									onCheckedChange={setAccidentHeatmapVisible}
									variant="danger"
								/>
							</div>

							{/* ATM Points Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🏧 ATM Locations</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												atmLayerVisible ? "bg-green-300/20 text-green-300 border border-green-300/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{atmLayerVisible ? "ON" : "OFF"}
										</span>
										{atmLoading && <div className="w-3 h-3 border border-green-300 border-t-transparent rounded-full animate-spin"></div>}
									</div>
									<p className="text-xs text-gray-400 mt-0.5">ATM locations ({atmLocations.length} locations)</p>
								</div>
								<Toggle
									checked={atmLayerVisible}
									onCheckedChange={setAtmLayerVisible}
									variant="success"
								/>
							</div>

							{/* ATM Heatmap Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🔥 ATM Heatmap</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												atmHeatmapVisible ? "bg-green-300/20 text-green-300 border border-green-300/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{atmHeatmapVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Density visualization ({atmLocations.length} total)</p>
								</div>
								<Toggle
									checked={atmHeatmapVisible}
									onCheckedChange={setAtmHeatmapVisible}
									variant="success"
								/>
							</div>

							{/* Bank Points Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🏦 Bank Branches</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												bankLayerVisible ? "bg-green-600/20 text-green-400 border border-green-600/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{bankLayerVisible ? "ON" : "OFF"}
										</span>
										{bankLoading && <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin"></div>}
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Bank branches ({bankLocations.length} locations)</p>
								</div>
								<Toggle
									checked={bankLayerVisible}
									onCheckedChange={setBankLayerVisible}
									variant="success"
								/>
							</div>

							{/* Bank Heatmap Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🔥 Bank Heatmap</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												bankHeatmapVisible ? "bg-green-600/20 text-green-400 border border-green-600/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{bankHeatmapVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Density visualization ({bankLocations.length} total)</p>
								</div>
								<Toggle
									checked={bankHeatmapVisible}
									onCheckedChange={setBankHeatmapVisible}
									variant="success"
								/>
							</div>

							{/* Hospital Points Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🏥 Hospitals</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												hospitalLayerVisible ? "bg-white/20 text-white border border-white/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{hospitalLayerVisible ? "ON" : "OFF"}
										</span>
										{hospitalLoading && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>}
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Medical facilities ({hospitalLocations.length} locations)</p>
								</div>
								<Toggle
									checked={hospitalLayerVisible}
									onCheckedChange={setHospitalLayerVisible}
									variant="default"
								/>
							</div>

							{/* Hospital Heatmap Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🔥 Hospital Heatmap</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												hospitalHeatmapVisible ? "bg-white/20 text-white border border-white/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{hospitalHeatmapVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Density visualization ({hospitalLocations.length} total)</p>
								</div>
								<Toggle
									checked={hospitalHeatmapVisible}
									onCheckedChange={setHospitalHeatmapVisible}
									variant="default"
								/>
							</div>

							{/* Police Station Points Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🚔 Police Stations</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												policeLayerVisible ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{policeLayerVisible ? "ON" : "OFF"}
										</span>
										{policeLoading && <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>}
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Police stations ({policeLocations.length} locations)</p>
								</div>
								<Toggle
									checked={policeLayerVisible}
									onCheckedChange={setPoliceLayerVisible}
									variant="default"
								/>
							</div>

							{/* Police Station Heatmap Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🔥 Police Heatmap</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												policeHeatmapVisible ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{policeHeatmapVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Density visualization ({policeLocations.length} total)</p>
								</div>
								<Toggle
									checked={policeHeatmapVisible}
									onCheckedChange={setPoliceHeatmapVisible}
									variant="default"
								/>
							</div>
						</div>

						{/* Layer Statistics */}
						<div className="border-t border-gray-700/50 pt-3 mt-4">
							<div className="text-xs text-gray-500 space-y-1">
								<div className="flex justify-between">
									<span>Active Layers:</span>
									<span className="font-medium">
										{
											[
												kmlLayerVisible,
												geoJsonLayerVisible,
												cctvLayerVisible,
												dial112Visible,
												dial112HeatmapVisible,
												accidentVisible,
												accidentHeatmapVisible,
												atmLayerVisible,
												atmHeatmapVisible,
												bankLayerVisible,
												bankHeatmapVisible,
												hospitalLayerVisible,
												hospitalHeatmapVisible,
												policeLayerVisible,
												policeHeatmapVisible,
											].filter(Boolean).length
										}
										/15
									</span>
								</div>
								<div className="flex justify-between">
									<span>Dial 112 Calls:</span>
									<span className="font-medium text-amber-400">
										{dial112Calls.length} visible / {dial112AllCalls.length} total
									</span>
								</div>
								<div className="flex justify-between">
									<span>Accident Records:</span>
									<span className="font-medium text-red-400">
										{accidentRecords.length} visible / {accidentAllRecords.length} total
									</span>
								</div>
								<div className="flex justify-between">
									<span>CCTV Cameras:</span>
									<span className="font-medium text-orange-400">{cctvLocations.length}</span>
								</div>
								<div className="flex justify-between">
									<span>ATM Locations:</span>
									<span className="font-medium text-green-300">{atmLocations.length}</span>
								</div>
								<div className="flex justify-between">
									<span>Bank Branches:</span>
									<span className="font-medium text-green-400">{bankLocations.length}</span>
								</div>
								<div className="flex justify-between">
									<span>Hospitals:</span>
									<span className="font-medium text-white">{hospitalLocations.length}</span>
								</div>
								<div className="flex justify-between">
									<span>Police Stations:</span>
									<span className="font-medium text-blue-400">{policeLocations.length}</span>
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
					polylines={processedProcessionRoutes}
					heatmap={{
						data: [
							...(dial112HeatmapVisible ? dial112HeatmapData.data : []),
							...(accidentHeatmapVisible ? accidentHeatmapData.data : []),
							...(atmHeatmapVisible ? atmHeatmapData.data : []),
							...(bankHeatmapVisible ? bankHeatmapData.data : []),
							...(hospitalHeatmapVisible ? hospitalHeatmapData.data : []),
							...(policeHeatmapVisible ? policeHeatmapData.data : []),
						],
						visible: dial112HeatmapVisible || accidentHeatmapVisible || atmHeatmapVisible || bankHeatmapVisible || hospitalHeatmapVisible || policeHeatmapVisible,
						radius: 20,
						opacity: 0.6,
						gradient: dial112HeatmapVisible
							? dial112HeatmapData.gradient
							: accidentHeatmapVisible
							? accidentHeatmapData.gradient
							: atmHeatmapVisible
							? atmHeatmapData.gradient
							: bankHeatmapVisible
							? bankHeatmapData.gradient
							: hospitalHeatmapVisible
							? hospitalHeatmapData.gradient
							: policeHeatmapVisible
							? policeHeatmapData.gradient
							: dial112HeatmapData.gradient,
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
