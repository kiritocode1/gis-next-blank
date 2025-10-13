import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import readline from "readline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
	const csvPath = path.join(process.cwd(), "emergency-data", "dial112.csv");

	// Check if file exists first
	if (!fs.existsSync(csvPath)) {
		console.error("❌ CSV file not found:", csvPath);
		return NextResponse.json({ success: false, error: "CSV file not found" }, { status: 404 });
	}

	console.log("🚨 Starting Dial 112 SSE stream from:", csvPath);

	try {
		const encoder = new TextEncoder();
		let clientDisconnected = false;

		const stream = new ReadableStream({
			async start(controller) {
				try {
					console.log("📡 SSE connection established");
					// Send initial comment to establish stream
					controller.enqueue(encoder.encode(": stream start\n\n"));

					const fileStream = fs.createReadStream(csvPath, { encoding: "utf8" });
					const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

					let isHeader = true;
					let count = 0;
					for await (const line of rl) {
						// Check if client disconnected
						if (clientDisconnected) {
							console.log(`⚠️ Client disconnected, stopping at ${count} records`);
							fileStream.destroy();
							break;
						}

						if (!line || line.trim().length === 0) continue;
						if (isHeader) {
							isHeader = false;
							continue;
						}
						const parts = line.split(",");
						if (parts.length < 7) continue;
						const lat = Number(parts[4]?.trim());
						const lng = Number(parts[5]?.trim());
						if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

						const payload = {
							id: String(parts[0]?.trim() || ""),
							eventId: String(parts[1]?.trim() || ""),
							policeStation: String(parts[2]?.trim() || ""),
							callType: String(parts[3]?.trim() || ""),
							latitude: lat,
							longitude: lng,
							receivedAt: parts.slice(6).join(",").trim(),
						};

						try {
							const chunk = `event: row\ndata: ${JSON.stringify(payload)}\n\n`;
							controller.enqueue(encoder.encode(chunk));
							count++;
						} catch {
							// Client disconnected mid-stream
							console.log(`⚠️ Client disconnected at ${count} records`);
							clientDisconnected = true;
							fileStream.destroy();
							break;
						}
					}

					if (!clientDisconnected) {
						console.log(`✅ Streamed ${count} Dial 112 records`);
						controller.enqueue(encoder.encode(`event: done\ndata: end\n\n`));
						controller.close();
					}
				} catch (err) {
					console.error("❌ Stream error:", err);
					if (!clientDisconnected) {
						try {
							controller.error(err);
						} catch {
							// Controller already closed
						}
					}
				}
			},
			cancel() {
				clientDisconnected = true;
				console.log("🚫 Client cancelled SSE stream");
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream; charset=utf-8",
				"Cache-Control": "no-cache, no-transform",
				Connection: "keep-alive",
				"X-Accel-Buffering": "no",
			},
		});
	} catch (error) {
		console.error("❌ SSE failed:", error);
		return NextResponse.json({ success: false, error: "SSE init failed" }, { status: 500 });
	}
}
