'use strict';
/* ------------------------ */
/*         PE INTRO         */
/* ------------------------ */
/* Initialize URL first! */
var url = window.location.pathname,
    last = url.substr(url.lastIndexOf('/') + 1);
if(last == 'portfolio-extended.html' && !window.location.hash) window.location.hash = '#0';



/* ------------------------ */
/*       VCARD INTRO        */
/* ------------------------ */
/*$('#vcardintro div').one('animationend oAnimationEnd webkitAnimationEnd', function() {
    $('#vcardintro').fadeOut(400);
});*/




var carouselState = 0;
/* ------------------------ */
/*     PAGE LOAD EFFECT     */
/* ------------------------ */
(function(){
    /* Init all toolptis */
    $('[data-toggle="tooltip"]').tooltip().css('color','inherit');

    $('#loadContainer').show();
    setTimeout(function(){
        $('#loadContainer').addClass('closed').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() {
            $('#close-portfolio i').addClass('bounceIn').one('animationend oAnimationEnd webkitAnimationEnd', function() {

                $('header').addClass('fadeInDown');
                $('main, footer').addClass('fadeInUp');


                /* Manually trigger Bootstrap 4 Carousel to handle custom progress bar */
                var slideInterval = 8000,
                    slideTransition = 600,
                    loadbartime = slideInterval - slideTransition - 400, //400 - Safe Margin
                    progressbar = $('#carousel-progressbar');


                progressbar.css('animation-duration',loadbartime+'ms');


                $('#portfolio-carousel').carousel({

                    interval : slideInterval,
                    pause : "false"

                }).on('slide.bs.carousel', function(e){

                    progressbar.removeClass('animated');
                    window.location.hash = e.relatedTarget.dataset.prjid;

                }).on('slid.bs.carousel', function(){

                    if(carouselState != 0) progressbar.addClass('animated');

                }).carousel('pause');

            });
        });
    }, 3000);
})();





/* ------------------------ */
/*    CAROUSEL CONTROLS     */
/* ------------------------ */
$('#carouselControl').click(function(){
    if($(this).hasClass('fa-play')){
        $('#portfolio-carousel').carousel('cycle');
        carouselState = 1;
        $('#carousel-progressbar').addClass('animated');
        $(this).removeClass('fa-play').addClass('fa-pause');
    }else{
        $('#portfolio-carousel').carousel('pause');
        carouselState = 0;
        $('#carousel-progressbar').removeClass('animated');
        $(this).removeClass('fa-pause').addClass('fa-play');
    }
});




/* ------------------------ */
/*   MANUAL RESPONSIVENESS  */
/* ------------------------ */
function manualResponse(){
    if($(window).width() < 768) {
        $('#vcard-nav').removeClass('flex-column').parent().addClass('no-bg');
        if($(window).height() < 680){ $('#vcard > .row').removeClass('align-items-center'); }

    }else{
        if($(window).height() > 680){ $('#vcard > .row').addClass('align-items-center'); }
        $('#vcard-nav').addClass('flex-column').parent().removeClass('no-bg');
    }
}
$(window).on('resize', manualResponse);
