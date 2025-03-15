import Swal from "sweetalert2";

export const showLoading = (message = "Cargando...") => {
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false, 
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export const hideLoading = () => {
  Swal.close();
};