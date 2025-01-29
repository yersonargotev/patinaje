import { User } from "lucide-react";
import type { Athlete } from "../types";

interface AthleteManagerProps {
	athletes: Athlete[];
	onAthleteUpdate: (athlete: Athlete) => void;
}

export const AthleteManager: React.FC<AthleteManagerProps> = ({
	athletes,
	onAthleteUpdate,
}) => {
	return (
		<div className="bg-white p-4 rounded-lg shadow-md">
			<h2 className="text-lg font-semibold mb-4">Athletes</h2>
			<div className="space-y-4">
				{athletes.map((athlete) => (
					<div
						key={athlete.id}
						className="flex flex-col space-y-2 p-4 bg-gray-50 rounded-md"
					>
						<div className="flex items-center">
							<User className="w-5 h-5 mr-2 text-gray-500" />
							<input
								type="text"
								value={athlete.name}
								onChange={(e) =>
									onAthleteUpdate({ ...athlete, name: e.target.value })
								}
								placeholder={`Athlete ${athlete.id}`}
								className="bg-transparent border-none focus:ring-0"
							/>
						</div>

						<div className="grid grid-cols-3 gap-2">
							<div>
								<label className="block text-sm text-gray-500" htmlFor="age">
									Age
								</label>
								<input
									type="number"
									value={athlete.age || ""}
									onChange={(e) =>
										onAthleteUpdate({
											...athlete,
											age: Number.parseInt(e.target.value),
										})
									}
									className="w-full rounded-md border-gray-300"
								/>
							</div>

							<div>
								<label className="block text-sm text-gray-500" htmlFor="weight">
									Weight (kg)
								</label>
								<input
									type="number"
									step="0.1"
									value={athlete.weight || ""}
									onChange={(e) =>
										onAthleteUpdate({
											...athlete,
											weight: Number.parseFloat(e.target.value),
										})
									}
									className="w-full rounded-md border-gray-300"
								/>
							</div>

							<div>
								<label className="block text-sm text-gray-500">
									Height (cm)
								</label>
								<input
									type="number"
									value={athlete.height || ""}
									onChange={(e) =>
										onAthleteUpdate({
											...athlete,
											height: parseFloat(e.target.value),
										})
									}
									className="w-full rounded-md border-gray-300"
								/>
							</div>
						</div>

						<div className="flex justify-between items-center mt-2">
							<span className="text-sm text-gray-500">
								Completed: {athlete.completedPeriods.length}
							</span>
							<button
								onClick={() =>
									onAthleteUpdate({ ...athlete, active: !athlete.active })
								}
								className={`px-2 py-1 rounded ${
									athlete.active
										? "bg-green-100 text-green-800"
										: "bg-gray-100 text-gray-800"
								}`}
							>
								{athlete.active ? "Active" : "Inactive"}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
