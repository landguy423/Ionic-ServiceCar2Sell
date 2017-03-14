// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('gowashme', ['ionic', 'ionic-modal-select', 'ionic-datepicker', 'gowashme.controllers', 'gowashme.services', 'angularMoment', 'ngStorage', 'ngCordova', 'ngSanitize', 'ngMessages', 'credit-cards', 'validation.match', 'focus-if', 'ngMask'])

.run(function($ionicPlatform, $rootScope, $localStorage, $ionicLoading, $ionicHistory, CONFIG, $timeout, $cordovaGoogleAnalytics) {
  $rootScope.trackView = function(view) {
    console.log('TrackView:', view);
    if (!CONFIG.DEBUG && window.analytics) {
      $cordovaGoogleAnalytics.trackView(view);
    }
  };
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)

    // Initialize Google Analytics
    if (!CONFIG.DEBUG && window.analytics) {
      $cordovaGoogleAnalytics.startTrackerWithId('UA-70760278-1');
      $cordovaGoogleAnalytics.debugMode();
    }

    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });

  $rootScope.hasBackView = function() {
    return !!$ionicHistory.backView();
  };
  $rootScope.$ionicLoading = $ionicLoading;
  $rootScope.showMessage = function(message, duration, delay) {
    function doShow() {
      $ionicLoading.show({
        template: '<div ng-click="hideLoading()">'+message+'</div>',
        noBackdrop: true,
        hideOnStateChange: false,
        duration: duration || 5000
      });
    }
    if (delay)
      $timeout(doShow, 0);
    else
      doShow();
  };
  $rootScope.showLoading = function() {
    $ionicLoading.show({
      template: '<ion-spinner></ion-spinner>'
    });
  };
  $rootScope.hideLoading = function() {
    $ionicLoading.hide();
  };

  $rootScope.isSalonSelected = function() {
    var ret = $rootScope.bookData && $rootScope.bookData.building && $rootScope.bookData.company && $rootScope.bookData.building.companyId == $rootScope.bookData.company.id && CONFIG.SALON_BUILDING_ID_LIST.indexOf(+$rootScope.bookData.building.id) >= 0;
    //console.log('isSalonSelected:', ret);
    return ret;
  };

  function setupDataAutoSaveFor(dataKey, defaultValue) {
    $rootScope[dataKey] = $rootScope[dataKey] || $localStorage[dataKey] || defaultValue;
    console.log('preloaded '+dataKey+':', $rootScope[dataKey]);
    $rootScope.$watch(dataKey, function(newValue, oldValue) {
      $localStorage[dataKey] = newValue;
      console.log(dataKey + ' saved:', newValue);
    }, true);
  }
  setupDataAutoSaveFor('session', null);
  setupDataAutoSaveFor('bookData', {});
  if (CONFIG.DEBUG)
    setupDataAutoSaveFor('paymentInfo', null);

  $rootScope.devicePlatform = ionic.Platform.platform();
})

.config(function($ionicConfigProvider) {
  $ionicConfigProvider.views.maxCache(0);
})

