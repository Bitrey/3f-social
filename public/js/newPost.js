var img = "/img/post/default.jpeg";

$(document).ready(function(){
    $("#titolo").focus();
});

function imageExists(url){
    try {
        var imgTry = new Image();
        imgTry.onload = function(){ img = url; $("#hiddenImgField").val(url); $(".post-img").attr("src", url)};
        imgTry.onerror = function(){ alert("Immagine non valida!"); };
        imgTry.src = url;
    } catch(e){
        alert("URL non valido!");
    }
}

$("#change-post-img").on("click", function(){
    var link = prompt("Inserisci l'URL dell'immagine");
    if(link){
        imageExists(link);
    }
})

$("#upload-file").on("click", function(){
    $('#uploadForm').submit(function(){
        $("#status").empty().text("Caricamento file...");
        $("#close-modal").attr("disabled", "true");
        $(this).ajaxSubmit({

            error: function(xhr){
                status('Error: ' + xhr.status);
            },

            success: function(response){
                $("#status").empty().text(response);
                if(response == "File caricato!"){
                    // FAI QUALCOSA DEBUG NON VA
                    $("#close-modal").attr("disabled", "false");
                }
            }
        });
        // Annulla rinfrescamento pagina
        return false;
    });
})