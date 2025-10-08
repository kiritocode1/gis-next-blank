"use client";

import { useEffect, useRef, useState } from "react";

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

interface GoogleMapProps {
	center?: { lat: number; lng: number };
	zoom?: number;
	height?: string;
	width?: string;
	className?: string;
	markers?: MarkerData[]; // Keep for backward compatibility
	markerGroups?: MarkerGroup[];
	heatmap?: HeatmapOptions;
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
	selectedPoint,
	onPointClick,
	searchablePoints = [],
}: GoogleMapProps) {
	const mapRef = useRef<HTMLDivElement>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mapInstanceRef = useRef<any>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const markersRef = useRef<any[]>([]);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const groupMarkersRef = useRef<Map<string, any[]>>(new Map());
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const heatmapRef = useRef<any>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const infoWindowRef = useRef<any>(null);

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
				if (group.visible !== false) {
					// Default to visible unless explicitly set to false
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const groupMarkers: any[] = [];

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
	}, [markers, markerGroups, isLoaded]);

	// Effect to handle heatmap
	useEffect(() => {
		if (mapInstanceRef.current && isLoaded && window.google?.maps?.visualization) {
			// Clear existing heatmap
			if (heatmapRef.current) {
				heatmapRef.current.setMap(null);
				heatmapRef.current = null;
			}

			// Create new heatmap if data is provided
			if (heatmap && heatmap.data && heatmap.data.length > 0 && heatmap.visible !== false) {
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
	}, [heatmap, isLoaded]);

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
			ref={mapRef}
			className={`rounded-lg border border-gray-300 shadow-lg ${className}`}
			style={{ height, width }}
		/>
	);
}
