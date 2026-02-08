import Swal from 'sweetalert2';

// Toast helper (top-right, auto-dismiss)
export const toast = (options = {}) => {
  const {
    title = '',
    text = '',
    icon = 'info',
    timer = 3000,
    position = 'top-end',
  } = options;
  return Swal.fire({
    toast: true,
    position,
    icon,
    title,
    text,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
  });
};

export const success = (title = 'Success', text = '') => Swal.fire({ icon: 'success', title, text });
export const error = (title = 'Error', text = '') => Swal.fire({ icon: 'error', title, text });
export const info = (title = 'Info', text = '') => Swal.fire({ icon: 'info', title, text });
export const warning = (title = 'Warning', text = '') => Swal.fire({ icon: 'warning', title, text });

export const confirm = async ({
  title = 'Are you sure?',
  text = '',
  confirmButtonText = 'Yes',
  cancelButtonText = 'Cancel',
  icon = 'warning',
  reverseButtons = true,
} = {}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons,
    focusCancel: true,
  });
  return result.isConfirmed;
};

export default { toast, success, error, info, warning, confirm };
