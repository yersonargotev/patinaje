import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { toast } from "sonner";

interface EditObservationsModalProps {
	show: boolean;
	onClose: () => void;
	evaluationId: number;
	initialObservations: string;
	onSuccess: () => void;
}

export const EditObservationsModal: React.FC<EditObservationsModalProps> = ({
	show,
	onClose,
	evaluationId,
	initialObservations,
	onSuccess,
}) => {
	const [observations, setObservations] = useState(initialObservations);
	const [saving, setSaving] = useState(false);

	if (!show) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			setSaving(true);
			await invoke("update_evaluation_observations", {
				evaluationId,
				observations,
			});
			toast.success("Observaciones actualizadas exitosamente");
			onSuccess();
			onClose();
		} catch (error) {
			console.error("Error updating observations:", error);
			toast.error("Error al actualizar las observaciones");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
				<h2 className="text-xl font-bold mb-4">Editar Observaciones</h2>
				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label
							htmlFor="observations"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Observaciones
						</label>
						<textarea
							id="observations"
							value={observations}
							onChange={(e) => setObservations(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							rows={4}
							placeholder="Ingrese las observaciones..."
						/>
					</div>
					<div className="flex justify-end space-x-4">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-gray-600 hover:text-gray-800"
							disabled={saving}
						>
							Cancelar
						</button>
						<button
							type="submit"
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
							disabled={saving}
						>
							{saving ? "Guardando..." : "Guardar"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
