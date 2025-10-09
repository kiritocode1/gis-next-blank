/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { parseKMLFile, type KMLFeature, type KMLMarker } from "@/utils/kmlParser";
import { Toggle, GooeyFilter } from "./LiquidToggle";

interface GoogleMapProps {
	center?: { lat: number; lng: number };
	zoom?: number;
	height?: string;
	width?: string;
	className?: string;
	markers?: Array<{ position: { lat: number; lng: number }; title?: string; label?: string; icon?: string }>;
	markerGroups?: Array<{
		name: string;
		markers: Array<{ position: { lat: number; lng: number }; title?: string; label?: string; icon?: string }>;
		color?: string;
		icon?: string;
		visible?: boolean;
	}>;
	heatmap?: {
		data: Array<{ position: { lat: number; lng: number }; weight?: number }>;
		visible?: boolean;
		radius?: number;
		opacity?: number;
		gradient?: string[];
		maxIntensity?: number;
		dissipating?: boolean;
	};
	kmlLayer?: {
		url?: string;
		visible?: boolean;
		preserveBounds?: boolean;
		suppressInfoWindows?: boolean;
	};
	geoJsonLayer?: {
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
	};
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
	onCCTVToggle?: (visible: boolean) => void;
	showLayerControls?: boolean;
}

declare global {
	interface Window {
		google: any;
		initMap: () => void;
	}
}

