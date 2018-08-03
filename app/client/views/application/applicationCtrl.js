angular.module('reg')
  .controller('ApplicationCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    '$http',
    'currentUser',
    'settings',
    'Session',
    'UserService',
    function($scope, $rootScope, $state, $http, currentUser, Settings, Session, UserService){

      // Set up the user
      $scope.user = currentUser.data;

      // Is the student from MIT?
      $scope.isMitStudent = $scope.user.email.split('@')[1] == 'mit.edu';

      // If so, default them to adult: true
      if ($scope.isMitStudent){
        $scope.user.profile.adult = true;
      }

      // server-side checked secrets validity
      // keys are secret indices
      // true = valid, undefined = fild empty, false = invalid
      $scope.secretsValidity = {};

      $scope.checkSecret = function(index) {
        // initial check, doesn't seem to be possible in controller
        // so we just check on change now; left here for future?
        // let secretQsLen = document.querySelectorAll("[id^=secret-index-]").length;
        // console.log(secretQsLen);

        if ($scope.user.profile.secretQuestions[index].length == 0) {
          $scope.secretsValidity[index] = undefined;
          return;
        }
        UserService.checkSecretAnswerRemotely(index, $scope.user.profile.secretQuestions[index]).then(function(res) {
          $scope.secretsValidity[index] = res.data.correct;
        });
        // return $scope.secretsValidity[index];
      }

      // Populate the school dropdown
      populateSchools();
      _setupForm();

      $scope.regIsClosed = Date.now() > Settings.data.timeClose;

      /**
       * TODO: JANK WARNING
       */
      function populateSchools(){
        $http
          .get('/assets/schools.json')
          .then(function(res){
            var schools = res.data;
            var email = $scope.user.email.split('@')[1];

            if (schools[email]){
              $scope.user.profile.school = schools[email].school;
              $scope.autoFilledSchool = true;
            }
          });

        $http
          .get('/assets/schools.csv')
          .then(function(res){ 
            $scope.schools = res.data.split('\n');
            $scope.schools.push('Other');

            var content = [];

            for(i = 0; i < $scope.schools.length; i++) {                                          
              $scope.schools[i] = $scope.schools[i].trim(); 
              content.push({title: $scope.schools[i]})
            }

            $('#school.ui.search')
              .search({
                source: content,
                cache: true,     
                onSelect: function(result, response) {                                    
                  $scope.user.profile.school = result.title.trim();
                }        
              })             
          });          
      }

      function _updateUser(e){
        UserService
          .updateProfile(Session.getUserId(), $scope.user.profile)
          .success(function(data){
            sweetAlert({
              title: "Awesome!",
              text: "Your application has been saved.",
              type: "success",
              confirmButtonColor: "#35e2df"
            }, function(){
              $state.go('app.dashboard');
            });
          })
          .error(function(res){
            sweetAlert("Uh oh!", "Something went wrong.", "error");
          });
      }

      function isMinor() {
        return !$scope.user.profile.adult;
      }

      function minorsAreAllowed() {
        return Settings.data.allowMinors;
      }

      function minorsValidation() {
        // Are minors allowed to register?
        if (isMinor() && !minorsAreAllowed()) {
          return false;
        }
        return true;
      }

      function _setupForm(){
        // Custom minors validation rule
        $.fn.form.settings.rules.allowMinors = function (value) {
          return minorsValidation();
        };

        $.fn.form.settings.rules.radioSelected = function(value, name) {
          return !!($("input[name=" + name + "]").filter(":checked").val());
        };

        // Semantic-UI form validation
        $('.ui.form').form({
          inline: true,
          fields: {
            name: {
              identifier: 'name',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your name.'
                }
              ]
            },
            age: {
              identifier: 'age',
              rules: [
                {
                  type: 'integer[0..199]',
                  prompt: 'Please enter your age.'
                }
              ]
            },
            country: {
              identifier: 'country',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your country.'
                }
              ]
            },
            statusStudiesHidden: {
              identifier: 'statusStudiesHidden',
              rules: [
                {
                  type: 'radioSelected[statusStudies]',
                  prompt: 'Please select your studies.'
                }
              ]
            },
            statusWorkHidden: {
              identifier: 'statusWorkHidden',
              rules: [
                {
                  type: 'radioSelected[statusWork]',
                  prompt: 'Please select your work status.'
                }
              ]
            },
            eduInstitution: {
              identifier: 'eduInstitution',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter educational institution.'
                }
              ]
            },
            school: {
              identifier: 'school',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your school name.'
                }
              ]
            },
            year: {
              identifier: 'year',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select your graduation year.'
                }
              ]
            },
            genderOption: {
              identifier: 'genderValidationHidden',
              rules: [
                {
                  type: 'radioSelected[genderOption]',
                  prompt: 'Please enter your gender.'
                }
              ]
            },
            interestedJob: {
              identifier: 'interestedJobHidden',
              rules: [
                {
                  type: 'radioSelected[interestedJob]',
                  prompt: 'Please select whether you are interested in job opportunities.'
                }
              ]
            },
            mlhAgree: {
              identifier: 'mlhAgree',
              rules: [
                {
                  type: 'checked',
                  prompt: 'You must accept the Terms and Conditions.'
                }
              ]
            },
            junctionAgree: {
              identifier: 'junctionAgree',
              rules: [
                {
                  type: 'checked',
                  prompt: 'You must accept the Terms and Conditions..'
                }
              ]
            },
            technology: {
              identifier: 'technology',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter technology you used.'
                }
              ]
            },
            profExperienceCount: {
              identifier: 'profExperienceCount',
              rules: [
                {
                  type: 'integer[0..99]',
                  prompt: 'Please enter a number.'
                }
              ]
            },
            projects: {
              identifier: 'projects',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please write or link details about your previous projects.'
                }
              ]
            },
            participationCount: {
              identifier: 'participationCount',
              rules: [
                {
                  type: 'integer[0..99]',
                  prompt: 'Please enter a number.'
                }
              ]
            },
            adult: {
              identifier: 'adult',
              rules: [
                {
                  type: 'allowMinors',
                  prompt: 'You must be an adult, or an MIT student.'
                }
              ]
            }
          }
        });
      }



      $scope.submitForm = function(){
        if ($('.ui.form').form('is valid')){
          _updateUser();
        }
        else{
          sweetAlert("Uh oh!", "Please fill the required fields", "error");
        }
      };

    }]);
