"use client";

import { useEffect, useRef, useState } from "react";

// Interface for Google Maps click events
interface GoogleMapsClickEvent {
	latLng: {
		lat(): number;
		lng(): number;
	};
	featureData?: {
		name?: string;
		[key: string]: unknown;
	};
	feature?: {
		getProperty(name: string): unknown;
		[key: string]: unknown;
	};
}

// Interface for Google Maps objects
interface GoogleMapInstance {
	panTo(latLng: { lat: number; lng: number }): void;
	setZoom(zoom: number): void;
	data: {
		addGeoJson(geoJson: object): void;
		loadGeoJson(url: string): void;
		setStyle(style: object): void;
		addListener(event: string, handler: (event: GoogleMapsClickEvent) => void): void;
		forEach(callback: (feature: unknown) => void): void;
		remove(feature: unknown): void;
	};
	[key: string]: unknown;
}

interface GoogleMarkerInstance {
	setMap(map: GoogleMapInstance | null): void;
	addListener(event: string, handler: () => void): void;
	[key: string]: unknown;
}

interface GoogleInfoWindowInstance {
	open(map: GoogleMapInstance, marker?: GoogleMarkerInstance): void;
	close(): void;
	addListener(event: string, handler: () => void): void;
	[key: string]: unknown;
}

interface GoogleKmlLayerInstance {
	setMap(map: GoogleMapInstance | null): void;
	getStatus(): string;
	addListener(event: string, handler: (event?: GoogleMapsClickEvent) => void): void;
	[key: string]: unknown;
}

interface GoogleHeatmapLayerInstance {
	setMap(map: GoogleMapInstance | null): void;
	[key: string]: unknown;
}

interface MarkerData {
	position: { lat: number; lng: number };
	title?: string;
	label?: string;
	icon?: string;
}

interface MarkerGroup {
	name: string;
	markers: MarkerData[];
	color?: string;
	icon?: string;
	visible?: boolean;
}

interface HeatmapData {
	position: { lat: number; lng: number };
	weight?: number; // Optional weight for intensity
}

interface HeatmapOptions {
	data: HeatmapData[];
	visible?: boolean;
	radius?: number;
	opacity?: number;
	gradient?: string[];
	maxIntensity?: number;
	dissipating?: boolean;
}

interface KMLOptions {
	url?: string;
	visible?: boolean;
	preserveBounds?: boolean;
	suppressInfoWindows?: boolean;
}

interface GeoJSONOptions {
	data?: object;
	url?: string;
	visible?: boolean;
	style?: {
		strokeColor?: string;
		strokeOpacity?: number;
		strokeWeight?: number;
		fillColor?: string;
		fillOpacity?: number;
	};
}

interface GoogleMapProps {
	center?: { lat: number; lng: number };
	zoom?: number;
	height?: string;
	width?: string;
	className?: string;
	markers?: MarkerData[]; // Keep for backward compatibility
	markerGroups?: MarkerGroup[];
	heatmap?: HeatmapOptions;
	kmlLayer?: KMLOptions;
	geoJsonLayer?: GeoJSONOptions;
	selectedPoint?: { lat: number; lng: number; zoom?: number };
	onPointClick?: (point: { lat: number; lng: number; title?: string; group?: string }) => void;
	searchablePoints?: Array<{
		id: string;
		position: { lat: number; lng: number };
		title: string;
		description?: string;
		tags?: string[];
		group?: string;
	}>;
	onKMLToggle?: (visible: boolean) => void;
	onGeoJSONToggle?: (visible: boolean) => void;
	onMarkersToggle?: (visible: boolean) => void;
	onHeatmapToggle?: (visible: boolean) => void;
	showLayerControls?: boolean;
}