export default function GoogleMap({
	center = { lat: 37.7749, lng: -122.4194 },
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
	onKMLToggle,
	onGeoJSONToggle,
	onMarkersToggle,
	onHeatmapToggle,
	onCCTVToggle,
	showLayerControls = false,
}: GoogleMapProps): JSX.Element {
	const mapRef = useRef<HTMLDivElement>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const mapInstanceRef = useRef<any>(null);
	const markersRef = useRef<any[]>([]);
	const groupMarkersRef = useRef<Map<string, any[]>>(new Map());
	const heatmapRef = useRef<any>(null);
	const kmlLayerRef = useRef<any>(null);
	const geoJsonLayerRef = useRef<boolean | null>(null);
	const kmlPolygonsRef = useRef<any[]>([]);
	const kmlMarkersRef = useRef<any[]>([]);
	const kmlAbortControllerRef = useRef<AbortController | null>(null);
	const geoJsonAbortControllerRef = useRef<AbortController | null>(null);
	const geoJsonFeaturesRef = useRef<any[]>([]);
	const infoWindowRef = useRef<any>(null);
	const [kmlVisible, setKmlVisible] = useState(kmlLayer?.visible ?? false);
	const [geoJsonVisible, setGeoJsonVisible] = useState(geoJsonLayer?.visible ?? false);
	const [markersVisible, setMarkersVisible] = useState(true);
	const [heatmapVisible, setHeatmapVisible] = useState(true);

	// Load Google Maps script
	useEffect(() => {
		if (window.google && window.google.maps) {
			setIsLoaded(true);
			return;
		}

		window.initMap = () => {
			setIsLoaded(true);
		};

		const script = document.createElement("script");
		script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDDs2zpvbxf7cpWK0-5uKpxNtbq91Y7v6A&callback=initMap&libraries=visualization,geometry,places&loading=async";
		script.async = true;
		script.defer = true;
		document.head.appendChild(script);

		return () => {
			if (script.parentNode) {
				script.parentNode.removeChild(script);
			}
		};
	}, []);

	// Initialize map
	useEffect(() => {
		if (isLoaded && mapRef.current && !mapInstanceRef.current) {
			const mapInstance = new window.google.maps.Map(mapRef.current, {
				center,
				zoom,
				mapTypeId: window.google.maps.MapTypeId.ROADMAP,
				styles: [
					{ elementType: "geometry", stylers: [{ color: "#212121" }] },
					{ elementType: "labels.icon", stylers: [{ visibility: "off" }] },
					{ elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
					{ elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
					{
						featureType: "administrative",
						elementType: "geometry",
						stylers: [{ color: "#757575" }],
					},
					{
						featureType: "administrative.country",
						elementType: "labels.text.fill",
						stylers: [{ color: "#9e9e9e" }],
					},
					{
						featureType: "administrative.land_parcel",
						stylers: [{ visibility: "off" }],
					},
					{
						featureType: "administrative.locality",
						elementType: "labels.text.fill",
						stylers: [{ color: "#bdbdbd" }],
					},
					{
						featureType: "poi",
						elementType: "labels.text.fill",
						stylers: [{ color: "#757575" }],
					},
					{
						featureType: "poi.park",
						elementType: "geometry",
						stylers: [{ color: "#181818" }],
					},
					{
						featureType: "poi.park",
						elementType: "labels.text.fill",
						stylers: [{ color: "#616161" }],
					},
					{
						featureType: "poi.park",
						elementType: "labels.text.stroke",
						stylers: [{ color: "#1b1b1b" }],
					},
					{
						featureType: "road",
						elementType: "geometry.fill",
						stylers: [{ color: "#2c2c2c" }],
					},
					{
						featureType: "road",
						elementType: "labels.text.fill",
						stylers: [{ color: "#8a8a8a" }],
					},
					{
						featureType: "road.arterial",
						elementType: "geometry",
						stylers: [{ color: "#373737" }],
					},
					{
						featureType: "road.highway",
						elementType: "geometry",
						stylers: [{ color: "#3c3c3c" }],
					},
					{
						featureType: "road.highway.controlled_access",
						elementType: "geometry",
						stylers: [{ color: "#4e4e4e" }],
					},
					{
						featureType: "road.local",
						elementType: "labels.text.fill",
						stylers: [{ color: "#616161" }],
					},
					{
						featureType: "transit",
						elementType: "labels.text.fill",
						stylers: [{ color: "#757575" }],
					},
					{
						featureType: "water",
						elementType: "geometry",
						stylers: [{ color: "#000000" }],
					},
					{
						featureType: "water",
						elementType: "labels.text.fill",
						stylers: [{ color: "#3d3d3d" }],
					},
				],
			});
			mapInstanceRef.current = mapInstance;
		}
	}, [isLoaded, center, zoom]);

	// Handle markers
	useEffect(() => {
		if (mapInstanceRef.current && isLoaded) {
			// Clear existing markers
			markersRef.current.forEach((marker) => marker.setMap(null));
			markersRef.current = [];
			groupMarkersRef.current.forEach((groupMarkers) => {
				groupMarkers.forEach((marker) => marker.setMap(null));
			});
			groupMarkersRef.current.clear();

			// Add individual markers
			markers.forEach((markerData) => {
				const marker = new window.google.maps.Marker({
					position: markerData.position,
					map: mapInstanceRef.current,
					title: markerData.title || "Marker",
					animation: window.google.maps.Animation.DROP,
				});
				markersRef.current.push(marker);
			});

			// Add grouped markers
			markerGroups.forEach((group) => {
				const shouldShowGroup = group.visible !== false && markersVisible;
				if (shouldShowGroup) {
					const groupMarkers: any[] = [];
					group.markers.forEach((markerData) => {
						const marker = new window.google.maps.Marker({
							position: markerData.position,
							map: mapInstanceRef.current,
							title: markerData.title || group.name,
							animation: window.google.maps.Animation.DROP,
						});
						groupMarkers.push(marker);
					});
					groupMarkersRef.current.set(group.name, groupMarkers);
				}
			});
		}
	}, [markers, markerGroups, markersVisible, isLoaded]);

	// Handle heatmap
	useEffect(() => {
		if (mapInstanceRef.current && isLoaded && window.google?.maps?.visualization) {
			if (heatmapRef.current) {
				heatmapRef.current.setMap(null);
				heatmapRef.current = null;
			}

			if (heatmap && heatmap.data && heatmap.data.length > 0 && heatmapVisible) {
				const heatmapData = heatmap.data.map((point) => {
					if (point.weight !== undefined) {
						return {
							location: new window.google.maps.LatLng(point.position.lat, point.position.lng),
							weight: point.weight,
						};
					} else {
						return new window.google.maps.LatLng(point.position.lat, point.position.lng);
					}
				});

				const heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
					data: heatmapData,
					radius: heatmap.radius || 20,
					opacity: heatmap.opacity || 0.6,
				});

				heatmapLayer.setMap(mapInstanceRef.current);
				heatmapRef.current = heatmapLayer;
			}
		}
	}, [heatmap, heatmapVisible, isLoaded]);

	// Enhanced KML Effect using custom parser
	useEffect(() => {
		const handleEnhancedKML = async () => {
			console.log("🎆 KML Effect triggered:", {
				mapReady: !!mapInstanceRef.current,
				isLoaded,
				hasKmlLayer: !!kmlLayer,
				kmlVisible,
				kmlUrl: kmlLayer?.url,
			});

			// ALWAYS clear existing KML elements first - this is critical
			console.log("🧹 Starting KML cleanup process...");
			console.log("🧹 Current state:", {
				kmlLayerRef: !!kmlLayerRef.current,
				polygonCount: kmlPolygonsRef.current.length,
				markerCount: kmlMarkersRef.current.length,
			});

			// Cancel any ongoing KML parsing operations
			if (kmlAbortControllerRef.current) {
				console.log("🛑 Cancelling ongoing KML parsing...");
				kmlAbortControllerRef.current.abort();
				kmlAbortControllerRef.current = null;
			}

			if (kmlLayerRef.current) {
				console.log("🧹 Removing native KML layer");
				try {
					kmlLayerRef.current.setMap(null);
					console.log("✅ Native KML layer removed successfully");
				} catch (error) {
					console.error("❌ Error removing native KML layer:", error);
				}
				kmlLayerRef.current = null;
			}

			// Clear custom polygons with detailed logging
			if (kmlPolygonsRef.current.length > 0) {
				console.log(`🧹 Removing ${kmlPolygonsRef.current.length} polygons...`);
				kmlPolygonsRef.current.forEach((polygon, index) => {
					if (polygon && typeof polygon.setMap === "function") {
						try {
							polygon.setMap(null);
							console.log(`✅ Polygon ${index} removed`);
						} catch (error) {
							console.error(`❌ Error removing polygon ${index}:`, error);
						}
					} else {
						console.warn(`⚠️ Polygon ${index} is invalid:`, polygon);
					}
				});
			} else {
				console.log("🧹 No polygons to remove");
			}

			// Clear custom markers with detailed logging
			if (kmlMarkersRef.current.length > 0) {
				console.log(`🧹 Removing ${kmlMarkersRef.current.length} markers...`);
				kmlMarkersRef.current.forEach((marker, index) => {
					if (marker && typeof marker.setMap === "function") {
						try {
							marker.setMap(null);
							console.log(`✅ Marker ${index} removed`);
						} catch (error) {
							console.error(`❌ Error removing marker ${index}:`, error);
						}
					} else {
						console.warn(`⚠️ Marker ${index} is invalid:`, marker);
					}
				});
			} else {
				console.log("🧹 No markers to remove");
			}

			// Clear the arrays
			kmlPolygonsRef.current = [];
			kmlMarkersRef.current = [];
			console.log("✅ KML cleanup completed - arrays cleared");

			// If prerequisites not met OR KML should be hidden, stop here
			if (!mapInstanceRef.current || !isLoaded || !kmlLayer || !kmlVisible) {
				const reason = !mapInstanceRef.current ? "Map not ready" : !isLoaded ? "Not loaded" : !kmlLayer ? "No KML layer config" : !kmlVisible ? "KML toggled OFF" : "Unknown";

				console.log("⚠️ KML loading stopped - conditions not met:", {
					mapReady: !!mapInstanceRef.current,
					isLoaded,
					hasKmlLayer: !!kmlLayer,
					kmlVisible,
					reason,
				});

				if (!kmlVisible) {
					console.log("✅ KML is toggled OFF - cleanup should have removed all layers");
				}
				return;
			}

			console.log("🎆 Starting KML loading process for:", kmlLayer.url);

			// Create new AbortController for this parsing operation
			const abortController = new AbortController();
			kmlAbortControllerRef.current = abortController;

			try {
				const result = await parseKMLFile(kmlLayer.url!, abortController.signal);

				// Check if this operation was cancelled
				if (abortController.signal.aborted) {
					console.log("🛑 KML parsing was cancelled");
					return;
				}

				if (result.success) {
					console.log("✅ KML parsed successfully:", {
						features: result.features.length,
						markers: result.markers.length,
					});

					// Render polygon features (boundaries)
					result.features.forEach((feature) => {
						if (feature.type === "polygon") {
							const polygon = new window.google.maps.Polygon({
								paths: feature.coordinates,
								strokeColor: "#FF0000",
								strokeOpacity: 0.8,
								strokeWeight: 2,
								fillColor: "#FF0000",
								fillOpacity: 0.35,
								map: mapInstanceRef.current,
							});

							polygon.addListener("click", (event: any) => {
								if (onPointClick && event.latLng) {
									onPointClick({
										lat: event.latLng.lat(),
										lng: event.latLng.lng(),
										title: feature.name,
										group: "Nashik Gramin Boundaries",
									});
								}
							});

							kmlPolygonsRef.current.push(polygon);
						}
					});

					// Render police station markers
					result.markers.forEach((markerData) => {
						const marker = new window.google.maps.Marker({
							position: markerData.position,
							map: mapInstanceRef.current,
							title: markerData.title,
							icon: {
								url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
									<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
										<path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z" fill="#1E40AF" stroke="#FFFFFF" stroke-width="2"/>
										<circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
										<text x="16" y="20" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#1E40AF">PS</text>
									</svg>
								`)}`,
								scaledSize: new window.google.maps.Size(32, 40),
								anchor: new window.google.maps.Point(16, 40),
							},
							animation: window.google.maps.Animation.DROP,
						});

						marker.addListener("click", () => {
							if (infoWindowRef.current) {
								infoWindowRef.current.close();
							}

							const props = markerData.properties;
							const content = `
								<div style="padding: 12px; max-width: 320px; font-family: Arial, sans-serif;">
									<h3 style="margin: 0 0 8px 0; color: #1E40AF; font-size: 16px;">${markerData.title}</h3>
									<div style="margin-bottom: 8px;">
										<span style="background: #1E40AF; color: white; padding: 2px 6px; border-radius: 8px; font-size: 11px; font-weight: 500;">Police Station</span>
									</div>
									${props.division ? `<p style="margin: 4px 0;"><strong>Division:</strong> ${props.division}</p>` : ""}
									${props.ps_name_ma ? `<p style="margin: 4px 0;"><strong>Marathi Name:</strong> ${props.ps_name_ma}</p>` : ""}
									${props.address ? `<p style="margin: 4px 0;"><strong>Address:</strong> ${props.address}</p>` : ""}
									${props.mobile_no ? `<p style="margin: 4px 0;"><strong>Mobile:</strong> ${props.mobile_no}</p>` : ""}
									${props.email_id ? `<p style="margin: 4px 0;"><strong>Email:</strong> ${props.email_id}</p>` : ""}
									<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
										<strong>Coordinates:</strong> ${markerData.position.lat.toFixed(4)}, ${markerData.position.lng.toFixed(4)}
									</div>
								</div>
							`;

							const infoWindow = new window.google.maps.InfoWindow({
								content,
								maxWidth: 350,
							});

							infoWindow.open(mapInstanceRef.current, marker);
							infoWindowRef.current = infoWindow;

							if (onPointClick) {
								onPointClick({
									lat: markerData.position.lat,
									lng: markerData.position.lng,
									title: markerData.title,
									group: "Police Stations",
								});
							}
						});

						kmlMarkersRef.current.push(marker);
					});

					console.log("✅ KML rendering completed successfully");
				}

				// Clear the abort controller if this is still the current operation
				if (kmlAbortControllerRef.current === abortController) {
					kmlAbortControllerRef.current = null;
				}
			} catch (error) {
				// Don't log error if operation was cancelled (AbortError is expected)
				if (!abortController.signal.aborted && !(error instanceof Error && error.name === "AbortError")) {
					console.error("❌ Enhanced KML effect error:", error);
				}

				// Clear the abort controller if this is still the current operation
				if (kmlAbortControllerRef.current === abortController) {
					kmlAbortControllerRef.current = null;
				}
			}
		};

		handleEnhancedKML();
	}, [kmlLayer, kmlVisible, isLoaded, onPointClick]);

	// Enhanced GeoJSON Effect with proper cleanup
	useEffect(() => {
		const handleEnhancedGeoJSON = async () => {
			console.log("🌍 GeoJSON Effect triggered:", {
				mapReady: !!mapInstanceRef.current,
				isLoaded,
				hasGeoJsonLayer: !!geoJsonLayer,
				geoJsonVisible,
				geoJsonUrl: geoJsonLayer?.url,
			});

			// ALWAYS clear existing GeoJSON elements first - this is critical
			console.log("🧹 Starting GeoJSON cleanup process...");
			console.log("🧹 Current GeoJSON state:", {
				geoJsonLayerRef: !!geoJsonLayerRef.current,
				featureCount: geoJsonFeaturesRef.current.length,
			});

			// Cancel any ongoing GeoJSON loading operations
			if (geoJsonAbortControllerRef.current) {
				console.log("🛑 Cancelling ongoing GeoJSON loading...");
				geoJsonAbortControllerRef.current.abort();
				geoJsonAbortControllerRef.current = null;
			}

			// Clear existing GeoJSON features with detailed logging
			if (mapInstanceRef.current && mapInstanceRef.current.data) {
				try {
					// Method 1: Remove all features from the data layer
					console.log("🧹 Clearing all features from data layer...");
					mapInstanceRef.current.data.forEach((feature: any) => {
						mapInstanceRef.current.data.remove(feature);
					});

					// Method 2: Clear tracked features array
					if (geoJsonFeaturesRef.current.length > 0) {
						console.log(`🧹 Removing ${geoJsonFeaturesRef.current.length} tracked features...`);
						geoJsonFeaturesRef.current.forEach((feature, index) => {
							if (feature && mapInstanceRef.current && mapInstanceRef.current.data) {
								try {
									mapInstanceRef.current.data.remove(feature);
									console.log(`✅ Feature ${index} removed`);
								} catch (error) {
									console.error(`❌ Error removing feature ${index}:`, error);
								}
							} else {
								console.warn(`⚠️ Feature ${index} is invalid:`, feature);
							}
						});
					} else {
						console.log("🧹 No tracked features to remove");
					}

					console.log("✅ GeoJSON cleanup completed successfully");
				} catch (error) {
					console.error("❌ Error during GeoJSON cleanup:", error);
				}
			}

			// Clear the arrays and refs
			geoJsonFeaturesRef.current = [];
			geoJsonLayerRef.current = null;
			console.log("✅ GeoJSON cleanup completed - arrays cleared");

			// If prerequisites not met OR GeoJSON should be hidden, stop here
			if (!mapInstanceRef.current || !isLoaded || !geoJsonLayer || !geoJsonVisible) {
				const reason = !mapInstanceRef.current ? "Map not ready" : !isLoaded ? "Not loaded" : !geoJsonLayer ? "No GeoJSON layer config" : !geoJsonVisible ? "GeoJSON toggled OFF" : "Unknown";

				console.log("⚠️ GeoJSON loading stopped - conditions not met:", {
					mapReady: !!mapInstanceRef.current,
					isLoaded,
					hasGeoJsonLayer: !!geoJsonLayer,
					geoJsonVisible,
					reason,
				});

				if (!geoJsonVisible) {
					console.log("✅ GeoJSON is toggled OFF - cleanup should have removed all layers");
				}
				return;
			}

			console.log("🌍 Starting GeoJSON loading process...");

			// Create new AbortController for this loading operation
			const abortController = new AbortController();
			geoJsonAbortControllerRef.current = abortController;

			try {
				if (geoJsonLayer.data) {
					console.log("📄 Loading GeoJSON from data object...");

					// Check if operation was cancelled
					if (abortController.signal.aborted) {
						console.log("🛑 GeoJSON loading was cancelled");
						return;
					}

					const features = mapInstanceRef.current.data.addGeoJson(geoJsonLayer.data);
					geoJsonFeaturesRef.current.push(...features);
					console.log(`✅ Added ${features.length} features from data object`);
				} else if (geoJsonLayer.url) {
					console.log("🌐 Loading GeoJSON from URL:", geoJsonLayer.url);

					// Check if operation was cancelled
					if (abortController.signal.aborted) {
						console.log("🛑 GeoJSON loading was cancelled");
						return;
					}

					// Load from URL with promise handling
					const loadPromise = new Promise<any[]>((resolve, reject) => {
						mapInstanceRef.current.data.loadGeoJson(
							geoJsonLayer.url!,
							{
								idPropertyName: "id",
							},
							(features: any[]) => {
								if (abortController.signal.aborted) {
									reject(new Error("Operation cancelled"));
									return;
								}
								resolve(features);
							},
						);
					});

					const features = await loadPromise;
					geoJsonFeaturesRef.current.push(...features);
					console.log(`✅ Added ${features.length} features from URL`);
				}

				// Apply styling if provided
				if (geoJsonLayer.style && !abortController.signal.aborted) {
					console.log("🎨 Applying GeoJSON styling...");
					mapInstanceRef.current.data.setStyle(geoJsonLayer.style);
					console.log("✅ GeoJSON styling applied");
				}

				// Add click listeners to features
				if (!abortController.signal.aborted) {
					mapInstanceRef.current.data.addListener("click", (event: any) => {
						if (onPointClick && event.latLng) {
							onPointClick({
								lat: event.latLng.lat(),
								lng: event.latLng.lng(),
								title: event.feature?.getProperty("name") || "GeoJSON Feature",
								group: "GeoJSON Layer",
							});
						}
					});
				}

				geoJsonLayerRef.current = true;
				console.log("✅ GeoJSON loading completed successfully");

				// Clear the abort controller if this is still the current operation
				if (geoJsonAbortControllerRef.current === abortController) {
					geoJsonAbortControllerRef.current = null;
				}
			} catch (error) {
				// Don't log error if operation was cancelled (AbortError is expected)
				if (!abortController.signal.aborted && !(error instanceof Error && error.name === "AbortError")) {
					console.error("❌ Enhanced GeoJSON effect error:", error);
				}

				// Clear the abort controller if this is still the current operation
				if (geoJsonAbortControllerRef.current === abortController) {
					geoJsonAbortControllerRef.current = null;
				}
			}
		};

		handleEnhancedGeoJSON();
	}, [geoJsonLayer, geoJsonVisible, isLoaded, onPointClick]);

	// Handle selected point navigation
	useEffect(() => {
		if (mapInstanceRef.current && selectedPoint) {
			const targetZoom = selectedPoint.zoom || 15;
			mapInstanceRef.current.panTo(selectedPoint);
			mapInstanceRef.current.setZoom(targetZoom);
		}
	}, [selectedPoint]);

	// Sync internal state with props
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
				<div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 space-y-3">
					<div className="text-sm font-semibold text-gray-700 mb-2">Map Layers</div>
					{kmlLayer && (
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-700">KML Layer</span>
							<Toggle
								checked={kmlVisible}
								onCheckedChange={toggleKML}
								variant="success"
							/>
						</div>
					)}
					{markerGroups.length > 0 && (
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-700">Markers</span>
							<Toggle
								checked={markersVisible}
								onCheckedChange={toggleMarkers}
								variant="default"
							/>
						</div>
					)}
					{heatmap && (
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-700">Heatmap</span>
							<Toggle
								checked={heatmapVisible}
								onCheckedChange={toggleHeatmap}
								variant="warning"
							/>
						</div>
					)}
					{geoJsonLayer && (
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-700">GeoJSON Layer</span>
							<Toggle
								checked={geoJsonVisible}
								onCheckedChange={toggleGeoJSON}
								variant="default"
							/>
						</div>
					)}
				</div>
			)}

			{/* Map Container */}
			<div
				ref={mapRef}
				className="rounded-lg border border-gray-300 shadow-lg w-full h-full"
			/>

			{/* Add the GooeyFilter for the liquid toggle effects */}
			<GooeyFilter />
		</div>
	);
}
