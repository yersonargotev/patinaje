import { TrackPosition } from "../types";
import { getPeriodData } from "../utils/testData";

interface TrackProps {
	position: TrackPosition;
	currentPeriod: number;
}

interface LightIndicatorProps {
	active: boolean;
	top: string;
	left: string;
}

const LightIndicator: React.FC<LightIndicatorProps> = ({
	active,
	top,
	left,
}) => (
	<div
		className={`absolute w-3 h-3 transition-all duration-300 transform ${
			active
				? "bg-yellow-400 scale-125 shadow-[0_0_15px_#FDE047] z-20"
				: "bg-white/50 scale-100"
		}`}
		style={{
			top,
			left,
			borderRadius: "50%",
			boxShadow: active ? "0 0 10px rgba(250, 204, 21, 0.7)" : "none",
		}}
	/>
);

export const Track: React.FC<TrackProps> = ({ position, currentPeriod }) => {
	const segments = Array(4).fill(0); // 4 segments per lap (50m each)
	const periodData = getPeriodData(currentPeriod);

	// Calculate expected segment based on current period timing
	const getExpectedSegment = () => {
		if (!periodData) return null;
		const totalSegments = 16; // 4 laps * 4 segments
		const currentSegment =
			Math.floor(position.elapsedTime / periodData.partialTime) % totalSegments;
		return currentSegment;
	};

	const expectedSegment = getExpectedSegment();

	// Calculate positions for a segment in the oval track
	const getSegmentPosition = (segmentIdx: number, lapIdx: number) => {
		const trackWidth = 90; // Width percentage of the track
		const trackHeight = 90; // Height percentage of the track
		const centerX = 50; // Center X percentage
		const centerY = 50; // Center Y percentage
		const angle = (segmentIdx / 4) * Math.PI * 2 + Math.PI / 2; // Start from top

		// Adjust radius based on lap (outer to inner)
		const radiusX = trackWidth / 2 - lapIdx * 5; // Decrease radius for inner laps
		const radiusY = trackHeight / 2 - lapIdx * 5;

		const x = centerX + radiusX * Math.cos(angle);
		const y = centerY + radiusY * Math.sin(angle);

		return { x, y };
	};

	return (
		<div className="w-full max-w-4xl mx-auto p-4">
			<div className="relative aspect-[2/1] rounded-[200px] overflow-hidden shadow-lg">
				{/* Background grass texture */}
				<div className="absolute inset-0 bg-green-700 bg-opacity-80">
					<div className="absolute inset-0 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
				</div>

				{/* Red outer track */}
				<div className="absolute inset-[5%] bg-red-600 rounded-[200px]" />

				{/* Blue middle track */}
				<div className="absolute inset-[15%] bg-sky-500 rounded-[200px]" />

				{/* Green inner track */}
				<div className="absolute inset-[25%] bg-green-500 rounded-[200px]">
					<div className="absolute inset-0 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:8px_8px] opacity-20" />
				</div>

				{/* Light indicators for each segment */}
				{segments.map((_, segmentIdx) =>
					Array(4)
						.fill(0)
						.map((_, lapIdx) => {
							const segmentNumber = lapIdx * 4 + segmentIdx;
							const uniqueKey = `light-${segmentNumber}-${lapIdx}-${segmentIdx}`;
							const pos = getSegmentPosition(segmentIdx, lapIdx);
							return (
								<LightIndicator
									key={uniqueKey}
									active={expectedSegment === segmentNumber}
									top={`${pos.y}%`}
									left={`${pos.x}%`}
								/>
							);
						}),
				)}

				{/* Current position marker */}
				{position.segment >= 0 && (
					<div
						className="absolute transition-all duration-500 ease-in-out z-30"
						style={{
							...getSegmentPosition(position.segment, position.lap),
							transform: "translate(-50%, -50%)",
						}}
					>
						<div className="relative">
							<div className="absolute w-6 h-6 bg-white rounded-full animate-ping" />
							<div className="absolute w-5 h-5 bg-yellow-400 rounded-full animate-pulse" />
							<div className="relative w-4 h-4 bg-yellow-400 rounded-full shadow-lg">
								<div className="absolute inset-0 bg-white/50 rounded-full animate-pulse" />
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
