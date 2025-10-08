"use client";

import GoogleMap from "@/components/GoogleMap";
import { useState } from "react";

export default function Home() {
	// State for selected point and search
	const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number; zoom?: number } | undefined>();
	const [searchQuery, setSearchQuery] = useState("");
	const [clickedPoint, setClickedPoint] = useState<{ lat: number; lng: number; title?: string; group?: string } | null>(null);
	// Sample marker groups for different categories
	const markerGroups = [
		{
			name: "Parks",
			color: "#22C55E", // Green
			visible: true,
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
			visible: true,
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
			visible: true,
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
			visible: true,
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
		visible: true,
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

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-6xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">GIS System - Google Maps Integration</h1>

				{/* Search Interface */}
				<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
					<h3 className="text-lg font-semibold text-gray-800 mb-4">Point Search & Navigation</h3>
					<p className="text-sm text-gray-600 mb-4">
						💡 <strong>Tip:</strong> Click on any marker on the map to see detailed information including title, description, and coordinates!
					</p>
					<div className="flex gap-4 mb-4">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyPress={(e) => e.key === "Enter" && handleSearch()}
							placeholder="Search for places (e.g., 'parks', 'Union Square', 'restaurants')..."
							className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						<button
							onClick={handleSearch}
							className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							Search & Navigate
						</button>
					</div>

					{/* Quick Navigation Buttons */}
					<div className="flex flex-wrap gap-2">
						<button
							onClick={() => navigateToPoint({ lat: 37.7749, lng: -122.4194, zoom: 15 })}
							className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200"
						>
							📍 Union Square
						</button>
						<button
							onClick={() => navigateToPoint({ lat: 37.8049, lng: -122.4194, zoom: 15 })}
							className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200"
						>
							🚌 Fisherman&apos;s Wharf
						</button>
						<button
							onClick={() => navigateToPoint({ lat: 37.7549, lng: -122.4494, zoom: 14 })}
							className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200"
						>
							🌳 Golden Gate Park
						</button>
						<button
							onClick={() => navigateToPoint({ lat: 37.7949, lng: -122.4194, zoom: 15 })}
							className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200"
						>
							🍕 Tony&apos;s Pizza
						</button>
					</div>

					{/* Current Selection Display */}
					{clickedPoint && (
						<div className="mt-4 p-3 bg-gray-50 rounded-lg">
							<p className="text-sm text-gray-600">
								<strong>Selected:</strong> {clickedPoint.title}
								{clickedPoint.group && <span className="text-blue-600">({clickedPoint.group})</span>}
								<br />
								<strong>Coordinates:</strong> {clickedPoint.lat.toFixed(4)}, {clickedPoint.lng.toFixed(4)}
							</p>
						</div>
					)}
				</div>

				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-xl font-semibold text-gray-800 mb-4">Interactive Map with Markers & Heatmap</h2>
					<GoogleMap
						center={{ lat: 37.7749, lng: -122.4194 }} // San Francisco
						zoom={12}
						height="600px"
						width="100%"
						className="w-full"
						markerGroups={markerGroups}
						heatmap={heatmapData}
						selectedPoint={selectedPoint}
						onPointClick={handlePointClick}
						searchablePoints={searchablePoints}
					/>
				</div>

				{/* Legend */}
				<div className="mt-6 bg-white rounded-lg shadow-lg p-6">
					<h3 className="text-lg font-semibold text-gray-800 mb-4">Map Legend</h3>

					{/* Marker Groups Legend */}
					<div className="mb-6">
						<h4 className="text-md font-medium text-gray-700 mb-3">Marker Groups</h4>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{markerGroups.map((group) => (
								<div
									key={group.name}
									className="flex items-center space-x-2"
								>
									<div
										className="w-4 h-4 rounded-full"
										style={{ backgroundColor: group.color }}
									></div>
									<span className="text-sm font-medium text-gray-700">
										{group.name} ({group.markers.length})
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Heatmap Legend */}
					<div>
						<h4 className="text-md font-medium text-gray-700 mb-3">Activity Heatmap</h4>
						<div className="flex items-center space-x-4">
							<div className="flex items-center space-x-2">
								<div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-red-500 rounded"></div>
								<span className="text-sm text-gray-600">Population/Activity Density</span>
							</div>
							<div className="text-xs text-gray-500">
								<span className="text-cyan-400">Low</span> → <span className="text-red-500">High</span>
							</div>
							<div className="text-xs text-gray-500">{heatmapData.data.length} data points</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
