import GoogleMap from "@/components/GoogleMap";

export default function Home() {
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

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-6xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">GIS System - Google Maps Integration</h1>

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