// Disable ESLint for Google Maps global since it's external
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
	interface Window {
		google: any;
		initMap: () => void;
	}
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function GoogleMap({
	center = { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
	zoom = 10,
	height = "400px",
	width = "100%",
	className = "",
	markers = [],
	markerGroups = [],
	heatmap,
	kmlLayer,
	geoJsonLayer,
	selectedPoint,
	onPointClick,
	searchablePoints = [],
	onKMLToggle,
	onGeoJSONToggle,
	onMarkersToggle,
	onHeatmapToggle,
	showLayerControls = false,
}: GoogleMapProps) {
	const mapRef = useRef<HTMLDivElement>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const mapInstanceRef = useRef<GoogleMapInstance | null>(null);
	const markersRef = useRef<GoogleMarkerInstance[]>([]);
	const groupMarkersRef = useRef<Map<string, GoogleMarkerInstance[]>>(new Map());
	const heatmapRef = useRef<GoogleHeatmapLayerInstance | null>(null);
	const kmlLayerRef = useRef<GoogleKmlLayerInstance | null>(null);
	const geoJsonLayerRef = useRef<boolean | null>(null);
	const kmlFallbackFeaturesRef = useRef<unknown[]>([]); // Track fallback GeoJSON features
	const infoWindowRef = useRef<GoogleInfoWindowInstance | null>(null);
	const [kmlVisible, setKmlVisible] = useState(kmlLayer?.visible ?? false);
	const [geoJsonVisible, setGeoJsonVisible] = useState(geoJsonLayer?.visible ?? false);
	const [markersVisible, setMarkersVisible] = useState(true);
	const [heatmapVisible, setHeatmapVisible] = useState(true);

	// Helper function to create custom marker icon
	const createCustomIcon = (color: string = "#FF0000", label?: string) => {
		return {
			url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
				<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
					<path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
					${label ? `<text x="16" y="18" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="white">${label}</text>` : ""}
					<circle cx="16" cy="16" r="6" fill="#FFFFFF" opacity="0.8"/>
				</svg>
			`)}`,
			scalable: true,
			size: new window.google.maps.Size(32, 40),
			anchor: new window.google.maps.Point(16, 40),
		};
	};

	// Helper function to create info window content
	const createInfoWindowContent = (title: string, description?: string, group?: string, coordinates?: { lat: number; lng: number }) => {
		const content = `
			<div style="max-width: 250px; font-family: Arial, sans-serif; padding: 8px;">
				<h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">${title}</h3>
				${group ? `<div style="margin-bottom: 6px;"><span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${group}</span></div>` : ""}
				${description ? `<p style="margin: 6px 0; color: #4b5563; font-size: 14px; line-height: 1.4;">${description}</p>` : ""}
				${
					coordinates
						? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;"><strong>Coordinates:</strong> ${coordinates.lat.toFixed(
								4,
						  )}, ${coordinates.lng.toFixed(4)}</div>`
						: ""
				}
			</div>
		`;
		console.log("Generated info window content:", content);
		return content;
	};

	useEffect(() => {
		// Check if Google Maps is already loaded
		if (window.google && window.google.maps) {
			setIsLoaded(true);
			return;
		}

		// Set up the callback function
		window.initMap = () => {
			setIsLoaded(true);
		};

		// Load the Google Maps script if not already loaded
		const script = document.createElement("script");
		script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDDs2zpvbxf7cpWK0-5uKpxNtbq91Y7v6A&callback=initMap&libraries=visualization,geometry,places&loading=async";
		script.async = true;
		script.defer = true;
		document.head.appendChild(script);

		return () => {
			// Cleanup
			if (script.parentNode) {
				script.parentNode.removeChild(script);
			}
		};
	}, []);

	useEffect(() => {
		if (isLoaded && mapRef.current && !mapInstanceRef.current) {
			const mapInstance = new window.google.maps.Map(mapRef.current, {
				center,
				zoom,
				mapTypeId: window.google.maps.MapTypeId.ROADMAP,
				zoomControl: true,
				mapTypeControl: true,
				scaleControl: true,
				streetViewControl: true,
				rotateControl: true,
				fullscreenControl: true,
				// Modern map styling
				styles: [
					{
						featureType: "all",
						elementType: "geometry.fill",
						stylers: [{ weight: "2.00" }],
					},
					{
						featureType: "all",
						elementType: "geometry.stroke",
						stylers: [{ color: "#9c9c9c" }],
					},
					{
						featureType: "all",
						elementType: "labels.text",
						stylers: [{ visibility: "on" }],
					},
				],
			});

			mapInstanceRef.current = mapInstance;
		}
	}, [isLoaded, center, zoom]);

	// Effect to handle initial markers and marker updates
	useEffect(() => {
		console.log("Effect running - isLoaded:", isLoaded, "mapInstance:", !!mapInstanceRef.current);
		console.log("Google Maps API available:", !!(window.google && window.google.maps && window.google.maps.InfoWindow));

		if (mapInstanceRef.current && isLoaded) {
			// Clear existing individual markers
			markersRef.current.forEach((marker) => marker.setMap(null));
			markersRef.current = [];

			// Clear existing group markers
			groupMarkersRef.current.forEach((groupMarkers) => {
				groupMarkers.forEach((marker) => marker.setMap(null));
			});
			groupMarkersRef.current.clear();

			// Add individual markers (backward compatibility)
			markers.forEach((markerData) => {
				const marker = new window.google.maps.Marker({
					position: markerData.position,
					map: mapInstanceRef.current,
					title: markerData.title || "Marker",
					label: markerData.label,
					icon: markerData.icon,
					animation: window.google.maps.Animation.DROP,
				});

				// Add click listener for info window
				marker.addListener("click", () => {
					console.log("Individual marker clicked:", markerData.title);

					// Close existing info window
					if (infoWindowRef.current) {
						infoWindowRef.current.close();
					}

					// Create new info window with simpler content
					const infoWindow = new window.google.maps.InfoWindow({
						content: `<div style="padding: 10px; min-width: 200px;"><h3>${markerData.title || "Marker"}</h3><p>Individual Marker</p></div>`,
						maxWidth: 300,
					});

					infoWindow.open(mapInstanceRef.current, marker);
					infoWindowRef.current = infoWindow;

					// Call onPointClick if provided
					if (onPointClick) {
						onPointClick({
							lat: markerData.position.lat,
							lng: markerData.position.lng,
							title: markerData.title,
						});
					}
				});

				markersRef.current.push(marker);
			});

			// Add grouped markers
			markerGroups.forEach((group) => {
				// Check if the group should be visible (considering both group.visible and markersVisible)
				const shouldShowGroup = group.visible !== false && markersVisible;

				if (shouldShowGroup) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const groupMarkers: GoogleMarkerInstance[] = [];

					group.markers.forEach((markerData, index) => {
						const customIcon = group.icon || createCustomIcon(group.color || "#FF0000");

						const marker = new window.google.maps.Marker({
							position: markerData.position,
							map: mapInstanceRef.current,
							title: markerData.title || `${group.name} ${index + 1}`,
							label: markerData.label,
							icon: markerData.icon || customIcon,
							animation: window.google.maps.Animation.DROP,
						});

						// Add click listener for group markers
						marker.addListener("click", () => {
							const markerTitle = markerData.title || `${group.name} ${index + 1}`;
							console.log("Group marker clicked:", markerTitle);

							// Close existing info window first
							if (infoWindowRef.current) {
								infoWindowRef.current.close();
								infoWindowRef.current = null;
							}

							try {
								// Create enhanced info window content
								const content = `
									<div style="padding: 15px; max-width: 280px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.4;">
										<div style="display: flex; align-items: center; margin-bottom: 10px;">
											<div style="width: 12px; height: 12px; background-color: ${group.color || "#3b82f6"}; border-radius: 50%; margin-right: 8px;"></div>
											<h3 style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">${markerTitle}</h3>
										</div>
										<div style="margin-bottom: 8px;">
											<span style="background: ${group.color || "#3b82f6"}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${group.name}</span>
										</div>
										<p style="margin: 8px 0; color: #4b5563; font-size: 14px;">📍 This ${group.name.toLowerCase()} location is part of San Francisco's public infrastructure network.</p>
										<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
											<strong>Coordinates:</strong> ${markerData.position.lat.toFixed(4)}, ${markerData.position.lng.toFixed(4)}
										</div>
									</div>
								`;

								// Create new info window with proper settings
								const infoWindow = new window.google.maps.InfoWindow({
									content: content,
									maxWidth: 320,
									zIndex: 1000,
									disableAutoPan: false,
								});

								console.log("Opening info window for:", markerTitle);

								// Open info window with standard Marker API
								infoWindow.open(mapInstanceRef.current, marker);
								infoWindowRef.current = infoWindow;

								console.log("✅ Info window opened successfully!");

								// Add close listener to clean up the reference
								infoWindow.addListener("closeclick", () => {
									infoWindowRef.current = null;
								});
							} catch (error) {
								console.error("Error opening info window:", error);
							}

							// Call onPointClick if provided
							if (onPointClick) {
								onPointClick({
									lat: markerData.position.lat,
									lng: markerData.position.lng,
									title: markerTitle,
									group: group.name,
								});
							}
						});

						groupMarkers.push(marker);
					});

					groupMarkersRef.current.set(group.name, groupMarkers);
				}
			});
		}
	}, [markers, markerGroups, markersVisible, isLoaded]);

	// Effect to synchronize internal state with props
	useEffect(() => {
		if (kmlLayer?.visible !== undefined) {
			setKmlVisible(kmlLayer.visible);
		}
	}, [kmlLayer?.visible]);

	useEffect(() => {
		if (geoJsonLayer?.visible !== undefined) {
			setGeoJsonVisible(geoJsonLayer.visible);
		}
	}, [geoJsonLayer?.visible]);

	useEffect(() => {
		if (heatmap?.visible !== undefined) {
			setHeatmapVisible(heatmap.visible);
		}
	}, [heatmap?.visible]);

	// Effect to handle heatmap
	useEffect(() => {
		if (mapInstanceRef.current && isLoaded && window.google?.maps?.visualization) {
			// Clear existing heatmap
			if (heatmapRef.current) {
				heatmapRef.current.setMap(null);
				heatmapRef.current = null;
			}

			// Create new heatmap if data is provided and visible
			if (heatmap && heatmap.data && heatmap.data.length > 0 && heatmapVisible) {
				// Convert heatmap data to Google Maps format
				const heatmapData = heatmap.data.map((point) => {
					if (point.weight !== undefined) {
						// Weighted data point
						return {
							location: new window.google.maps.LatLng(point.position.lat, point.position.lng),
							weight: point.weight,
						};
					} else {
						// Simple location point
						return new window.google.maps.LatLng(point.position.lat, point.position.lng);
					}
				});

				// Create heatmap layer with options
				const heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
					data: heatmapData,
					radius: heatmap.radius || 20,
					opacity: heatmap.opacity || 0.6,
					maxIntensity: heatmap.maxIntensity,
					dissipating: heatmap.dissipating !== false, // Default to true
					gradient: heatmap.gradient || [
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
				});

				heatmapLayer.setMap(mapInstanceRef.current);
				heatmapRef.current = heatmapLayer;
			}
		}
	}, [heatmap, heatmapVisible, isLoaded]);

	// Effect to handle KML layer
	useEffect(() => {
		console.log("🔄 KML Effect triggered:", {
			mapInstanceLoaded: !!mapInstanceRef.current,
			isLoaded,
			kmlLayerProvided: !!kmlLayer,
			kmlVisible,
			kmlLayerUrl: kmlLayer?.url,
			currentKmlLayerRef: !!kmlLayerRef.current,
		});

		if (mapInstanceRef.current && isLoaded && kmlLayer) {
			console.log("✅ All conditions met for KML layer processing");

			// Clear existing KML layer
			if (kmlLayerRef.current) {
				console.log("🗑️ Clearing existing KML layer");
				kmlLayerRef.current.setMap(null);
				kmlLayerRef.current = null;
			}

			// Clear any fallback GeoJSON features from previous KML attempts
			if (kmlFallbackFeaturesRef.current.length > 0 && mapInstanceRef.current) {
				console.log("🗑️ Clearing KML fallback GeoJSON features");
				// Clear all data features (since we can't selectively remove just fallback ones)
				mapInstanceRef.current.data.forEach((feature) => {
					mapInstanceRef.current!.data.remove(feature);
				});
				kmlFallbackFeaturesRef.current = [];
			}

			// Create new KML layer if URL is provided and visible
			if (kmlLayer.url && kmlVisible) {
				console.log("🌐 Creating new KML layer with URL:", kmlLayer.url);
				console.log("🌐 URL type:", typeof kmlLayer.url);
				console.log("🌐 Is absolute URL?", kmlLayer.url.startsWith("http"));
				console.log("🌐 Full URL for debugging:", kmlLayer.url);

				try {
					const kmlLayerInstance = new window.google.maps.KmlLayer({
						url: kmlLayer.url,
						preserveBounds: kmlLayer.preserveBounds ?? false,
						suppressInfoWindows: kmlLayer.suppressInfoWindows ?? false,
						map: mapInstanceRef.current,
					});

					console.log("✅ KML layer instance created successfully:", kmlLayerInstance);
					kmlLayerRef.current = kmlLayerInstance;

					// Add status change listener
					kmlLayerInstance.addListener("status_changed", () => {
						const status = kmlLayerInstance.getStatus();
						console.log("📊 KML layer status changed:", status);
						if (status === "DOCUMENT_NOT_FOUND") {
							console.error("❌ KML document not found at:", kmlLayer.url);
						} else if (status === "DOCUMENT_TOO_LARGE") {
							console.error("❌ KML document too large");
						} else if (status === "FETCH_ERROR") {
							console.error("❌ Error fetching KML document");
						} else if (status === "INVALID_DOCUMENT") {
							console.error("❌ Invalid KML document");
						} else if (status === "INVALID_REQUEST") {
							console.error("❌ Invalid KML request for URL:", kmlLayer.url);
							console.error("❌ KmlLayer requires absolute URLs (http/https)");
							console.error("❌ Current URL type:", typeof kmlLayer.url, "| Starts with http:", kmlLayer.url?.startsWith("http") || false);
							console.error("❌ Recommendation: Use GeoJSON layer for local files instead");
							console.log("🔄 Attempting to load as GeoJSON instead...");

							// Try to load as GeoJSON instead
							if (kmlLayer.url && mapInstanceRef.current) {
								const geoJsonUrl = kmlLayer.url.replace(".kml", ".geojson");
								console.log("🔄 Loading GeoJSON from:", geoJsonUrl);
								try {
									// Load GeoJSON
									mapInstanceRef.current.data.loadGeoJson(geoJsonUrl);

									// Mark that we have fallback data loaded
									kmlFallbackFeaturesRef.current = [true]; // Simple flag to track fallback state
									console.log("🔄 Fallback GeoJSON loaded and tracked for cleanup");

									// Apply KML-like styling for the fallback
									mapInstanceRef.current.data.setStyle({
										strokeColor: "#FF0000",
										strokeOpacity: 0.8,
										strokeWeight: 2,
										fillColor: "#FF0000",
										fillOpacity: 0.35,
									});

									console.log("✅ Loaded KML data as GeoJSON successfully!");
								} catch (geoJsonError) {
									console.error("❌ Failed to load as GeoJSON:", geoJsonError);
								}
							}
						} else if (status === "LIMITS_EXCEEDED") {
							console.error("❌ KML limits exceeded");
						} else if (status === "OK") {
							console.log("✅ KML layer loaded successfully!");
						} else if (status === "UNKNOWN_ERROR") {
							console.error("❌ Unknown error loading KML");
						}
					});

					// Add click listener for KML features
					kmlLayerInstance.addListener("click", (event: GoogleMapsClickEvent) => {
						console.log("🖱️ KML feature clicked:", event);
						if (onPointClick && event.latLng) {
							onPointClick({
								lat: event.latLng.lat(),
								lng: event.latLng.lng(),
								title: event.featureData?.name || "KML Feature",
								group: "KML Layer",
							});
						}
					});
				} catch (error) {
					console.error("❌ Error creating KML layer:", error);
				}
			} else {
				console.log("⚠️ KML layer not created. URL:", kmlLayer.url, "Visible:", kmlVisible);
			}
		} else {
			console.log("⚠️ KML layer conditions not met:", {
				mapInstance: !!mapInstanceRef.current,
				isLoaded,
				kmlLayer: !!kmlLayer,
			});
		}
	}, [kmlLayer, kmlVisible, isLoaded]);

	// Effect to handle GeoJSON layer
	useEffect(() => {
		if (mapInstanceRef.current && isLoaded && geoJsonLayer) {
			// Clear existing GeoJSON features
			if (geoJsonLayerRef.current) {
				if (mapInstanceRef.current) {
					mapInstanceRef.current.data.forEach((feature: unknown) => {
						mapInstanceRef.current!.data.remove(feature);
					});
				}
				geoJsonLayerRef.current = null;
			}

			// Load new GeoJSON data if provided and visible
			if (geoJsonVisible && (geoJsonLayer.data || geoJsonLayer.url)) {
				if (geoJsonLayer.data) {
					// Load from data object
					mapInstanceRef.current.data.addGeoJson(geoJsonLayer.data);
				} else if (geoJsonLayer.url) {
					// Load from URL
					mapInstanceRef.current.data.loadGeoJson(geoJsonLayer.url);
				}

				// Apply styling
				if (geoJsonLayer.style) {
					mapInstanceRef.current.data.setStyle(geoJsonLayer.style);
				}

				// Add click listener for GeoJSON features
				mapInstanceRef.current.data.addListener("click", (event: GoogleMapsClickEvent) => {
					if (onPointClick && event.latLng) {
						onPointClick({
							lat: event.latLng.lat(),
							lng: event.latLng.lng(),
							title: (event.feature?.getProperty("name") as string) || "GeoJSON Feature",
							group: "GeoJSON Layer",
						});
					}
				});

				geoJsonLayerRef.current = true;
			}
		}
	}, [geoJsonLayer, geoJsonVisible, isLoaded]);

	// Effect to handle selected point navigation
	useEffect(() => {
		if (mapInstanceRef.current && selectedPoint) {
			const targetZoom = selectedPoint.zoom || 15;

			// Smooth pan and zoom to the selected point
			mapInstanceRef.current.panTo(selectedPoint);
			mapInstanceRef.current.setZoom(targetZoom);

			// Optional: Add a temporary highlight marker
			const highlightMarker = new window.google.maps.Marker({
				position: selectedPoint,
				map: mapInstanceRef.current,
				icon: {
					url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
						<svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
							<circle cx="20" cy="20" r="18" fill="#FFD700" stroke="#FF4500" stroke-width="3" opacity="0.8"/>
							<circle cx="20" cy="20" r="12" fill="#FF4500" opacity="0.6"/>
							<circle cx="20" cy="20" r="6" fill="#FFFFFF"/>
						</svg>
					`)}`,
					scalable: true,
					size: new window.google.maps.Size(40, 50),
					anchor: new window.google.maps.Point(20, 25),
				},
				animation: window.google.maps.Animation.BOUNCE,
				zIndex: 1000,
			});

			// Remove highlight after 3 seconds
			setTimeout(() => {
				if (highlightMarker) {
					highlightMarker.setMap(null);
				}
			}, 3000);
		}
	}, [selectedPoint]);

	// Toggle functions
	const toggleKML = () => {
		const newVisible = !kmlVisible;
		setKmlVisible(newVisible);
		if (onKMLToggle) {
			onKMLToggle(newVisible);
		}
	};

	const toggleGeoJSON = () => {
		const newVisible = !geoJsonVisible;
		setGeoJsonVisible(newVisible);
		if (onGeoJSONToggle) {
			onGeoJSONToggle(newVisible);
		}
	};

	const toggleMarkers = () => {
		const newVisible = !markersVisible;
		setMarkersVisible(newVisible);
		if (onMarkersToggle) {
			onMarkersToggle(newVisible);
		}
	};

	const toggleHeatmap = () => {
		const newVisible = !heatmapVisible;
		setHeatmapVisible(newVisible);
		if (onHeatmapToggle) {
			onHeatmapToggle(newVisible);
		}
	};

	if (!isLoaded) {
		return (
			<div
				className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg ${className}`}
				style={{ height, width }}
			>
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
					<p className="text-gray-600">Loading Google Maps...</p>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`relative ${className}`}
			style={{ height, width }}
		>
			{/* Layer Controls */}
			{showLayerControls && (
				<div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 space-y-2">
					<div className="text-sm font-semibold text-gray-700 mb-2">Map Layers</div>
					{kmlLayer && (
						<label className="flex items-center space-x-2 text-sm">
							<input
								type="checkbox"
								checked={kmlVisible}
								onChange={toggleKML}
								className="rounded border-gray-300"
							/>
							<span className="text-gray-700">KML Layer</span>
						</label>
					)}
					{markerGroups.length > 0 && (
						<label className="flex items-center space-x-2 text-sm">
							<input
								type="checkbox"
								checked={markersVisible}
								onChange={toggleMarkers}
								className="rounded border-gray-300"
							/>
							<span className="text-gray-700">Markers</span>
						</label>
					)}
					{heatmap && (
						<label className="flex items-center space-x-2 text-sm">
							<input
								type="checkbox"
								checked={heatmapVisible}
								onChange={toggleHeatmap}
								className="rounded border-gray-300"
							/>
							<span className="text-gray-700">Heatmap</span>
						</label>
					)}
					{geoJsonLayer && (
						<label className="flex items-center space-x-2 text-sm">
							<input
								type="checkbox"
								checked={geoJsonVisible}
								onChange={toggleGeoJSON}
								className="rounded border-gray-300"
							/>
							<span className="text-gray-700">GeoJSON Layer</span>
						</label>
					)}
				</div>
			)}

			{/* Map Container */}
			<div
				ref={mapRef}
				className="rounded-lg border border-gray-300 shadow-lg w-full h-full"
			/>
		</div>
	);
}
