angular.module('gowashme.services', ['ngResource'])
  .constant("CONFIG", {
    API_BASE_URL: "https://gowash.me/api",
    IMG_BASE_URL: "https://gowash.me/webmaster/uploaded_img/",
    LOGO_BASE_URL: "https://gowash.me/companylogo/",
    SALON_BUILDING_ID_LIST: [1],
    DEBUG: false
  })
  .factory('User', function($resource, CONFIG) {
    return $resource(CONFIG.API_BASE_URL + '/profile', {}, {
      signIn: {
        url: CONFIG.API_BASE_URL + '/login',
        method: 'POST'
      },
      signOut: {
        url: CONFIG.API_BASE_URL + '/logout',
      },
      register: {
        url: CONFIG.API_BASE_URL + '/register',
        method: 'POST'
      },
      resetPassword: {
        url: CONFIG.API_BASE_URL + '/password_reset',
        method: 'POST'
      },
      profile: {
        params: {
          extended: 'true'
        }
      },
      updateProfile: {
        method: 'PUT'
      },
      checkEmail: {
        url: CONFIG.API_BASE_URL + '/check_email',
        method: 'POST'
      }
    });
  })
  .factory('Companies', function($resource, CONFIG) {
    return $resource(CONFIG.API_BASE_URL + '/companies', {}, {
      buildings: {
        url: CONFIG.API_BASE_URL + '/companies/:id/buildings',
        method: 'GET',
        isArray: true
      }
    });
  })
  .factory('CareOptions', function($resource, CONFIG) {
    return $resource(CONFIG.API_BASE_URL + '/care_options', {}, {
      calculateTax: {
        url: CONFIG.API_BASE_URL + '/tax_calc'
      }
    });
  })
  .factory('Schedule', function($resource, CONFIG) {
    return $resource(CONFIG.API_BASE_URL + '/schedule', {}, {
      query: {
        method: 'GET',
        isArray: false
      }
    });
  })
  .factory('Book', function($resource, CONFIG) {
    return $resource(CONFIG.API_BASE_URL + '/make_order', {}, {
      makeOrder: {
        method: 'POST'
      },
      makeOrderAsGuest: {
        url: CONFIG.API_BASE_URL + '/make_order_as_guest',
        method: 'POST'
      }
    });
  })
  .directive('externalLink', function(){
    'use strict';
    return {
      restrict: 'A',
      scope: {
        url: '@href'
        },
        link: function(scope, element, attrs){
          element.bind('click', function(e){
            e.preventDefault();
            window.open(encodeURI(scope.url), '_system', 'location=yes');
          }
        )
      }
    };
  });