.config(function($httpProvider) {

//  $httpProvider.defaults.withCredentials = true;
  var loadingCount = 0;
  $httpProvider.interceptors.push(function($q, CONFIG, $rootScope) {
    return {
      // optional method
      'request': function(config) {
        // do something on success
        // console.log(config);
        if (config.url.slice(0, CONFIG.API_BASE_URL.length) === CONFIG.API_BASE_URL) {
          if (loadingCount == 0) {
            $rootScope.showLoading();
          }
          loadingCount++;
          //console.log(config.method, typeof config.data, config.data);
          if ((config.method == 'POST' || config.method == 'PUT') && typeof config.data == 'object') {
            // the data need be encoded
            config.headers = config.headers || {};
            config.headers['Content-Type'] = "application/x-www-form-urlencoded";
            config.data = Object.keys(config.data).map(function(key) {
              var val = config.data[key];
              if (val === undefined || val === null)
                val = '';
              return encodeURIComponent(key) + "=" + encodeURIComponent(val);
            }).join('&');
          }
          if ($rootScope.session && $rootScope.session.token && config.url.slice(CONFIG.API_BASE_URL.length) != '/login') {
            var params = {
              token: $rootScope.session.token
            }
            if (config.params) {
              delete config.params.token;
              for (var key in config.params)
                params[key] = config.params[key];
            }
            config.params = params;
          }
        }
        return config;
      },
      // optional method
      'response': function(response) {
        // do something on success
        if (response.config.url.slice(0, CONFIG.API_BASE_URL.length) === CONFIG.API_BASE_URL) {
          //console.log('response', response);
          loadingCount--;
          if (loadingCount < 0)
            loadingCount = 0;
          if (loadingCount == 0) {
            $rootScope.hideLoading();
          }
        }
        if (response.data.error === false) {
          response.data = response.data.data;
          if (response.data.results)
            response.data = response.data.results;
        }
        else if (response.data.error) {
          //  return $q.reject(response.data);
          return $q.reject((response.data.data || {}).msg || response.data.error);
        }

        return response;
      },

      // optional method
      'responseError': function(rejection) {
        // do something on error
        /*if (canRecover(rejection)) {
          return responseOrNewPromise
        }*/
        console.log('responseError', rejection);
        if (rejection.config && rejection.config.url.slice(0, CONFIG.API_BASE_URL.length) === CONFIG.API_BASE_URL) {
          loadingCount--;
          if (loadingCount < 0)
            loadingCount = 0;
          if (loadingCount == 0) {
            $rootScope.hideLoading();
          }
        }
        if ((rejection.status == 400 || rejection.status == 401) && rejection.data && typeof rejection.data == 'string') {
          $rootScope.showMessage(rejection.data.trim(), 5000);
          if (rejection.status == 401) {
            $rootScope.session = null;
            $rootScope.userInfo = null;
            // FIXME: still keep the book data?
            //$rootScope.bookData = {};
          }
        }
        else if (rejection.data && rejection.data.error) {
          var msg = rejection.data.data && rejection.data.data.msg ? rejection.data.data.msg : null;
          if (!msg && typeof rejection.data.error == 'string')
            msg = rejection.data.error;
          msg = msg || 'Gowashme server error';
          $rootScope.showMessage(msg, 5000);
        }
        else {
          $rootScope.showMessage('Failed to reach gowashme server', 5000);
        }
        return $q.reject(rejection);
      }
    };
  });

})
.config(function($ionicConfigProvider, $stateProvider, $urlRouterProvider) {
  $ionicConfigProvider.views.swipeBackEnabled(false);

  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl',
    resolve: {
      userInfo: function($rootScope, $q, User) {
        if ($rootScope.session) {
          console.log('resolve userInfo by session', $rootScope.session);
          var dfd = $q.defer();
          User.profile({}, function(user) {
            console.log('userInfo:', user);
            $rootScope.userInfo = user;
            dfd.resolve(user);
          }, function(err) {
            console.warn('get userInfo failed:', err);
            if (err.status == 400) {
            }
            $rootScope.session = null;
            $rootScope.userInfo = null;
            $rootScope.bookData = {};
            dfd.resolve(false);
          });
          return dfd.promise;
        }
        return null;
      },
      companies: function($rootScope, Companies) {
        console.log('app resolve companies');
        return Companies.query({}, function(companies) {
          $rootScope.companies = companies;
        }, function(err) {
          console.warn('get companies failed:', err);
        }).$promise;
      }
    }
  })

  /* Begin Custom Views */

  .state('app.about', {
    url: '/about',
    views: {
      'menuContent': {
        templateUrl: 'templates/about.html'
      }
    }
  })
