angular.module('reg')
  .controller('LoginCtrl', [
    '$scope',
    '$http',
    '$state',
    '$window',
    'settings',
    'Session',
    'Utils',
    'AuthService',
    function($scope, $http, $state, $window, settings, Session, Utils, AuthService){

      // Is registration open?
      var Settings = settings.data;
      $scope.regIsOpen = Utils.isRegOpen(Settings);

      // Start state for login
      $scope.loginState = 'login';

      function onSuccess() {
        $state.go('app.dashboard');
      }

      function onError(data){
        $scope.error = data.message;
      }

      function resetError(){
        $scope.error = null;
      }

      $scope.login = function(){
        resetError();
        AuthService.loginWithPassword(
          $scope.email, $scope.password, onSuccess, onError);
      };

      $scope.register = function(){
        resetError();
        AuthService.register(
          $scope.email, $scope.password, onSuccess, onError);
      };

      $scope.setLoginState = function(state) {
        $scope.loginState = state;
      };

      $scope.sendResetEmail = function() {
        var email = $scope.email;
        AuthService.sendResetEmail(email);
        sweetAlert({
          title: "Don't Sweat!",
          text: "An email should be sent to you shortly.",
          type: "success",
          confirmButtonColor: "#35e2df"
        });
      };

      $scope.$on('$viewContentLoaded', function () {
        // Re-add goodid script if already exists
        if (document.getElementById('goodid-sdk')) {
          (function(x){x.parentNode.removeChild(x);})(document.getElementById('goodid-sdk'));
        }

        (function(d, t, i) {
          var s, b;
          if (d.getElementById(i)) { return; }
          s = d.createElement(t); s.id = i;
          s.src = '//connect.goodid.net/v1.0/connect.min.js';
          b = d.getElementsByTagName(t)[0]; b.parentNode.insertBefore(s, b);
        })(document, 'script', 'goodid-sdk');
      });

    }
  ]);
