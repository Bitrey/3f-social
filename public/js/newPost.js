var img = {
    tipo: "local",
    indirizzo: "default.jpg"
};

$(document).ready(function(){
    $("#titolo").focus();
});

function imageExists(url){
    try {
        var imgTry = new Image();
        imgTry.onload = function(){ img.tipo = "url"; img.indirizzo = url; $(".new-post-img").show(); $("#hiddenImgField").val(url); $(".new-post-img").attr("src", url); $("#cambia-img-modal").modal("hide")};
        imgTry.onerror = function(){ alert("Immagine non valida!"); };
        imgTry.src = url;
    } catch(e){
        alert("URL non valido!");
    }
}

$("#url-post-img").on("click", function(){
    var link = prompt("Inserisci l'URL dell'immagine");
    if(link){
        imageExists(link);
    }
});

let attachments = [];

$("#new-post-form").on("submit", function(){
    $("#hiddenAttField").val(JSON.stringify(attachments));
    $("#hiddenImgField").val(JSON.stringify(img));
});

$("#upload-file").on("click", function(){
    try {
        if(!$("#attachment")[0].files[0]){
            $("#status").empty().text("Nessun file selezionato");
            return false;
        } else if($("#attachment")[0].files[0].size > 10000000){
            $("#status").empty().text("Il file supera il limite di 10MB");
            return false;
        } else {
            $('#uploadForm').submit(function(){
                $("#status").empty().text("Caricamento file...");
                $(this).ajaxSubmit({

                    error: function(xhr){
                        $("#status").empty().text(`Errore! Stato: ${xhr.status}, testo: ${xhr.statusText}`);
                    },

                    success: function(response){
                        $("#status").empty().text(response.msg);
                        if(response.msg == "File caricato!"){
                            attachments.push({
                                name: response.name,
                                originalName: response.originalName,
                                size: response.size,
                                ext: response.ext
                            });
                        }
                    }
                });
                // Annulla rinfrescamento pagina
                return false;
            });
        }
    } catch(e){
        $("#status").empty().text("Errore: " + err.toString());
    }
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
            $('#imgForm').submit(function(){
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
                            $(".new-post-img").show();
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
});

$("#rimuovi-immagine").on("click", function(){
    img.tipo = "none";
    img.indirizzo = "none";
    $("#hiddenImgField").val("none");
    $(".new-post-img").hide();
});