/*
  .state('app.bring', {
    url: '/bring',
    views: {
      'menuContent': {
        templateUrl: 'templates/bring.html'
      }
    }
  })

  .state('app.contact', {
    url: '/contact',
    views: {
      'menuContent': {
        templateUrl: 'templates/contact.html'
      }
    }
  })*/

  .state('app.changePassword', {
    url: '/changePassword',
    views: {
      'menuContent': {
        controller: 'ChangePasswordCtrl',
        templateUrl: 'templates/changePassword.html'
      }
    }
  })

  .state('app.signin', {
    url: '/signin',
    params: {
      'email': null,
      'next': null
    },
    views: {
      'menuContent': {
        controller: 'SignInCtrl',
        templateUrl: 'templates/signin.html'
      }
    }
  })

  .state('app.register', {
    url: '/register',
    views: {
      'menuContent': {
        controller: 'RegisterCtrl',
        templateUrl: 'templates/register.html'
      }
    }
  })

  .state('app.forgotPassword', {
    url: '/forgotPassword',
    views: {
      'menuContent': {
        templateUrl: 'templates/forgotPassword.html'
      }
    }
  })

  .state('app.faq', {
    url: '/faq',
    views: {
      'menuContent': {
        templateUrl: 'templates/faq.html'
      }
    }
  })

  .state('app.faq-addingServices', {
    url: '/faq-addingServices',
    views: {
      'menuContent': {
        templateUrl: 'templates/faq-addingServices.html'
      }
    }
  })

  .state('app.faq-appFeedback', {
    url: '/faq-appFeedback',
    views: {
      'menuContent': {
        templateUrl: 'templates/faq-appFeedback.html'
      }
    }
  })

  .state('app.faq-bring', {
    url: '/faq-bring',
    views: {
      'menuContent': {
        templateUrl: 'templates/faq-bring.html'
      }
    }
  })

  .state('app.faq-contactUs', {
    url: '/faq-contactUs',
    views: {
      'menuContent': {
        templateUrl: 'templates/faq-contactUs.html'
      }
    }
  })

  .state('app.faq-giftCards', {
    url: '/faq-giftCards',
    views: {
      'menuContent': {
        templateUrl: 'templates/faq-giftCards.html'
      }
    }
  })

  .state('app.faq-offsite', {
    url: '/faq-offsite',
    views: {
      'menuContent': {
        templateUrl: 'templates/faq-offsite.html'
      }
    }
  })

  .state('app.faq-ParkingLocation', {
    url: '/faq-ParkingLocation',
    views: {
      'menuContent': {
        templateUrl: 'templates/faq-ParkingLocation.html'
      }
    }
  })

  .state('app.faq-rescheduleCancel', {
    url: '/faq-rescheduleCancel',
    views: {
      'menuContent': {
        templateUrl: 'templates/faq-rescheduleCancel.html'
      }
    }
  })

  .state('app.faq-troubleBooking', {
    url: '/faq-troubleBooking',
    views: {
      'menuContent': {
        templateUrl: 'templates/faq-troubleBooking.html'
      }
    }
  })

  .state('app.faq-vehicleTypes', {
    url: '/faq-vehicleTypes',
    views: {
      'menuContent': {
        templateUrl: 'templates/faq-vehicleTypes.html'
      }
    }
  })

  .state('app.faq-Weather', {
    url: '/faq-Weather',
    views: {
      'menuContent': {
        templateUrl: 'templates/faq-Weather.html'
      }
    }
  })

  .state('app.faq-whoIs', {
    url: '/faq-whoIs',
    views: {
      'menuContent': {
        templateUrl: 'templates/faq-whoIs.html'
      }
    }
  })
/*
  .state('app.feedback', {
    url: '/feedback',
    views: {
      'menuContent': {
        templateUrl: 'templates/feedback.html'
      }
    }
  })

/*
  .state('app.home', {
    url: '/home',
    views: {
      'menuContent': {
        templateUrl: 'templates/home.html'
      }
    }
  })

  .state('app.logout', {
    url: '/logout',
    views: {
      'menuContent': {
        templateUrl: 'templates/logout.html'
      }
    }
  })*/

  .state('app.book', {
    url: '/book',
    abstract: true,
    views: {
      'menuContent': {
        templateUrl: 'templates/book.html'
      }
    }
  })

  .state('app.book.location', {
    url: '/location',
    views: {
      'bookContent': {
        controller: 'SelectCompanyCtrl',
        templateUrl: 'templates/book1.html'
      }
    }
  })
