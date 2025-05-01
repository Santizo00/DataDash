import React from "react";
import { showWarningAlert } from "../components/AlertService";
import type { BaseDatos, FormDataType } from "../pages/Products";

interface ModalProductProps {
  abierto: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
  basesDatos: BaseDatos[];
  productoEditando: any; // puedes tiparlo como Producto si lo exportas
  calcularPorcentajeMargen: (costo: number, precio: number) => number;
  baseOriginal: number | null;
}

export const ModalProduct: React.FC<ModalProductProps> = ({
  abierto,
  onClose,
  onSubmit,
  formData,
  setFormData,
  basesDatos,
  productoEditando,
  calcularPorcentajeMargen,
  baseOriginal
}) => {
  if (!abierto) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
    // Convertir explícitamente a los tipos correctos
    const newFormData = {
      ...formData,
      [name]:
        name === "Existencia" || name === "Costo" || name === "Precio"
          ? parseFloat(value) || 0
          : name === "Id_Base"
          ? parseInt(value, 10)
          : value,
    };
  
    // Recalcular margen si cambian Costo o Precio
    if (name === "Costo" || name === "Precio") {
      newFormData.Margen = calcularPorcentajeMargen(
        name === "Costo" ? parseFloat(value) || 0 : formData.Costo,
        name === "Precio" ? parseFloat(value) || 0 : formData.Precio
      );
    }
  
    // ⚠️ Mostrar advertencia si cambia la base de datos en modo edición
    if (
      name === "Id_Base" &&
      productoEditando &&
      baseOriginal !== null &&
      parseInt(value) !== baseOriginal
    ) {
      const nuevaBase = basesDatos.find(b => b.Id_Base === parseInt(value))?.BaseDatos || "Desconocida";
      const originalBase = basesDatos.find(b => b.Id_Base === baseOriginal)?.BaseDatos || "Desconocida";
      const codigo = formData.CodigoProducto;
  
      // Mensaje diferente según si se elige "Todas las Bases" o una base específica
      const mensaje = parseInt(value) === 1
        ? `⚠️ Se detectó un cambio de base de datos para el producto <strong>${codigo}</strong>.<br><br>
          - El producto <strong>${codigo}</strong> se <strong>actualizará</strong> en todas las bases donde exista.<br>
          - Si el producto <strong>${codigo}</strong> NO existe en alguna base, se <strong>creará</strong>`
        : `⚠️ Se detectó un cambio de base de datos para el producto <strong>${codigo}</strong>.<br><br>
          - Si el producto <strong>${codigo}</strong> NO existe en <strong>${nuevaBase}</strong>, se <strong>creará</strong>.<br>
          - Si el producto <strong>${codigo}</strong> YA existe en <strong>${nuevaBase}</strong>, se <strong>actualizará</strong>.<br>
          - El producto <strong>${codigo}</strong> será <strong>eliminado</strong> de <strong>${originalBase}</strong>.`;

      showWarningAlert(
        "Advertencia: Cambio de Base de Datos",
        mensaje
      );
    }
  
    setFormData(newFormData);
  };  

  const porcentajeMargen = calcularPorcentajeMargen(formData.Costo, formData.Precio);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-black">
          {productoEditando ? "Editar Producto" : "Nuevo Producto"}
        </h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Código</label>
            <input
              type="text"
              name="CodigoProducto"
              placeholder="Código del producto"
              value={formData.CodigoProducto}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Descripción</label>
            <input
              type="text"
              name="Descripcion"
              placeholder="Descripción del producto"
              value={formData.Descripcion}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Existencia</label>
              <input
                type="number"
                name="Existencia"
                value={formData.Existencia}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Costo</label>
              <input
                type="number"
                name="Costo"
                value={formData.Costo}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Precio</label>
              <input
                type="number"
                name="Precio"
                value={formData.Precio}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded text-black placeholder-gray-400 bg-white"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between text-sm">
              <span>Porcentaje de Margen:</span>
              <span className={`font-semibold ${porcentajeMargen < 0 ? "text-red-500" : "text-green-500"}`}>
                {porcentajeMargen.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Base de Datos</label>
            <select
              name="Id_Base"
              value={formData.Id_Base}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded text-black bg-white"
              required
            >
              {basesDatos.length === 0 ? (
                <option value="">Cargando bases de datos...</option>
              ) : (
                basesDatos.map((base) => (
                  <option key={base.Id_Base} value={base.Id_Base}>
                    {base.BaseDatos}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {productoEditando ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};