'use strict';

angular.module('nameApp')

    .controller('vcardController', ['$timeout','$scope', 'nameAppFactory', function($timeout, $scope, nameAppFactory){


        nameAppFactory.getData().then(function(d) {
            $scope.profile = d.profile[0];
            $scope.skills = d.skills;
            $scope.experiences = d.experiences;
            $scope.education = d.education;
            $scope.projects = d.projects;
            $scope.projcat = d.projcat;

            //Needed to preload Images
            $scope.images = [];
            for(var i = 0; i < $scope.projects.length; i++){
                $scope.images.push($scope.projects[i].image);
            }

            $($scope.images).each(function(){
                $('<img/>')[0].src = this;
            });
        })


        // Paramenters needed to initialize carousel in portfolio-extended if absolutely accessed
        $scope.filters = { category: "All" };   //General Filter
        $scope.currentPrjId = 0;                //First Project being displayed


        // 'selectedF' class on portfolio filter nav: default 'All'
        $scope.selected = 0;
        $scope.selectFilter = function(index) {
            $scope.selected = index;
        };


        // Soft transition before site redirect
        $scope.softRedirect = function(e){
            e.preventDefault();
            $('body').addClass('hidden');
            setTimeout(function(){
                window.location = e.currentTarget.href;
            }, 1000);
            return false;
        }


        // Contact Form handler
        $scope.contact = function(){
            var contactform 	= $('#contactForm'),
                success		    = "Your message has been sent. Thank you!",
                response        = "";
            $('#contacts .fa.fa-cog').css("visibility","visible");
            $.ajax({
                type: "POST",
                url: "../php/contact.php",
                data: contactform.serialize(),
                success: function(data){
                    if(data == "SEND"){
                        response = '<div class="alert alert-success">'+success+'</div>';
                        contactform.find("input[type=text], textarea").val("");
                    }
                    else{
                        response = '<div class="alert alert-warning">'+data+'</div>';
                    }

                    // Hide any previous response text
                    $(".alert-success, .alert-warning").remove();
                    $('#contacts .fa.fa-cog').css("visibility","hidden");
                    // Show response message
                    contactform.prepend(response);
                }
            });
            return false;
        }


        // Scroll on Portoflio Item click
        $scope.scrollTop = function(){
            $("html, body").animate({ scrollTop: "0" });
        }


        // Put VCARD on top for small devices. (uses timeout hack to check when document is ready)
        $timeout(function(){
            if($(window).width() < 768) {
                $('#vcard-nav').removeClass('flex-column').parent().addClass('no-bg');
                $('#vcard > .row').removeClass('align-items-center');

            }else{
                $('#vcard > .row').addClass('align-items-center');
                $('#vcard-nav').addClass('flex-column').parent().removeClass('no-bg');
            }
        },1000);

    }])



// Init carousel to specific project element through URL parameters
    .directive('initCarousel', ['$timeout', function($timeout) {
        return {
            restrict: "A",
            link: function(scope, elem, attrs) {

                // Get URL hash to manually initialize carousel to whatever slide
                var prj  = window.location.hash.substr(1);

                var init = function(){
                    var item = $('.carousel-item[data-prjid="'+prj+'"]');
                    $('.carousel-indicator').eq(prj).addClass('active');
                    item.addClass('active');
                    $('.prj-img').css('background-image','url('+item.data('prjimg')+')');
                    $('.prj-ld').html(item.data('prjld'));
                    $('.prj-name span').html(item.data('prjname'));
                    $('.prj-link a').attr("href",item.data('prjlink'));
                    $('.prj-price span').html(item.data('prjprice'));               

                }
                // Angular hack to retrieve element after DOM is fully rendered, safe timeout should be lower than loader animation
                $timeout(init, 1000);
            }
        }
    }])

// Update info box on carousel change, note this HEAVILY relies on Bootstrap 4 carousel, consider detaching
    .directive('carouselChange', function(){
    return {
        restrict: "A",
        link: function(scope, elem) {

            elem.on('slide.bs.carousel', function (e) {
                var elem = e.relatedTarget.dataset;
                $('.prj-img').css('background-image','url('+elem.prjimg+')');
                $('.prj-ld').html(elem.prjld);
                $('.prj-name span').html(elem.prjname);
                $('.prj-link a').attr("href",elem.prjlink);
                $('.prj-price span').html(elem.prjprice);
            });
        }
    }
})

;
