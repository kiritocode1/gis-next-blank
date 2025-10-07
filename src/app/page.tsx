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

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-6xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">GIS System - Google Maps Integration</h1>

				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-xl font-semibold text-gray-800 mb-4">Interactive Map with Marker Groups</h2>
					<GoogleMap
						center={{ lat: 37.7749, lng: -122.4194 }} // San Francisco
						zoom={12}
						height="600px"
						width="100%"
						className="w-full"
						markerGroups={markerGroups}
					/>
				</div>

				{/* Legend */}
				<div className="mt-6 bg-white rounded-lg shadow-lg p-6">
					<h3 className="text-lg font-semibold text-gray-800 mb-4">Map Legend</h3>
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
			</div>
		</div>
	);
}
