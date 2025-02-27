'use strict';

(function (angular) {
    angular
        .module('socialPluginContent')
        .controller('addBadgeCtrl', ['$rootScope','$scope', '$location','SocialBadges', 'SocialDataStore', 'Modals', 'Buildfire', 'EVENTS', '$timeout', 'SocialItems', 'Util', function ($rootScope,$scope, $location,SocialBadges, SocialDataStore, Modals, Buildfire, EVENTS, $timeout, SocialItems, Util) {
            var t = this;
            t.enableSave = false;
            t.showColorModal = false;
            t.solidColor = {
                solid : {}
            }

            t.badge = {
                icon:null,
                color: {},
                title: "",
                description: "",
                expires:{
                    number: 0,
                    frame: "days",
                    isTurnedOn: false,
                },
                conditions:{
                    posts:{
                        type:"More Than",
                        value: 0,
                        isTurnedOn: false,
                    },
                    reactions:{
                        type:"More Than",
                        value: 0,
                        isTurnedOn: false,
                    },
                    reposts:{
                        type:"More Than",
                        value: 0,
                        isTurnedOn: false,
                    }
                },
            }

            $scope.checkIfEnableSave = function(){
                let b = t.badge;
                if(!b.conditions.posts.isTurnedOn && !b.conditions.reposts.isTurnedOn && !b.conditions.reactions.isTurnedOn) return t.enableSave = false;
                if(!b.icon) return t.enableSave = false;
                if(Object.keys(b.color).length == 0) return t.enableSave = false;
                if(!b.title || !b.description) return t.enableSave = false;
                if((b.expires.isTurnedOn && b.expires.number <= 0) || (typeof b.expires.number == 'undefined')) return t.enableSave = false;
                if((b.conditions.posts.isTurnedOn  && b.conditions.posts.value < 0 )|| (typeof  b.conditions.posts.value =='undefined')) return t.enableSave = false;
                if((b.conditions.reactions.isTurnedOn  && b.conditions.reactions.value < 0) || (typeof b.conditions.reactions.value == 'undefined')) return t.enableSave = false;
                if((b.conditions.reposts.isTurnedOn  && b.conditions.reposts.value < 0 )|| (typeof b.conditions.reposts.value == 'undefined')) return t.enableSave = false;
                return t.enableSave = true;
            }

            $scope.onInputChanged = function(title, value){
                console.log(t.badge);
            }


            var init = function () {
                $timeout(function(){
                    $scope.$digest();
                })
            }

            $scope.goBack = function(){
                window.location.href = "#/"
            }

            $scope.selectIcon = function(){
                Buildfire.imageLib.showDialog({multiSelection: false,showIcons: true, showFiles: false}, (err, result) => {
                    if (err) return console.error(err);
                    else{
                        if(result && result.selectedIcons && result.selectedIcons.length > 0){
                            let iconPlaceholder = document.getElementById("iconPlaceholder");
                            t.badge.icon = result.selectedIcons[0];
                            console.log(t.badge);
                            iconPlaceholder.classList.remove("nonActive");
                            iconPlaceholder.innerHTML = `<span class="${result.selectedIcons[0]}" style="font-size: 16px;text-align: center;margin-left: 3px;"></span>`
                        }
                    }
                  });
            }
            $scope.openColorPicker = function(){
                t.showColorModal = true;
                $timeout(function(){
                    $scope.$digest();
                })

            }
            $scope.closeColorPicker = function(){
                $timeout(function(){
                    t.showColorModal = false;
                    $scope.$digest();
                })
                
            }

            $scope.bfColorPicker = function(){
                const color = t.newColor || 'rgba(255, 255, 255,1)';
                const rgb = /rgba?\((\d{1,3},\s?\d{1,3},\s?\d{1,3}).*\)/;
                const match = color.match(rgb);
                const colors = (match && match[1] && match[1].split(/,\s?/)) || [255, 255, 255];
                const hexaCode = colors.reduce((current, next) => {
                const decimal = parseInt(next, 10);
                let hexa = decimal.toString(16);
                if (next < 16) {
                    hexa += hexa;
                }

                return current + hexa;
                }, '#');

                Buildfire.colorLib.showDialog(
                    {
                      colorType: 'solid',
                      solid: {
                        color: hexaCode|| null,
                        opacity: t.solidOpacity || 100,
                      },
                    },
                    {
                      hideGradient: true,
                    },
                    () => {},
                    (err, res) => {
                      if (!err) {
                        const solidColor = res.solid.color;
                        const solidOpacity = parseInt(res.solid.opacity, 10);
                        let el = document.getElementById("color-picker-bg");
                        el.classList.remove("noColor");
                        el.style.background = res.solid.color;
                        t.newColor = solidColor;
                        t.solidOpacity = solidOpacity
                        t.badge.color.solidColor = solidColor;
                        t.badge.color.solidOpacity = solidOpacity;
                        $scope.checkIfEnableSave();
                        $timeout(function(){
                            $scope.$digest();
                        })
                      }
                    },
                );
                
            }



            $scope.save = function(){
                if(!t.enableSave) return;
                SocialBadges.insert(t.badge, (err, res) =>{
                    if(err === "Badge with same name already exists"){ 
                        Buildfire.dialog.alert({
                            message: err,
                        });
                    }
                    else if(err) return console.error(err);
                    else if(res && res.id){
                        console.log(res);
                        $scope.goBack();
                    }
                })
            }

            init();
        }]);
})(window.angular);

