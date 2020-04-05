$(".download").on("click", function(){
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

// Tronca file con nome > 16 caratteri
$(".file-title").each(function(){
    if($(this).text().length > 16){
        var text = $(this).text();
        text = text.substr(0, 16) + '...';
        $(this).text(text);
    }
});

$('#font-slider').on('input', function(){
    let fontSize = ($(this).val() / 20) + "rem";
    $("#contenuto").css("fontSize", fontSize);
});

$("#new-comment").on("submit", function(){
    let length = $("#input-comment").val().length;
    if(length < 5 || length > 500){
        alert("Il commento deve avere tra 5 e 500 caratteri.");
        return false;
    }
    let btnHTML = $("#submit-comment").html();
    let comment = $("#input-comment").val();
    $("#submit-comment").attr("disabled", true).html('<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>');
    $(this).ajaxSubmit({
        error: function(xhr, r2){
            alert(`Errore ${xhr.status}: ${xhr.responseText}`);
        },
        complete: function(res){
            location.reload();
            $("#submit-comment").attr("disabled", false).html(btnHTML);
        }
    });
    $("#input-comment").val("");
    return false;
});

function castVote(asyncThis, thing){
    let comment = $(asyncThis).parent().attr("id");
    let children = $(asyncThis).children(`.${thing}s`);
    let things = children.text();
    children.html(`<div class="spinner-border spinner-border-sm" role="status"><span class="sr-only">Loading...</span></div>`);
    $.ajax({
        method: "POST",
        url: `/comments/${comment}/${thing}`,
        success: function(data, textStatus, xhr){
            let response = JSON.parse(xhr.responseText);
            children.text(response[thing]);
            let opposite = thing == "like" ? "dislike" : "like";
            $(asyncThis).parent().children(`.${opposite}-comment`).children(`.${opposite}s`).text(response[opposite]);
        },
        error: function(xhr, textStatus, errorThrown){
            alert(`Errore ${xhr.status} ${errorThrown}: ${xhr.responseText}`);
            children.text(things);
        }
    });
}

$(".like-comment").on("click", function(){
    castVote(this, "like");
});

$(".dislike-comment").on("click", function(){
    castVote(this, "dislike");
});