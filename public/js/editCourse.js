let corso = JSON.parse($("#corso-json").text());
$("#corso-json").remove();

$(function(){
    $('[data-toggle="tooltip"]').tooltip();
});

let img = {
    tipo: corso.immagine.tipo,
    indirizzo: corso.immagine.indirizzo
};

$(document).ready(function(){
    $("#titolo").focus();
});

function imageExists(url){
    try {
        let imgTry = new Image();
        imgTry.onload = function(){ img.tipo = "url"; img.indirizzo = url; $("#hiddenImgField").val(url); $(".new-post-img").attr("src", url); $("#cambia-img-modal").modal("hide")};
        imgTry.onerror = function(){ alert("Immagine non valida!"); };
        imgTry.src = url;
    } catch(e){
        alert("URL non valido!");
    }
}

$("#url-post-img").on("click", function(){
    let link = prompt("Inserisci l'URL dell'immagine");
    if(link){
        imageExists(link);
    }
});

$("#new-post-form").on("submit", function(){
    $("#hiddenImgField").val(JSON.stringify(img));
});

$("#upload-post-img").on("click", function(){
    $("#cambia-img-modal").modal("hide");
    $("#carica-img-modal").modal("show");
});

$("#upload-img").on("click", function(){
    try {
        if(!$("#img-attachment")[0].files[0]){
            $("#status-img").empty().text("Nessun file selezionato");
            return false;
        } else if($("#img-attachment")[0].files[0].size > 10000000){
            $("#status-img").empty().text("L'immagine supera il limite di 10MB");
            return false;
        } else {
            $('#imgForm').one("submit", function(){
                $("#status-img").empty().text("Caricamento file...");
                $(this).ajaxSubmit({

                    error: function(xhr){
                        $("#status").empty().text(`Errore! Stato: ${xhr.status}, testo: ${xhr.statusText}`);
                    },

                    success: function(response){
                        $("#status-img").empty().text(response.msg);
                        if(response.msg == "Immagine caricata!"){
                            img.tipo = "local";
                            img.indirizzo = response.name;
                            $("#carica-img-modal").modal("hide");
                            $(".new-post-img").attr("src", `/uploads/${response.name}`);
                        }
                    }
                });
                // Annulla rinfrescamento pagina
                return false;
            });
        }
    } catch(e){
        $("#status-img").empty().text("Errore: " + err.toString());
    }
})