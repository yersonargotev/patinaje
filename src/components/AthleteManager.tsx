import { User } from "lucide-react";
import { useState } from "react";
import type { Athlete } from "../types";
import { EvaluationHistory } from "./EvaluationHistory";

interface AthleteManagerProps {
	athletes: Athlete[];
	onAthleteUpdate: (athlete: Athlete) => void;
}

export const AthleteManager: React.FC<AthleteManagerProps> = ({
	athletes,
	onAthleteUpdate,
}) => {
	const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(
		null,
	);

	return (
		<div className="bg-white p-4 rounded-lg shadow-md">
			<h2 className="text-lg font-semibold mb-4">Athletes</h2>
			<div className="space-y-4">
				{athletes.map((athlete) => (
					<div key={athlete.id} className="space-y-4">
						<div className="flex flex-col space-y-2 p-4 bg-gray-50 rounded-md">
							<div className="flex items-center">
								<User className="w-5 h-5 mr-2 text-gray-500" />
								<div className="flex-1">
									<input
										type="text"
										value={athlete.name}
										onChange={(e) =>
											onAthleteUpdate({ ...athlete, name: e.target.value })
										}
										placeholder={`Nombre del deportista ${athlete.id} *`}
										className={`w-full bg-transparent focus:ring-0 border-1 ${
											athlete.active && !athlete.name.trim()
												? "border-red-300 focus:border-red-500"
												: "border-gray-300"
										} rounded-md px-2 py-1`}
										required={athlete.active}
									/>
									{athlete.active && !athlete.name.trim() && (
										<p className="text-red-500 text-xs mt-1">
											El nombre es requerido para deportistas activos
										</p>
									)}
								</div>
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
										className="w-full rounded-md border-1 border-gray-300"
									/>
								</div>

								<div>
									<label
										className="block text-sm text-gray-500"
										htmlFor="weight"
									>
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
										className="w-full rounded-md border-1 border-gray-300"
									/>
								</div>

								<div>
									<label
										className="block text-sm text-gray-500"
										htmlFor="height"
									>
										Height (cm)
									</label>
									<input
										type="number"
										value={athlete.height || ""}
										onChange={(e) =>
											onAthleteUpdate({
												...athlete,
												height: Number.parseFloat(e.target.value),
											})
										}
										className="w-full rounded-md border-1 border-gray-300"
									/>
								</div>
							</div>

							<div className="flex justify-between items-center mt-2">
								<div className="flex items-center space-x-4">
									<span className="text-sm text-gray-500">
										Completed: {athlete.completedPeriods.length}
									</span>
									<button
										type="button"
										onClick={() => setSelectedAthleteId(athlete.id ?? null)}
										className="text-sm text-blue-600 hover:text-blue-800"
									>
										Ver historial
									</button>
								</div>
								<button
									type="button"
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

						{selectedAthleteId === athlete.id && athlete.id && (
							<div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
								<h3 className="text-md font-medium mb-4">
									Historial de Evaluaciones
								</h3>
								<EvaluationHistory athleteId={athlete.id} />
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
};
