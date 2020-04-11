var residenza, img;

$(document).ready(function(){
    residenza = JSON.parse($("#residenzaJSON").text());
    $("#residenzaJSON").remove();
    img = JSON.parse($("#immagineJSON").text());
    $("#immagineJSON").remove();
});

$("#inputComune").easyAutocomplete({
	url: "/json/comuni.json",
	getValue: "comune",
	list: {
		match: {
			enabled: true
		},
		onClickEvent: function(){
            residenza = $("#inputComune").getSelectedItemData();
            $("#inputProvincia").val(residenza.provincia);
            $("#inputRegione").val(residenza.regione);
            $("#breadcrumb-regione").text(residenza.regione);
            $("#breadcrumb-provincia").text(residenza.provincia);
            $("#breadcrumb-comune").text(residenza.comune);
            $(".residenza-div").css("display", "flex");
		}
    }
});

$("#update-profile-form").on("submit", function(){
    $("#hiddenImgField").val(JSON.stringify(img));
    $("#residenza").val(JSON.stringify(residenza));
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
                        status('Errore: ' + xhr.status);
                    },

                    success: function(response){
                        $("#status-img").empty().text(response.msg);
                        if(response.msg == "Immagine caricata!"){
                            img.tipo = "local";
                            img.indirizzo = response.name;
                            $("#carica-img-modal").modal("hide");
                            $(".post-img").attr("src", `/uploads/${response.name}`);
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

let errorTimer = false;
function errorURL(err){
    if(!errorTimer){
        let text = $("#img-upload-label").text();
        errorTimer = setTimeout(function(){
            $("#img-upload-label").text(text);
            $("#img-upload-label").css("color", "#212529");
            $("#img-upload-label").css("font-weight", 400);
            errorTimer = false;
        }, 3000);
        $("#img-upload-label").text(err);
        $("#img-upload-label").css("color", "red");
        $("#img-upload-label").css("font-weight", 700);
    }
}

let successTimer = false;
function successURL(success){
    if(!successTimer){
        let text = $("#img-upload-label").text();
        successTimer = setTimeout(function(){
            $("#img-upload-label").text(text);
            $("#img-upload-label").css("color", "#212529");
            $("#img-upload-label").css("font-weight", 400);
            successTimer = false;
        }, 3000);
        $("#img-upload-label").text(success);
        $("#img-upload-label").css("color", "green");
        $("#img-upload-label").css("font-weight", 700);
    }
}

function imageExists(url){
    try {
        var imgTry = new Image();
        imgTry.onload = function(){
            img.tipo = "url";
            img.indirizzo = url;
            $("#hiddenImgField").val(url);
            $(".post-img").attr("src", url);
            successURL("Immagine cambiata!");
        };
        imgTry.onerror = function(){
            errorURL("Immagine non valida!");
        };
        imgTry.src = url;
    } catch(e){
        alert("URL non valido!");
    }
}

$("#url-img").on("click", function(){
    imageExists($("#inputImmagine").val());
});

$("#generic-img").on("click", function(){
    img.tipo = "local";
    img.indirizzo = "user.png";
    $(".post-img").attr("src", '/uploads/user.png');
})