/*
  .state('app.book1', {
    url: '/book-microsoft',
    views: {
      'menuContent': {
        templateUrl: 'templates/book-microsoft.html'
      }
    }
  })
*/
  .state('app.book.vehicle', {
    url: '/vehicle',
    views: {
      'bookContent': {
        controller: 'VehicleCtrl',
        templateUrl: 'templates/book2a.html'
      }
    }
  })
  .state('app.book.vehicleType', {
    url: '/vehicleType',
    views: {
      'bookContent': {
        controller: 'VehicleCtrl',
        templateUrl: 'templates/book2.html'
      }
    }
  })

  .state('app.book.service', {
    url: '/service',
    data: {
      isAddOn: false,
    },
    // FIXME: reload the care options when the type/building changed and back to this view
    resolve: {
      careOptions: function($q, $state, $rootScope, CareOptions) {
        return CareOptions.query({
          vehicleType: $rootScope.bookData.vehicleType,
          buildingId: $rootScope.bookData.building ? $rootScope.bookData.building.id : ''
        }).$promise;
      }
    },
    views: {
      'bookContent': {
        templateUrl: 'templates/book3.html',
        controller: 'SelectCareOptionCtrl'
      }
    }
  })

  .state('app.book.addon', {
    url: '/addon',
    data: {
      isAddOn: true,
    },
    // FIXME: reload the care options when the type/building changed and back to this view
    resolve: {
      careOptions: function($q, $state, $rootScope, CareOptions) {
        return CareOptions.query({
          vehicleType: $rootScope.bookData.vehicleType,
          category: 'AddOn',
          buildingId: $rootScope.bookData.building ? $rootScope.bookData.building.id : ''
        }).$promise;
      }
    },
    views: {
      'bookContent': {
        templateUrl: 'templates/book4.html',
        controller: 'SelectCareOptionCtrl'
      }
    }
  })

  .state('app.book.schedule', {
    url: '/schedule',
    views: {
      'bookContent': {
        templateUrl: 'templates/book5.html',
        controller: 'ScheduleCtrl',
      }
    }
  })
/*
  .state('app.book6', {
    url: '/book6',
    views: {
      'menuContent': {
        templateUrl: 'templates/book6.html'
      }
    }
  })
*/
  .state('app.book.key', {
    url: '/key',
    views: {
      'bookContent': {
        templateUrl: 'templates/book7.html'
      }
    }
  })

  .state('app.book.payment', {
    url: '/payment',
    views: {
      'bookContent': {
        controller: 'PaymentInfoCtrl',
        templateUrl: 'templates/book8a.html'
      }
    }
  })

  .state('app.book.paymentDetail', {
    url: '/paymentDetail/:paymentMethod',
    views: {
      'bookContent': {
        controller: 'PaymentInfoCtrl',
        templateUrl: 'templates/book8.html'
      }
    }
  })
  .state('app.book.confirm', {
    url: '/confirm',
    resolve: {
      totalPrice: function($rootScope) {
        var totalPrice = +$rootScope.bookData.careOption.price;
        $rootScope.bookData.careOptionAddOns.forEach(function(option) {
          totalPrice += +option.price;
        });
        return totalPrice;
      },
      taxInfo: function(totalPrice, $rootScope, CareOptions) {
        return CareOptions.calculateTax({
          amount: totalPrice,
          zipCode: $rootScope.paymentInfo.zipCode
        }).$promise;
      }
    },
    views: {
      'bookContent': {
        controller: 'BookConfirmCtrl',
        templateUrl: 'templates/book-confirm.html'
      }
    }
  })

  .state('app.book-complete', {
    url: '/book-complete',
    params: {
      'orderInfo': null
    },
    views: {
      'menuContent': {
        controller: 'BookCompleteCtrl',
        templateUrl: 'templates/book-complete.html'
      }
    }
  })

  .state('app.profile', {
    url: '/profile',
    views: {
      'menuContent': {
        controller: 'ProfileCtrl',
        templateUrl: 'templates/my-account.html'
      }
    }
  })

  .state('app.payment-info', {
    url: '/payment-info',
    views: {
      'menuContent': {
        controller: 'MyPaymentInfoCtrl',
        templateUrl: 'templates/payment-information.html'
      }
    }
  })

  .state('app.splash', {
    url: '/splash',
    views: {
      'menuContent': {
        templateUrl: 'templates/splash.html'
      }
    }
  })

  .state('app.home', {
    url: '/home',
    views: {
      'menuContent': {
        controller: 'HomeCtrl',
        templateUrl: 'templates/home.html'
      }
    }
  })
/*
  .state('app.social', {
    url: '/social',
    views: {
      'menuContent': {
        templateUrl: 'templates/social.html'
      }
    }
  })
  /* End Custom Views */

