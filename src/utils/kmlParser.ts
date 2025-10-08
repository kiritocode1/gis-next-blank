/**
 * Enhanced KML Parser for Nashik Gramin Police Station Data
 */

export interface KMLFeature {
	name: string;
	properties: Record<string, string>;
	coordinates: { lat: number; lng: number }[];
	type: "polygon" | "point" | "linestring";
}

export interface KMLMarker {
	position: { lat: number; lng: number };
	title: string;
	properties: Record<string, string>;
	type: string;
}

export interface KMLParseResult {
	features: KMLFeature[];
	markers: KMLMarker[];
	bounds?: {
		north: number;
		south: number;
		east: number;
		west: number;
	};
	success: boolean;
	error?: string;
}

/**
 * Parse KML file using DOM parsing for maximum compatibility
 */
export async function parseKMLFile(kmlUrl: string): Promise<KMLParseResult> {
	try {
		console.log("🔄 Parsing KML file:", kmlUrl);

		// Fetch the KML file
		const response = await fetch(kmlUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch KML: ${response.status} ${response.statusText}`);
		}

		const kmlText = await response.text();
		// Clean the KML text to fix common XML issues
		const cleanedKmlText = kmlText.trim().replace(/^[\s\S]*?(<\?xml)/, "$1");
		console.log("📄 KML file size:", cleanedKmlText.length, "characters");

		// Parse using DOMParser
		const parser = new DOMParser();
		const kmlDoc = parser.parseFromString(cleanedKmlText, "application/xml");

		// Check for parser errors
		const parserError = kmlDoc.querySelector("parsererror");
		if (parserError) {
			throw new Error(`KML parsing error: ${parserError.textContent}`);
		}

		// Extract features and markers using direct DOM parsing
		const result = parseKMLDirect(kmlDoc);

		console.log("✅ KML parsing completed:", {
			features: result.features.length,
			markers: result.markers.length,
		});

		return {
			...result,
			success: true,
		};
	} catch (error) {
		console.error("❌ Error parsing KML:", error);
		return {
			features: [],
			markers: [],
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Direct DOM parsing for KML files
 */
function parseKMLDirect(kmlDoc: Document): { features: KMLFeature[]; markers: KMLMarker[] } {
	const features: KMLFeature[] = [];
	const markers: KMLMarker[] = [];

	// Extract placemarks
	const placemarks = kmlDoc.querySelectorAll("Placemark");
	console.log("📍 Found placemarks:", placemarks.length);

	placemarks.forEach((placemark, index) => {
		const name = placemark.querySelector("name")?.textContent || `Location ${index + 1}`;

		// Extract extended data
		const simpleData = placemark.querySelectorAll("SimpleData");
		const properties: Record<string, string> = {};

		simpleData.forEach((data) => {
			const attrName = data.getAttribute("name");
			const value = data.textContent;
			if (attrName && value) {
				properties[attrName] = value;
			}
		});

		// Extract coordinates from polygons
		const coordinatesElement = placemark.querySelector("coordinates");
		if (coordinatesElement) {
			const coordinates = coordinatesElement.textContent?.trim();
			if (coordinates) {
				const coordPairs = coordinates.split(/\s+/).filter((coord) => coord.includes(","));
				if (coordPairs.length > 0) {
					const polygonCoords = coordPairs
						.map((coord) => {
							const parts = coord.split(",");
							if (parts.length >= 2) {
								const lng = parseFloat(parts[0]);
								const lat = parseFloat(parts[1]);
								if (!isNaN(lat) && !isNaN(lng)) {
									return { lat, lng };
								}
							}
							return null;
						})
						.filter((coord): coord is { lat: number; lng: number } => coord !== null);

					if (polygonCoords.length > 0) {
						features.push({
							name,
							properties,
							coordinates: polygonCoords,
							type: "polygon",
						});
					}
				}
			}
		}

		// Extract point coordinates from properties
		const lat = parseFloat(properties.latitude);
		const lng = parseFloat(properties.longitude);

		if (!isNaN(lat) && !isNaN(lng)) {
			markers.push({
				position: { lat, lng },
				title: name,
				properties,
				type: "police_station",
			});
		}
	});

	return { features, markers };
}
