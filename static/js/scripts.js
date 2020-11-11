/*!
    * Start Bootstrap - Grayscale v6.0.3 (https://startbootstrap.com/theme/grayscale)
    * Copyright 2013-2020 Start Bootstrap
    * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-grayscale/blob/master/LICENSE)
    */
    (function ($) {
    "use strict"; // Start of use strict

    var playlists = [];
    var selected_playlist_ids = [];

    var showPlaylist = function(field) {
        if (playlists.length == 0) {
            postPlaylists(field);
        }
        else {
            var p_l = playlists.length;
            var [id, name, emb, url] = playlists.pop();
            var div = '<div class="text-center">' + 
                '<h2 class="text-white-50 mx-auto mt-2 mb-5">Select up to ' + parseInt(Math.min(p_l, 10 - selected_playlist_ids.length)) + ' out of ' + parseInt(p_l) + ' playlists left</h2>' +
                '<iframe src="' + emb + '" width="400" height="180" style="max-width: 100%;"' +
                                'frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>' +
                '<h2 class="text-white-50 mx-auto mt-2 mb-2">Do you want to include ' + '<a target="_blank" href="' + url + '">' + name + '</a>?</h2>' +
                '<div>' +
                  '<button class="btn btn-green" id="yes" value="' + id +'">Yes</button>' +
                  '<button class="btn btn-red" id="no">No</button>' +
                '</div>' +
                '<button class="btn btn-primary" id="enough">Enough</button>' +
              '</div>';
            field.replaceWith(div);
        }
    };

    var postPlaylists = function(field) {
        if (selected_playlist_ids.length == 0) {
            field.replaceWith("<h2 class=text-white mx-auto mt-2 mb-5 text-center>You have not selected any playlists...</h2>");
            setTimeout(() => {window.location.reload();}, 2000);
        }
        else {
            field = field.replaceWithPush("<h2 class=text-white mx-auto mt-2 mb-5 text-center>Getting feature statistics for selected playlists...</h2>");
            $.ajax({
                type: "POST",
                url: "/playlists",
                data: JSON.stringify({playlist_ids: selected_playlist_ids}),
                success: function(response)
                {
                    var choice = '<div class="text-center">' +
                    '<h2 class="text-white mx-auto mt-2 mb-5">How close to your comfort zone do you want to be?</h2>' +
                    '<h5 class="text-white-50 mx-auto mt-2 mb-5">Close will look for recommendations based on your top artists, \
                                                                 while further will include recommendations for related artists</h4>' +
                    '<div>' +
                      '<button class="btn btn-primary" id="shallow">Close</button>' +
                      '<button class="btn btn-primary" id="deep">Further</button>' +
                    '</div>' +
                    '</div>'
                    field.replaceWith(choice)
                },
                error: function(response) {
                    errorHandling(field);
                }
            });
        }
    };

    var profilingChoice = function(field, shallow) {
        var choice = shallow ? 'shallow' : 'deep';
        field = field.replaceWithPush("<h2 class=text-white mx-auto mt-2 mb-5 text-center>Getting your " + choice + " profiling...</h2>");
        $.ajax({
            type: "POST",
            url: "/profile-user",
            data: JSON.stringify({choice : shallow}),
            success: function(response)
            {
                var [url, emb] = JSON.parse(response);
                var embed = '<div class="text-center">' +
                            '<h2 class="text-white-50 mx-auto mt-2 mb-5">Your <a target="_blank" href="' + url + '">playlist</a> is ready</h2>' +
                            '<iframe src="' + emb + '" width="400" height="500" style="max-width: 100%;" ' +
                            'frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>' +
                            '</div>';
                field.replaceWith(embed);
            },
            error: function(response) {
                errorHandling(field);
            }
        });
    };

    $("form").submit(function (e) {
        e.preventDefault();

        var form = $(this);
        var url = form.attr('action');
        var field = $(this).replaceWithPush("<h2 class=text-white mx-auto mt-2 mb-5 text-center>Wait as we get the most popular playlists for this context...</h2>");

        $.ajax({
            type: "POST",
            url: url,
            data: form.serialize(),
            success: function(response)
            {
                playlists = JSON.parse(response);
                selected_playlist_ids = [];
                if (playlists.length == 0) {
                    field.replaceWith("<h2 class=text-white mx-auto mt-2 mb-5 text-center>We weren't able to find any playlists for this keyword...</h2>");
                    setTimeout(() => {window.location.reload();}, 2000);
                }
                else {
                    showPlaylist(field);                    
                }
            },
            error: function(response) {
                errorHandling(field);
            }
        });
    });

    var errorHandling = function(field) {
        field.replaceWith("<h2 class=text-white mx-auto mt-2 mb-5 text-center>Whooops, something went wrong, lets try again</h2>");
        setTimeout(() => {window.location.reload();}, 2000);
    }

    $(".mx-auto.text-center").on("click", "#yes", function() {
        var btn = $(this);
        selected_playlist_ids.push(btn.attr("value"))
        if (selected_playlist_ids.length < 10) {
            showPlaylist(btn.parent().parent());
        }
        else {
            postPlaylists(btn.parent().parent());
        }
    });

    $(".mx-auto.text-center").on("click", "#no", function() {
        var btn = $(this);
        showPlaylist(btn.parent().parent())
    });

    $(".mx-auto.text-center").on("click", "#enough", function() {
        var btn = $(this);
        postPlaylists(btn.parent())
    });

    $(".mx-auto.text-center").on("click", "#shallow", function() {
        var btn = $(this);
        profilingChoice(btn.parent().parent(), true)
    });

    $(".mx-auto.text-center").on("click", "#deep", function() {
        var btn = $(this);
        profilingChoice(btn.parent().parent(), false)
    });

    $.fn.replaceWithPush = function(a) {
        var $a = $(a);

        this.replaceWith($a);
        return $a;
    };

    var $loading = $('#loading').hide();
       $(document)
         .ajaxStart(function () {
             $loading.show();
         })
       .ajaxStop(function () {
            $loading.hide();
        });

    // Smooth scrolling using jQuery easing
    $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function () {
        if (
            location.pathname.replace(/^\//, "") ==
                this.pathname.replace(/^\//, "") &&
            location.hostname == this.hostname
        ) {
            var target = $(this.hash);
            target = target.length
                ? target
                : $("[name=" + this.hash.slice(1) + "]");
            if (target.length) {
                $("html, body").animate(
                    {
                        scrollTop: target.offset().top - 70,
                    },
                    1000,
                    "easeInOutExpo"
                );
                return false;
            }
        }
    });

    // Closes responsive menu when a scroll trigger link is clicked
    $(".js-scroll-trigger").click(function () {
        $(".navbar-collapse").collapse("hide");
    });

    // Activate scrollspy to add active class to navbar items on scroll
    $("body").scrollspy({
        target: "#mainNav",
        offset: 100,
    });

    // Collapse Navbar
    var navbarCollapse = function () {
        if ($("#mainNav").offset().top > 100) {
            $("#mainNav").addClass("navbar-shrink");
        } else {
            $("#mainNav").removeClass("navbar-shrink");
        }
    };
    // Collapse now if page is not at top
    navbarCollapse();
    // Collapse the navbar when page is scrolled
    $(window).scroll(navbarCollapse);
})(jQuery); // End of use strict
