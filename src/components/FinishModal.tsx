interface FinishModalProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export const FinishModal: React.FC<FinishModalProps> = ({
	isOpen,
	onConfirm,
	onCancel,
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg max-w-md w-full mx-4 p-6 shadow-xl">
				<div className="mb-4">
					<h2 className="text-xl font-semibold text-gray-900">
						Finalizar Evaluación
					</h2>
					<p className="mt-2 text-sm text-gray-500">
						¿Está seguro que desea finalizar la evaluación? Esta acción no se
						puede deshacer.
					</p>
				</div>

				<div className="flex justify-end space-x-3 mt-6">
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
					>
						Finalizar
					</button>
				</div>
			</div>
		</div>
	);
};