/*
  .state('app.search', {
    url: '/search',
    views: {
      'menuContent': {
        templateUrl: 'templates/search.html'
      }
    }
  })

  .state('app.browse', {
      url: '/browse',
      views: {
        'menuContent': {
          templateUrl: 'templates/browse.html'
        }
      }
    })
    .state('app.playlists', {
      url: '/playlists',
      views: {
        'menuContent': {
          templateUrl: 'templates/playlists.html',
          controller: 'PlaylistsCtrl'
        }
      }
    })

  .state('app.single', {
    url: '/playlists/:playlistId',
    views: {
      'menuContent': {
        templateUrl: 'templates/playlist.html',
        controller: 'PlaylistCtrl'
      }
    }
  })*/;
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
})
.run(function($rootScope, $state, $cordovaGoogleAnalytics, CONFIG) {
  $rootScope.$state = $state;
  $rootScope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
    console.log('$stateChangeStart', e, toState, toParams, fromState, fromParams);
    if (!$rootScope.session && ['app.profile', 'app.payment-info', 'app.changePassword'].indexOf(toState.name) >= 0) {
      e.preventDefault();
      $state.go('app.signin');
      return;
    }
    var states = ['app.book.vehicle', 'app.book.vehicleType', 'app.book.service', 'app.book.addon', 'app.book.schedule', 'app.book.key', 'app.book.payment', 'app.book.paymentDetail', 'app.book.confirm'];
    var stateIdx = states.indexOf(toState.name);
    if (stateIdx >= 0) {
      if (!$rootScope.bookData || !$rootScope.bookData.company || $rootScope.bookData.company.numBuildings > 0 && (!$rootScope.bookData.building || $rootScope.bookData.building.companyId != $rootScope.bookData.company.id)) {
        e.preventDefault();
        $state.go('app.book.location');
        return;
      }
      if (stateIdx > states.indexOf('app.book.vehicle') && (!$rootScope.bookData.vMake || !$rootScope.bookData.vModel || !$rootScope.bookData.vYear)) {
        e.preventDefault();
        $state.go('app.book.vehicle');
        return;
      }
      if (stateIdx > states.indexOf('app.book.vehicleType') && !$rootScope.bookData.vehicleType) {
        e.preventDefault();
        $state.go('app.book.vehicleType');
        return;
      }
      if (stateIdx > states.indexOf('app.book.service') && (!$rootScope.bookData.careOption || $rootScope.bookData.careOption.vehicleType != $rootScope.bookData.vehicleType)) {
        e.preventDefault();
        $state.go('app.book.service');
        return;
      }
      if (stateIdx > states.indexOf('app.book.addon') && (!Array.isArray($rootScope.bookData.careOptionAddOns) || $rootScope.bookData.careOptionAddOns.filter(function(option) {
        return option.vehicleType != $rootScope.bookData.vehicleType;
      }).length > 0)) {
        e.preventDefault();
        $state.go('app.book.addon');
        return;
      }
      if (stateIdx > states.indexOf('app.book.schedule') && (!$rootScope.bookData.scheduleDate || !$rootScope.bookData.scheduleTime || !$rootScope.bookData.scheduleTimestamp || Date.now() - $rootScope.bookData.scheduleTimestamp > 900000)) {
        e.preventDefault();
        $state.go('app.book.schedule');
        return;
      }
      if (toState.name == 'app.book.key' && $rootScope.isSalonSelected()) {
        e.preventDefault();
        $state.go('app.book.payment');
        return;
      }
      if (stateIdx > states.indexOf('app.book.key') && !$rootScope.isSalonSelected() && (!$rootScope.bookData.callOnArrival && !$root.bookData.whereKeyLeft)) {
        e.preventDefault();
        $state.go('app.book.key');
        return;
      }
      /*if (toState.name == 'app.book.payment' && !$rootScope.isSalonSelected()) {
        e.preventDefault();
        //$rootScope.paymentInfo.paymentMethod = 'card';
        $state.go('app.book.paymentDetail');
        return;
      }*/
      if (stateIdx > states.indexOf('app.book.payment') && /*$rootScope.isSalonSelected() &&*/ (!$rootScope.paymentInfo || !$rootScope.paymentInfo.paymentMethod)) {
        e.preventDefault();
        $state.go('app.book.payment');
        return;
      }
      if (stateIdx > states.indexOf('app.book.paymentDetail') && (!$rootScope.paymentInfo || !$rootScope.paymentInfo.paymentMethod || $rootScope.paymentInfo.paymentMethod == 'salon' && !$rootScope.isSalonSelected() || !$rootScope.paymentInfo.mobile || $rootScope.paymentInfo.paymentMethod == 'card' && !$rootScope.paymentInfo.ccNumber && (!$rootScope.userInfo || !$rootScope.userInfo.ccNumber))) {
        e.preventDefault();
        $state.go('app.book.paymentDetail');
        return;
      }
    }
  });
});
