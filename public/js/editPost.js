let post = JSON.parse($("#post-text").text());
$("#post-text").remove();

var img = {
    tipo: post.immagine.tipo,
    indirizzo: post.immagine.indirizzo
};

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

$(document).ready(function(){
    $("#titolo").focus();
    quill.setContents(JSON.parse(post.contenutoJSON));
    $("#quill-input").html(post.contenutoJSON);
    if(post.immagine.tipo == "none"){
        img.tipo = "none";
        img.indirizzo = "none";
        $("#hiddenImgField").val("none");
        $(".new-post-img").hide();
    }
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

let dbAttachments = post.allegati;
let attachments = [];
if(dbAttachments){
    dbAttachments.forEach(function(dbAttachment){
        attachments.push({
            _id: dbAttachment._id,
            name: dbAttachment.indirizzo,
            originalName: dbAttachment.nome,
            size: dbAttachment.dimensione,
            ext: dbAttachment.estensione
        });
    });
}

$("#edit-post-form").on("submit", function(){
    $("#hiddenAttField").val(JSON.stringify(attachments));
    $("#hiddenImgField").val(JSON.stringify(img));
    $("#quill-input").val(quill.root.innerHTML);
    $("#quill-input-JSON").val(JSON.stringify(quill.getContents()));
});

$("#upload-file").on("click", function(){
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
                        // FAI QUALCOSA DEBUG NON VA
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

$(".download-btn").on("click", function(){
    try {
        $('.downloadForm').submit(function(){
                $(this).ajaxSubmit({
                    error: function(xhr){
                        status('Errore: ' + xhr.status);
                        alert("Errore");
                    },
                    success: function(response){
                        if(response.msg == "ok"){
                            alert("File scaricato!");
                        }
                    }
                });
                // Annulla rinfrescamento pagina
                return false;
            });
    } catch(e){
        $("#status").empty().text("Errore: " + err.toString());
    }
});
