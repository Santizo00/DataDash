import Swal from "sweetalert2";

/**
 * Muestra una alerta de éxito.
 */
export const showSuccessAlert = (title: string, message: string) => {
  Swal.fire({
    title: title,
    html: message,
    icon: "success",
    confirmButtonText: "Aceptar",
    confirmButtonColor: "#007bff",
  });
};

/**
 * Muestra una alerta de éxito personalizada con HTML.
 */
export const showCustomSuccessAlert = (title: string, htmlMessage: string) => {
  Swal.fire({
    title: title,
    html: htmlMessage,
    icon: "success",
    confirmButtonText: "Aceptar",
    confirmButtonColor: "#007bff",
  });
};

/**
 * Muestra una alerta de error.
 */
export const showErrorAlert = (title: string, message: string) => {
  Swal.fire({
    title: title,
    html: message,
    icon: "error",
    confirmButtonText: "Aceptar",
    confirmButtonColor: "#dc3545",
  });
};

/**
 * Muestra una alerta de advertencia.
 */
export const showWarningAlert = (title: string, message: string | HTMLElement) => {
  Swal.fire({
    title: title,
    html: message,
    icon: "warning",
    confirmButtonText: "Aceptar",
    confirmButtonColor: "#fd7e14",
  });
};

/**
 * Muestra una alerta de advertencia personalizada con múltiples botones usando SweetAlert2.
 * @param title - Título de la alerta
 * @param message - Mensaje o contenido HTML de la alerta
 * @param buttons - Array de objetos que definen los botones (texto, color, acción)
 * @returns Promesa que se resuelve cuando el usuario interactúa con la alerta
 */
export const showCustomWarningAlert = (
  title: string, 
  message: string | HTMLElement,
  buttons: Array<{
    text: string;
    color?: string;
    callback?: () => void;
  }>
) => {
  // Configuración básica
  const swalOptions: any = {
    title: title,
    html: message,
    icon: "warning",
    allowOutsideClick: false,
    showConfirmButton: false,
    showCancelButton: false,
    showDenyButton: false
  };

  // Configurar botones personalizados según SweetAlert2
  if (buttons && buttons.length > 0) {
    // El primer botón será el botón de confirmación
    swalOptions.showConfirmButton = true;
    swalOptions.confirmButtonText = buttons[0].text;
    swalOptions.confirmButtonColor = buttons[0].color || "#fd7e14";
    
    // Si hay un segundo botón, será el botón de cancelación
    if (buttons.length >= 2) {
      swalOptions.showCancelButton = true;
      swalOptions.cancelButtonText = buttons[1].text;
      swalOptions.cancelButtonColor = buttons[1].color || "#6c757d";
    }
    
    // Si hay un tercer botón, será el botón de deny (rechazo)
    if (buttons.length >= 3) {
      swalOptions.showDenyButton = true;
      swalOptions.denyButtonText = buttons[2].text;
      swalOptions.denyButtonColor = buttons[2].color || "#dc3545";
    }
    
    // Si hay más de 3 botones, no los podemos mostrar directamente con SweetAlert2
    // Tendríamos que implementar una solución más compleja
    if (buttons.length > 3) {
      console.warn("SweetAlert2 solo admite hasta 3 botones directamente. Los botones adicionales no se mostrarán.");
    }
  }

  // Mostrar la alerta
  return Swal.fire(swalOptions).then((result) => {
    // Ejecutar callback según el botón presionado
    if (result.isConfirmed && buttons[0]?.callback) {
      buttons[0].callback();
    } else if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel && buttons[1]?.callback) {
      buttons[1].callback();
    } else if (result.isDenied && buttons[2]?.callback) {
      buttons[2].callback();
    }
    
    return result;
  });
};


/**
 *Función para mostrar alerta de confirmación con checkboxes
 */
export const showConfirmWithCheckboxAlert = (title: string, message: string, checkboxes: { id: string, label: string }[]) => {
  return Swal.fire({
    title,
    html: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    input: 'checkbox',
    inputValue: 0,
    inputPlaceholder: checkboxes[0].label,
    preConfirm: (value) => {
      const result: Record<string, boolean> = {};
      result[checkboxes[0].id] = value;
      return result;
    }
  });
};

/**
 * Muestra una alerta de confirmación con botones Confirmar/Cancelar
 * @param title Título de la alerta
 * @param message Mensaje HTML de la alerta
 * @param onConfirm Función a ejecutar si el usuario confirma
 * @param onCancel Función opcional a ejecutar si el usuario cancela
 */
export const showConfirmAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  Swal.fire({
    title: title,
    html: message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, confirmar",
    cancelButtonText: "Cancelar",
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  });
};