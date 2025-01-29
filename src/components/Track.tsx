import { TrackPosition } from "../types";

interface TrackProps {
	position: TrackPosition;
	athletes: number;
}

export const Track: React.FC<TrackProps> = ({ position, athletes }) => {
	const segments = Array(8).fill(0); // 8 segments per lap (50m each)

	return (
		<div className="w-full max-w-4xl mx-auto p-4">
			<div className="relative aspect-[2/1] bg-green-100 rounded-[200px] border-2 border-white overflow-hidden">
				{/* Track lanes */}
				{Array(9)
					.fill(0)
					.map((_, idx) => (
						<div
							key={idx}
							className="absolute w-[98%] h-[10%] border border-white rounded-[200px]"
							style={{
								top: `${idx * 11}%`,
								left: "1%",
							}}
						/>
					))}

				{/* Position markers */}
				{segments.map((_, idx) => (
					<div
						key={idx}
						className="absolute w-2 h-2 bg-yellow-400 rounded-full"
						style={{
							top: `${position.segment === idx ? position.lap * 11 : 0}%`,
							left: `${idx * 12.5}%`,
							display: position.segment === idx ? "block" : "none",
						}}
					/>
				))}
			</div>
		</div>
	);
};
