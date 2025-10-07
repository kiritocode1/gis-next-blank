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

interface GoogleMapProps {
	center?: { lat: number; lng: number };
	zoom?: number;
	height?: string;
	width?: string;
	className?: string;
	markers?: MarkerData[]; // Keep for backward compatibility
	markerGroups?: MarkerGroup[];
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
}: GoogleMapProps) {
	const mapRef = useRef<HTMLDivElement>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mapInstanceRef = useRef<any>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const markersRef = useRef<any[]>([]);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const groupMarkersRef = useRef<Map<string, any[]>>(new Map());

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

						groupMarkers.push(marker);
					});

					groupMarkersRef.current.set(group.name, groupMarkers);
				}
			});
		}
	}, [markers, markerGroups, isLoaded]);

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
