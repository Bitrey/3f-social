$(".download").on("click", function(){
    try {
        $(".downloadForm").one("submit", function(){

                $(this).ajaxSubmit({

                    error: function(xhr){
                        status("Errore: " + xhr.status);
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
        text = text.substr(0, 16) + "...";
        $(this).text(text);
    }
});

$("#font-slider").on("input", function(){
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

$("input[type=radio][name=comment-order]").change(function(){
    window.location.href = window.location.href.split("?")[0] + "?invertComments=" + !!$("#comment-inverse").is(":checked") + "&sortComments=" + $(this).val() + "&scrollTop=" + $(document).scrollTop();
});

$("#comment-inverse").change(function(){
    window.location.href = window.location.href.split("?")[0] + "?invertComments=" + !!this.checked + "&sortComments=" + $("input[name=comment-order]:checked").val() + "&scrollTop=" + $(document).scrollTop();
});

const urlParams = new URLSearchParams(window.location.search);
const scrollTop = urlParams.get("scrollTop");
if(scrollTop){
    $(document).scrollTop(scrollTop);
}

$(".edit-comment-btn").on("click", function(){
    let comment = $(this).parent().parent().children(".comment");
    let textarea = $(this).parent().parent().children(".edit-comment-div");
    textarea.children("textarea").val($.trim(comment.text()));
    textarea.show();
    $(this).parent().hide();
    comment.hide();
});

$(".edit-comment-cancel").on("click", function(){
    let comment = $(this).parent().parent().parent().children(".comment");
    let textarea = $(this).parent().parent().parent().children(".edit-comment-div");
    textarea.hide();
    $(this).parent().parent().parent().children(".comment-settings").show();
    comment.show();
});

$(".edit-comment-confirm").on("click", function(){
    let asyncThis = this;
    let comment = $(this).parent().parent().parent().children(".comment");
    let textarea = $(this).parent().parent().parent().children(".edit-comment-div");
    $.ajax({
        method: "PUT",
        url: `/comments/${$(this).data("comment")}`,
        data: { contenuto: $.trim(textarea.children("textarea").val()) },
        success: function(data, textStatus, xhr){
            let response = JSON.parse(xhr.responseText);
            let date = new Date(response.data);
            comment.html(response.contenuto);
            comment.parent().children("small").text(`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`);
            textarea.hide();
            $(asyncThis).parent().parent().parent().children(".comment-settings").show();
            comment.show();
        },
        error: function(xhr, textStatus, errorThrown){
            alert(`Errore ${xhr.status} ${errorThrown}: ${xhr.responseText}`);
        }
    });
});

let commentToDelete;
$(".delete-comment-btn").on("click", function(){
    commentToDelete = $(this).data("comment");
});

$("#delete-comment").on("click", function(){
    let asyncComment = commentToDelete;
    let deleteText = $(this).text();
    let asyncThis = this;
    $(this).html(`<div class="spinner-border spinner-border-sm" role="status"><span class="sr-only">Loading...</span></div>`);
    $.ajax({
        method: "DELETE",
        url: `/comments/${asyncComment}`,
        success: function(data, textStatus, xhr){
            $(`#${asyncComment}`).parent().parent().remove();
            if($.trim($(".comment-list").html()).length <= 0){
                $(".comment-sorting").hide();
            }
        },
        error: function(xhr, textStatus, errorThrown){
            alert(`Errore ${xhr.status} ${errorThrown}: ${xhr.responseText}`);
        },
        complete: function(){
            $(asyncThis).text(deleteText);
            $("#modal-delete-comment").modal("hide");
        }
    });
});