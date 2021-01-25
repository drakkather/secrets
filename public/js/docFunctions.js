// jshint esversion:6

//  Con esta funcion cambio la imagen anterior por la nueva en la misma etiqueta img
let loadFile = function(event) {
  let image = document.getElementById("imageProfile");
  image.src = URL.createObjectURL(event.target.files[0]);
};

// Con esta funcion controlo que el archivo no pese mas de 1Mb que establezco en el data-max-size del input file
$(function() {
  let fileInput = $(".form-control-file");
  let maxSize = fileInput.data("max-size") * 1000;
  $(".upload-form").submit(function(e) {
    if (fileInput.get(0).files.length) {
      let fileSize = fileInput.get(0).files[0].size; //  en bytes
      if (fileSize > maxSize) {
        alert("El archivo no puede superar 1 Mb");
        return false;
      }
    }
  });
});
