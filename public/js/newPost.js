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
    $("#quill-input").val(quill.root.innerHTML);
    $("#quill-input-JSON").val(JSON.stringify(quill.getContents()));
    if($(".ql-editor").text().length < 30 || $(".ql-editor").text().length > 1500){
        alert("Il contenuto deve avere tra 30 e 1500 caratteri");
        return false;
    } else if($("#titolo").val().length < 5 || $("#titolo").val().length > 30){
        alert("Il titolo deve avere tra 5 e 30 caratteri");
        return false;
    }
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
            $('#uploadForm').one("submit", function(){
                $("#status").empty().text("Caricamento file...");
                $(this).ajaxSubmit({
                    error: function(xhr){
                        $("#status").empty().text(`Errore! Stato: ${xhr.status}, testo: ${xhr.statusText}`);
                    },
                    success: function(response){
                        $("#status").empty().text(response.msg);
                        attachments.push({
                            name: response.name,
                            originalName: response.originalName,
                            size: response.size,
                            ext: response.ext
                        });
                        $("#allegato-modal").modal('hide');
                        $("#show-attachment-div").show();
                        $("#attachments-div").append(`<div class="card m-2"> <div class="card-body"> <h5 class="card-title file-title" data-file="${response.name}/${response.originalName}">${response.originalName}</h5> <h6 class="card-subtitle mb-2 text-muted">Dimensione: ${formatBytes(response.size)}</h6> <h6 class="card-subtitle mb-2 text-muted">Estensione: ${response.ext}</h6> <button type="button" data-file="${response.name}" class="btn btn-danger delete-attachment"><i class="fas fa-trash-alt"></i> Elimina</button></div></div>`);
                        truncateFileNames();
                    }
                });
                // Annulla rinfrescamento pagina
                return false;
            });
        }
    } catch(e){
        $("#status").empty().text("Errore: " + e.toString());
    }
});

function truncateFileNames(){
    $(".file-title").each(function(){
        if($(this).text().length > 16){
            var text = $(this).text();
            text = text.substr(0, 16) + "...";
            $(this).text(text);
        }
    });
}

function formatBytes(a,b){
    if(0==a)return"0 Bytes";
    var c=1024,
    d=b||2,
    e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],
    f=Math.floor(Math.log(a)/Math.log(c));
    return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]
}

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

var quill = new Quill('#editor', {
    modules: {
        syntax: true,
        toolbar: [
            ['bold', 'italic'],
            ['link', 'blockquote', 'code-block', 'formula'],
            [{ list: 'ordered' }, { list: 'bullet' }]
        ]
    },
    placeholder: 'Scrivi il contenuto del post...',
    theme: 'snow'
});
// data-toggle="tooltip" data-placement="top" title="Tooltip on top"
$('.ql-formula').attr("data-toggle", "tooltip").attr("data-placement", "top").prop("title", "Usa un LaTeX editor per un risultato migliore").tooltip();

$(document).on("click", ".delete-attachment", function(){
    let foundFile = false;
    attachments.forEach(function(file, i){
        if(file.name == $(this).data("file")){
            foundFile = true;
            attachments.splice(i, 1);
            $(this).parent().parent().remove();
            return false;
        }
        if(!foundFile){
            alert("Errore: impossibile trovare il file");
        }
    });
});