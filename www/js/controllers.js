angular.module('gowashme.controllers', [])

.directive('select', function() {
  return {
    restrict: 'E',
    link: function(scope, element, attrs) {
      element.bind('focus', function(e) {
        if (window.cordova && window.cordova.plugins.Keyboard) {
          // console.log("show bar (hide = false)");
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
        }
      });
      element.bind('blur', function(e) {
        if (window.cordova && window.cordova.plugins.Keyboard) {
          // console.log("hide bar (hide = true)");
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
      });
    }
  };
})

.controller('AppCtrl', function($scope, $rootScope, $ionicHistory, userInfo, $state, $ionicModal, $ionicPopover, $ionicPopup, $ionicLoading, $timeout, User, companies, CONFIG) {
  console.log('init AppCtrl', $rootScope.session, userInfo);

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $rootScope.signInData = {
    rememberMe: true
  };
/*
  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $ionicModal.fromTemplateUrl('templates/faq.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal2 = modal;
  });*/
/*
  $rootScope.showMessage = function(message, duration) {
    $ionicLoading.show({
      template: '<div ng-click="$root.$ionicLoading.hide()">'+message+'</div>',
      noBackdrop: true,
      hideOnStateChange: true,
      duration: duration || 5000
    });
  }*/
/*
  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  $scope.faq = function() {
    $scope.modal2.show();
  };*/
/*
  var onSignedIn = function(ret) {
    $rootScope.session = ret;
    User.profile({}, function(user) {
      console.log('profile:', user);
      $rootScope.userInfo = user;
      $state.go('app.book.location', {}, {reload: true});
    }, function(err) {
      console.warn('get profile failed:', err);
    });
  }*/
  $rootScope.updateUserInfo = function(cb) {
    User.profile({}, function(user) {
      console.log('got userInfo:', user);
      $rootScope.userInfo = user;
      if (cb)
        cb();
    }, function(err) {
      console.warn('get userInfo failed:', err);
    });
  }

  $scope.resetPassword = function(form) {
    if (form.$valid) {
      console.log('reset password ...');

      User.resetPassword({}, $rootScope.signInData, function(ret) {
        console.log('reset password ret:', ret);

        $ionicPopup.alert({
          title: '',
          template: 'An email has been sent with instructions on how to reset your password.'
        }).then(function(res) {
          $state.go('app.signin', {}, {reload: true});
        });
      }, function(err) {
        console.warn('reset password failed:', err);
      });
    }
  };
  $scope.signOut = function() {
    User.signOut({}, function(ret) {
      console.log('sign out ret:', ret);
      $rootScope.session = null;
      $state.go('app.splash');
    }, function(err) {
      console.warn('sign out failed:', err);
      $rootScope.session = null;
      $state.go('app.splash');
    });
    $rootScope.userInfo = null;
    $rootScope.bookData = {};
  }

  $scope.Range = function(start, end, step) {
    var result = [];
    if (end === undefined) {
      end = start;
      start = 0;
    }
    step = step || 1;
    for (var i = start; i < end; i+=step) {
      result.push(i);
    }
    return result;
  };

  /*
  $scope.tooltip = {};
  $ionicPopover.fromTemplateUrl('tooltip.html', {
    scope: $scope
  }).then(function(popover) {
    $scope.popover = popover;
  });
  $scope.showToolTip = function($event, content, title) {
    console.log($event);
    $event.preventDefault();
    $scope.tooltip.content = content;
    $scope.tooltip.title = title;
    $scope.popover.show($event);
  };
  $scope.hideToolTip = function() {
    $scope.popover.hide();
  };
  //Cleanup the popover when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.popover.remove();
  });
  // Execute action on hide popover
  $scope.$on('popover.hidden', function() {
    // Execute action
    console.log('tooltip hidden');
  });
  // Execute action on remove popover
  $scope.$on('popover.removed', function() {
    // Execute action
    console.log('tooltip removed');
  });*/
  if (userInfo === false) {
    // session invalid condition
    $state.go('app.splash');
  }
})

.controller('HomeCtrl', function($rootScope, $state, $ionicHistory, $cordovaGoogleAnalytics, CONFIG) {
  $rootScope.trackView('Home Screen');

  console.log('HomeCtrl init');
  $ionicHistory.nextViewOptions({
    disableAnimate: true,
    disableBack: true
  });
  if ($rootScope.session)
    $state.go('app.book.location');
  else
    $state.go('app.splash');
})

.controller('SignInCtrl', function($scope, $rootScope, $state, User, $stateParams, $ionicHistory, $cordovaGoogleAnalytics, CONFIG) {
  console.log('SignInCtrl init:', $stateParams);
  $rootScope.trackView('SignIn Screen');
  $rootScope.signInData.email = $stateParams.email || $rootScope.signInData.email;
  $rootScope.signInData.password = '';

  // Perform the login action when the user submits the login form
  $scope.signIn = function(form) {
    if (form.$valid) {
      console.log('sign in ...');

      User.signIn({}, $rootScope.signInData, function(ret) {
        console.log('sign in ret:', ret);
        $rootScope.showMessage('Welcome back', 2000);
        $rootScope.session = ret;
        if ($stateParams.email != $rootScope.signInData.email)
          $rootScope.paymentInfo = null;
        $rootScope.updateUserInfo(function() {
          var nextState = $stateParams.next || 'app.book.location';
          if (nextState == 'back' && $ionicHistory.backView()) {
            $ionicHistory.goBack();
          }
          else {
            $ionicHistory.nextViewOptions({
              disableAnimate: true,
              disableBack: true
            });
            $state.go(nextState, {}, {reload: true});
          }
        });
      }, function(err) {
        console.warn('sign in failed:', err);
      });
    }
  };
})

.controller('RegisterCtrl', function($scope, $rootScope, User, $ionicHistory, $state, CONFIG, $cordovaGoogleAnalytics) {

  $rootScope.trackView('Register Screen');

  $scope.userInfo = {};
  if ($rootScope.bookData.company) {
    $scope.userInfo.companyId = $rootScope.bookData.company.id;
  }

  $scope.register = function(form) {
    if (form.$valid) {
      console.log('register account ...', $scope.userInfo);
      User.register({}, $scope.userInfo, function(ret) {
        console.log('register account ret:', ret);
        $rootScope.showMessage('Welcome', 2000);
        //$rootScope.userInfo = angular.copy($scope.userInfo);
        $rootScope.session = ret;
        $rootScope.updateUserInfo(function() {
          $ionicHistory.nextViewOptions({
            disableAnimate: true,
            disableBack: true
          });
          $state.go('app.book.location', {}, {reload: true});
        });
      }, function(err) {
        console.warn('register account failed:', err);
      });
    }
  }
})

.controller('ProfileCtrl', function($scope, $rootScope, User, CONFIG, $cordovaGoogleAnalytics) {

  $rootScope.trackView('Profile Screen');

  $scope.userInfo = angular.copy($rootScope.userInfo);
  $scope.updateProfile = function(form) {
    if (form.$valid) {
      console.log('update profile ...', $scope.userInfo);
      User.updateProfile({}, $scope.userInfo, function(ret) {
        console.log('update profile ret:', ret);
        $rootScope.showMessage('Profile updated', 2000);
        $rootScope.userInfo = angular.copy($scope.userInfo);
      }, function(err) {
        console.warn('update profile failed:', err);
      });
    }
  }
})

.controller('ChangePasswordCtrl', function($scope, $rootScope, User, $ionicHistory, $state, CONFIG, $cordovaGoogleAnalytics) {

  $rootScope.trackView('Change Password Screen');

  $scope.userInfo = {};

  $scope.updatePassword = function(form) {
    if (form.$valid) {
      console.log('change password ...', $scope.userInfo);
      User.updateProfile({}, {
        password: $scope.userInfo.password
      }, function(ret) {
        console.log('change password ret:', ret);
        $rootScope.showMessage('Password updated', 2000);
        if ($ionicHistory.backView())
          $ionicHistory.goBack();
        else
          $state.go('app.profile');
      }, function(err) {
        console.warn('change password failed:', err);
      });
    }
  }
})

.controller('SelectCompanyCtrl', function($scope, $rootScope, Companies, CONFIG, $cordovaGoogleAnalytics) {

  $rootScope.trackView('Select Company Screen');

  console.log('init company ctrl');
  var companies = $scope.companies = $rootScope.companies;
  $scope.companyWithBuildings = {};
  var companyId = $rootScope.bookData.company ? $rootScope.bookData.company.id : null;
  if ($rootScope.userInfo)
    companyId = companyId || $rootScope.userInfo.companyId;
  companies.forEach(function(company) {
    if (company.numBuildings > 0)
      $scope.companyWithBuildings[company.id] = true;
    if (companyId && companyId == company.id)
      $rootScope.bookData.company = company;
    company.logoFullUrl = CONFIG.LOGO_BASE_URL + company.logo;
  });
  var companyBuildingMap = {};
  $scope.companyBuildings = function(companyId) {
    if (!companyBuildingMap[companyId]) {
      companyBuildingMap[companyId] = Companies.buildings({id: companyId}, function(buildings) {
        buildings.forEach(function(building) {
          building.companyId = companyId;
        });
        buildings.sort(function(a, b) {
          if (CONFIG.SALON_BUILDING_ID_LIST.indexOf(+a.id) >= 0) {
            if (CONFIG.SALON_BUILDING_ID_LIST.indexOf(+b.id) >= 0) {
              return (+a.id) - (+b.id);
            }
            return -1;
          }
          if (CONFIG.SALON_BUILDING_ID_LIST.indexOf(+b.id) >= 0) {
            return 1;
          }

          return String.naturalCaseCompare(a.name, b.name);
        });
        companyBuildingMap[companyId] = buildings;
      });
    }
    return companyBuildingMap[companyId];
  };
  /*$scope.$on('$ionicView.enter', function(){
    console.log('location view $ionicView.enter');
  });
  $scope.$on('$ionicView.leave', function(){
    console.log('location view $ionicView.leave');
  });
  $scope.$on('$ionicNavView.enter', function(){
    console.log('location view $ionicNavView.enter');
  });
  $scope.$on('$ionicNavView.leave', function(){
    console.log('location view $ionicNavView.leave');
  });*/
})

.controller('VehicleCtrl', function($scope, $state, $rootScope, CONFIG, $cordovaGoogleAnalytics, User) {
  console.log('VehicleCtrl init', $state.name);

  if ($state.name == 'app.book.vehicleType')
    $rootScope.trackView('Vehicle Type Screen');
  else
    $rootScope.trackView('Vehicle Info Screen');

  VehicleMakes.sort(function (a, b) {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
  $scope.makes = VehicleMakes;

  // XXX: we store vehicle in user profile indeed
  //      but for guest mode, we indeed store vehicle in local storage?
  //      in either case, we only remember one vehicle, override the previous
  //      used one always. just store to profile or local storage.
  $scope.data = {};
  var vMake = $rootScope.bookData.vMake;
  var vModel = $rootScope.bookData.vModel;
  var vYear = $rootScope.bookData.vYear;
  if ($rootScope.userInfo) {
    vMake = vMake || $rootScope.userInfo.vMake;
    vModel = vModel || $rootScope.userInfo.vModel;
    vYear = vYear || $rootScope.userInfo.vYear;
  }
  console.log(vMake, vModel, vYear);
  $scope.data.vMake = VehicleMakes.filter(function(make) {
    return make.name == vMake;
  })[0];
  if ($scope.data.vMake) {
    $scope.data.vModel = $scope.data.vMake.models.filter(function(model) {
      return model.name == vModel;
    })[0];
    if ($scope.data.vModel) {
      $scope.data.vYear = $scope.data.vModel.years.filter(function(year) {
        return year.year == vYear;
      })[0];
    }
  }
  console.log($scope.data);
  $scope.onNext = function() {
    $rootScope.bookData.vMake = $scope.data.vMake.name;
    $rootScope.bookData.vModel = $scope.data.vModel.name;
    $rootScope.bookData.vYear = $scope.data.vYear.year;
    if ($rootScope.userInfo) {
      var userVInfoUpdated = false;
      var vInfo = {};
      ['vMake', 'vModel', 'vYear'].forEach(function(field) {
        if ($rootScope.userInfo[field] != $scope.bookData[field]) {
          vInfo[field] = $scope.bookData[field];
          userVInfoUpdated = true;
        }
      });
      if (userVInfoUpdated) {
        User.updateProfile({}, vInfo, function(ret) {
          console.log('update profile ret:', ret);
          for (field in vInfo) {
            // update local userinfo vinfo anyway.
            $rootScope.userInfo[field] = vInfo[field];
          }
          $state.go('app.book.vehicleType');
        }, function(err) {
          console.warn('update profile failed:', err);
          $state.go('app.book.vehicleType');
        });
        return;
      }
    }
    $state.go('app.book.vehicleType');
  }
})

.controller('SelectCareOptionCtrl', function($scope, $state, $rootScope, careOptions, CONFIG, $cordovaGoogleAnalytics) {

  $rootScope.trackView('Select Company Screen');

  console.log($state.current);
  var isAddOn = $state.current.data.isAddOn;
  console.log('careOptions:', isAddOn, careOptions);
  for (var i = 0; i < careOptions.length; i++) {
    console.log(CONFIG.IMG_BASE_URL + careOptions[i].img);
  }
  var careOptionAddOnsIds = [];
  if ($rootScope.bookData.careOptionAddOns) {
    careOptionAddOnsIds = $rootScope.bookData.careOptionAddOns.map(function(option) {
      return option.id;
    });
  }
  careOptions.forEach(function(option) {
    option.imgFullUrl = CONFIG.IMG_BASE_URL + option.img;
    //option.description = option.description.replace(/\n/g, ' ').replace(/<br\/?>/g, "\n");
    if (isAddOn)
      option.selected = careOptionAddOnsIds.indexOf(option.id) >= 0;
  });
  $scope.careOptions = careOptions;
  $scope.onNext = function() {
    $rootScope.bookData.careOptionAddOns = $scope.careOptions.filter(function(option) {
      return !!option.selected;
    });
    console.log('addons:', $rootScope.bookData.careOptionAddOns);
    $state.go('app.book.schedule');
  }
})

.controller('ScheduleCtrl', function($scope, $rootScope, $state, Schedule, $ionicModal, CONFIG, $cordovaGoogleAnalytics) {
  console.log('ScheduleCtrl init');

  $rootScope.trackView('Schedule Screen');

  function today(addDays) {
    addDays = addDays || 0;
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()+addDays);
  }
  $scope.todayStr = todayStr = function(addDays) {
    return moment().add(addDays || 0, 'day').format('YYYY-MM-DD');
  }
  var getTimeRange = $scope.getTimeRange = function(time) {
    if (!time)
      return undefined;
    var m = moment(time, 'H:mm:ss');
    return m.format('H:mm') + ' - ' + m.add(1, 'hour').format('H:mm');
  };
  var dateTimeBlocks = {};
  var getTimeBlocks = $scope.getTimeBlocks = function(date, refresh) {
    date = date || $scope.scheduleDate;
    if (!date)
      return undefined;
    if (date.getTime)
      date = moment(date).format('YYYY-MM-DD');
    var timeBlocks = dateTimeBlocks[date];
    console.log(timeBlocks);
    if (!refresh) {
      if (timeBlocks !== undefined) {
        if (date == $scope.scheduleDate) {
          $scope.timeBlocks = timeBlocks;
          $scope.timeBlocksDate = $scope.scheduleDate;
        }
        var tomorrow = todayStr(1);
        var now = moment();
        if (date <= tomorrow) {
          // only allow schedule after 24 hours
          timeBlocks.forEach(function(timeBlock) {
            if (date < tomorrow || date == tomorrow && moment(timeBlock.time, 'H:mm:ss') <= now)
              timeBlock.status = 'Full';
          });
        }
        return timeBlocks;
      }
      dateTimeBlocks[date] = false;
    }
    Schedule.query({
      companyId: $rootScope.bookData.company.id,
      buildingId: $rootScope.bookData.building ? $rootScope.bookData.building.id : '',
      startDate: date,
      endDate: date
    }, function(ret) {
      console.log(ret);
      var tomorrow = todayStr(1);
      var now = moment();
      var o = ret[date];
      timeBlocks = dateTimeBlocks[date] = o ? Object.keys(o).map(function(time) {
        return {
          time: time,
          date: date,
          timeRange: getTimeRange(time),
          // only allow schedule after 24 hours
          status: date < tomorrow || date == tomorrow && moment(time, 'H:mm:ss') <= now ? 'Full' : o[time]
        }
      }) : undefined;
      if (date == $scope.scheduleDate) {
        $scope.timeBlocks = timeBlocks;
        $scope.timeBlocksDate = $scope.scheduleDate;

        if ($scope.scheduleDate == $rootScope.bookData.scheduleDate && $rootScope.bookData.scheduleTime && (!$scope.scheduleTime || $scope.scheduleTime.date != date)) {
          var timeBlock = timeBlocks.filter(function(timeBlock) {
            return timeBlock.time == $rootScope.bookData.scheduleTime && timeBlock.status == 'Open';
          })[0];
          if (timeBlock)
            $scope.scheduleTime = timeBlock;
        }
      }
      console.log(timeBlocks);
    }, function(err) {
      console.warn(err);
    });
  };
  /*var getTimeBlock = function(date, time) {
    var timeBlocks = getTimeBlocks(date);
    if (timeBlocks) {
      var timeBlock = timeBlocks.filter(function(timeBlock) {
        return timeBlock.time == time;
      })[0];
      return timeBlock;
    }
    return null;
  }*/
  function onDateSelected(date) {
    if (date != $scope.scheduleDate) {
      $scope.scheduleDate = date;
      $scope.timeBlocks = null;
      $scope.getTimeBlocks($scope.scheduleDate, true);
      $scope.scheduleTime = null;
      if ($scope.datepickerObject)
        $scope.datepickerObject.inputDate = $scope.scheduleDate ? moment($scope.scheduleDate).toDate() : today(1);
    }
  }
  $scope.adjustDate = function(dateDiff) {
    if (!$scope.scheduleDate)
      return;
    var newDate = moment($scope.scheduleDate).add(dateDiff, 'day').format('YYYY-MM-DD');
    if (newDate <= todayStr())
      return;
    onDateSelected(newDate);
  };
  if ($rootScope.bookData.scheduleDate && $rootScope.bookData.scheduleDate > todayStr()) {
    onDateSelected($rootScope.bookData.scheduleDate);
    // TODO: set the selected date
    if ($rootScope.bookData.scheduleTime) {
      // if we already retrieved the time block (cached condition)
      // else we need check that when time blocks retrieved.
      /*var timeBlock = getTimeBlock($rootScope.bookData.scheduleDate, $rootScope.bookData.scheduleTime);
      if (timeBlock)
        $scope.scheduleTime = timeBlock;*/
    }
  }
  $scope.datepickerObject = {
/*    titleLabel: 'Title',  //Optional*/
    todayLabel: ' ',  //Optional
    //closeLabel: 'Cancel',  //Optional*/
    //setLabel: 'Select',  //Optional
    /*setButtonType : 'button-assertive',  //Optional
    todayButtonType : 'button-assertive',  //Optional
    closeButtonType : 'button-assertive',  //Optional*/
    inputDate: $scope.scheduleDate ? moment($scope.scheduleDate).toDate() : today(1),  //Optional
    /*mondayFirst: true,  //Optional*/
    //disabledDates: [today()], //Optional
    /*weekDaysList: weekDaysList, //Optional
    monthList: monthList, //Optional*/
    templateType: 'modal', //Optional
    showTodayButton: false, //Optional
    /*modalHeaderColor: 'bar-positive', //Optional
    modalFooterColor: 'bar-positive', //Optional*/
    from: today(1), // from tomorrow
    //to: new Date(2018, 8, 25),  //Optional
    callback: function (val) {  //Mandatory
      console.log('date picker ret:', val);
      if (val) {
        var date = moment(val).format('YYYY-MM-DD');
        onDateSelected(date);
        if ($scope.modal && !$scope.modal.isShown())
          $scope.modal.show();
      }
    },
    dateFormat: 'MM-dd-yyyy', //Optional
    closeOnSelect: false //Optional
  };

  $scope.onTimeBlockChanged = function(timeBlock) {
    console.log('onTimeBlockChanged:', timeBlock);
    $scope.scheduleTime = timeBlock;
    $scope.modal.hide();
  };
  $scope.onTimeBlockClicked = function(timeBlock) {
    //console.log('onTimeBlockClicked:', timeBlock);
    $scope.modal.hide();
  };
  $ionicModal.fromTemplateUrl('templates/select-time-block.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.selectTimeBlock = function() {
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    // Execute action
    console.log('time block modal hide');
  });
  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
    console.log('time block modal removed');
  });
  /*if (!$scope.scheduleDate) {
    onDateSelected(todayStr(1));
  }*/

  $scope.onNext = function() {
    $rootScope.bookData.scheduleDate = $scope.scheduleDate;
    $rootScope.bookData.scheduleTime = $scope.scheduleTime.time;
    $rootScope.bookData.scheduleDateTime = moment($scope.scheduleDate + ' ' + $scope.scheduleTime.time, 'YYYY-MM-DD H:mm:ss').format();
    $rootScope.bookData.scheduleTimestamp = Date.now();
    if ($rootScope.isSalonSelected()) {
      // salon no need the key left view
      $state.go('app.book.payment');
    }
    else {
      $state.go('app.book.key');
    }
  };
})

.controller('PaymentInfoCtrl', function($scope, $state, $stateParams, $rootScope, User, $timeout, CONFIG, $cordovaGoogleAnalytics) {
  console.log('PaymentInfoCtrl init', $state.name, $stateParams, $rootScope.paymentInfo);

  $scope.paymentInfo = angular.copy($rootScope.paymentInfo || {});

  if ($state.name == 'app.book.paymentDetail') {
    if (!$scope.paymentInfo.paymentMethod || $scope.paymentInfo.paymentMethod != $stateParams.paymentMethod || $scope.paymentInfo.paymentMethod === 'salon' && !$rootScope.isSalonSelected()) {
      $state.go('app.book.payment');
      return;
    }
  }

  if ($state.name == 'app.book.paymentDetail') {
    if ($scope.paymentInfo.paymentMethod == 'salon') {
      $rootScope.trackView('Contact Info Screen');
    }
    else if ($scope.paymentInfo.paymentMethod == 'membership') {
      $rootScope.trackView('Membership Info Screen');
    }
    else {
      $rootScope.trackView('Payment Info Screen');
    }
  }
  else
    $rootScope.trackView('Payment Method Screen');

  /*$scope.viewLoaded = false;
  $timeout(function() {
    $scope.viewLoaded = true;
  }, 2000);*/
  $scope.setPaymentMethod = function(method) {
    $rootScope.paymentInfo = $rootScope.paymentInfo || {};
    $rootScope.paymentInfo.paymentMethod = method;
    $state.go('app.book.paymentDetail', {
      paymentMethod: method
    });
  };
  $scope.currentYear = new Date().getFullYear();
  $scope.currentMonth = new Date().getMonth()+1;
  $scope.editingCCNumber = false;
  $scope.editCCNumber = function($event) {
    $event.preventDefault();
    $scope.paymentInfo.editCCNumber = true;
    $timeout(function() {
      $scope.editingCCNumber = true;
    }, 0);
  };
  $scope.stopEditCCNumber = function() {
    $scope.paymentInfo.editCCNumber = !!$scope.paymentInfo.ccNumber;
    $scope.editingCCNumber=false;
  };
  if ($rootScope.userInfo) {
    $scope.paymentInfo.membershipId = $scope.paymentInfo.membershipId || $rootScope.userInfo.membershipId;
    $scope.paymentInfo.firstName = $scope.paymentInfo.firstName || $rootScope.userInfo.firstName;
    $scope.paymentInfo.lastName = $scope.paymentInfo.lastName || $rootScope.userInfo.lastName;
    $scope.paymentInfo.email = $scope.paymentInfo.email || $rootScope.userInfo.email;
    $scope.paymentInfo.mobile = $scope.paymentInfo.mobile || $rootScope.userInfo.mobile;
    $scope.paymentInfo.zipCode = $scope.paymentInfo.zipCode || $rootScope.userInfo.zipCode;
    if ($rootScope.userInfo.ccNumber) {
      $scope.paymentInfo.ccNumberMasked = '**** **** **** '+$rootScope.userInfo.ccNumber;
      $scope.paymentInfo.editCCNumber = !!$scope.paymentInfo.ccNumber;
    }
  }
  else
  {
    $scope.paymentInfo.editCCNumber = true;
  }

  $scope.onSubmit = function(form) {
    if (form.$valid && ($scope.paymentInfo.paymentMethod != 'card' || !$scope.paymentInfo.ccNumber && $rootScope.userInfo && $rootScope.userInfo.ccNumber || $scope.paymentInfo.ccExpireYear>$scope.currentYear || $scope.paymentInfo.ccExpireYear==$scope.currentYear && $scope.paymentInfo.ccExpireMonth>=$scope.currentMonth)) {
      console.log('form valid');
      if (form.ccNumber) {
        $scope.paymentInfo.ccType = form.ccNumber.$ccType;
      }
      else
        $scope.paymentInfo.ccType = null;

      $rootScope.paymentInfo = angular.copy($scope.paymentInfo);
      if ($rootScope.paymentInfo.ccNumber) {
        $rootScope.paymentInfo.ccNumberMasked = '**** **** **** '+$rootScope.paymentInfo.ccNumber.slice(-4);
      }

      function goToConfirmPage() {
        $state.go('app.book.confirm');
      }
      if (!$rootScope.session) {
        // XXX: guest user, we need check whether the email was registered.
        User.checkEmail({}, {email: $scope.paymentInfo.email}, function(ret) {
          console.log('check email ret:', ret);
          if (ret.exists) {
            $rootScope.showMessage('Email registered, please sign in', 2000);
            $timeout(function() {
              $state.go('app.signin', {email: $scope.paymentInfo.email, next: 'app.book.confirm'});
            }, 800);
          }
          else
            $state.go('app.book.confirm');
        });
      }
      else
        // FIXME: what if user input an different email than the registered one?
        $state.go('app.book.confirm');
    }
    else {
      console.log('form invalid');
    }
  };
  $scope.doSubmit = function() {
    console.log('do submit:', $scope.form);
    $scope.form.$submitted = true;
    $scope.onSubmit($scope.form);
  };
})

.controller('MyPaymentInfoCtrl', function($scope, $rootScope, User, $state, $timeout, CONFIG, $cordovaGoogleAnalytics) {

  $rootScope.trackView('My Payment Info Screen');

  $scope.currentYear = new Date().getFullYear();
  $scope.currentMonth = new Date().getMonth()+1;
  $scope.paymentInfo = $rootScope.userInfo.ccNumber ? {
    ccNumberMasked: '**** **** **** '+$rootScope.userInfo.ccNumber,
    zipCode: $rootScope.userInfo.zipCode
  } : {};
  if ($rootScope.userInfo.membershipId) {
    $scope.paymentInfo.membershipId = $rootScope.userInfo.membershipId;
  }
  $scope.editingCCNumber = false;
  $scope.editCCNumber = function($event) {
    $event.preventDefault();
    $scope.paymentInfo.editCCNumber = true;
    $timeout(function() {
      $scope.editingCCNumber = true;
    }, 0);
  };
  $scope.stopEditCCNumber = function() {
    $scope.paymentInfo.editCCNumber = !!$scope.paymentInfo.ccNumber;
    $scope.editingCCNumber=false;
  };

  $scope.updatePaymentInfo = function(form) {
    if(form.$valid && (!$scope.paymentInfo.ccNumber || $scope.paymentInfo.ccExpireYear>$scope.currentYear || $scope.paymentInfo.ccExpireYear==$scope.currentYear && $scope.paymentInfo.ccExpireMonth>=$scope.currentMonth)) {
      console.log('update payment info ...');
      var data = {
        zipCode: $scope.paymentInfo.zipCode
      };
      if ($scope.paymentInfo.ccNumber) {
        data.ccType = form.ccNumber.$ccType;
        data.ccNumber = $scope.paymentInfo.ccNumber;
        data.ccExpireMonth = $scope.paymentInfo.ccExpireMonth;
        data.ccExpireYear = $scope.paymentInfo.ccExpireYear;
      }
      data.membershipId = $scope.paymentInfo.membershipId;
      User.updateProfile({}, data, function(ret) {
        console.log('update payment info ret:', ret);
        $rootScope.updateUserInfo(function() {
          $rootScope.showMessage('Payment info updated', 2000);
          $timeout(function() {
            $state.go('app.payment-info', {}, {reload: true});
          }, 1500);
        });
      }, function(err) {
        console.warn('update payment info failed:', err);
      });
    }
    else {
      console.log('form invalid');
    }
  };
  $scope.doSubmit = function() {
    console.log('do submit:', $scope.form);
    $scope.form.$submitted = true;
    $scope.updatePaymentInfo($scope.form);
  };
})

.controller('BookConfirmCtrl', function($scope, $rootScope, $state, totalPrice, taxInfo, Book, $ionicHistory, $ionicPopup, CONFIG, $cordovaGoogleAnalytics, $ionicScrollDelegate, $timeout) {

  $rootScope.trackView('Book Confirm Screen');

  $scope.scrolledToBottom = false;
  /*var viewLoaded = false;
  $timeout(function() {
    viewLoaded = true;
  }, 1200);
  $scope.scrolledToBottom = function() {
    if (viewLoaded && scrolledToBottom)
      return true;
    var currentPosition = $ionicScrollDelegate.getScrollPosition().top;
    var scrollHeight = $ionicScrollDelegate.getScrollView().__maxScrollTop;
    console.log(currentPosition, scrollHeight);
    return scrolledToBottom = currentPosition == scrollHeight;
  }*/
  $scope.onScroll = function() {
    var currentPosition = $ionicScrollDelegate.$getByHandle('handler').getScrollPosition().top;
    var scrollHeight = $ionicScrollDelegate.$getByHandle('handler').getScrollView().__maxScrollTop;
    //console.log(currentPosition, scrollHeight);
    if (currentPosition + 30 >= scrollHeight && !$scope.scrolledToBottom) {
      console.log('scrolled to bottom')
      $scope.scrolledToBottom = true;
      $scope.$apply();
    }
  }

  // not used indeed
  $scope.totalPrice = totalPrice;
  $scope.taxInfo = taxInfo;
  var bookData = $rootScope.bookData;
  var paymentInfo = $rootScope.paymentInfo;
  $scope.onConfirm = function() {
    // XXX: call server api to book the wash
    var orderAction = $rootScope.session ? 'makeOrder' : 'makeOrderAsGuest';
    var orderData = {
      companyId: bookData.company.id,
      buildingId: bookData.building ? (bookData.building.id || '') : '',
      vMake: bookData.vMake,
      vModel: bookData.vModel,
      vYear: bookData.vYear,
      vehicleType: bookData.vehicleType,
      careOptionId: bookData.careOption.id,
      additionalServiceIds: bookData.careOptionAddOns.map(function(option) {
        return option.id.toString();
      }).join(","),
      scheduleTime: bookData.scheduleTime,
      scheduleDate: bookData.scheduleDate,
      callMeOnArrival: bookData.callOnArrival,
      whereKeyLeft: bookData.whereKeyLeft,
      firstName: paymentInfo.firstName,
      lastName: paymentInfo.lastName,
      email: paymentInfo.email,
      mobile: paymentInfo.mobile,
      paymentMethod: paymentInfo.paymentMethod,
      membershipId: paymentInfo.membershipId,
      finalPriceWithTax: taxInfo.finalAmount
    };
    if (paymentInfo.paymentMethod == 'card') {
//      orderData.payNow = 'No';
//    }
//    else {
      orderData.zipCode = paymentInfo.zipCode;
      if (paymentInfo.ccNumber) {
        orderData.ccType = paymentInfo.ccType;
        orderData.ccNumber = paymentInfo.ccNumber;
        orderData.ccExpireMonth = paymentInfo.ccExpireMonth;
        orderData.ccExpireYear = paymentInfo.ccExpireYear;
      }
      else if (!$rootScope.session) {
        // card info is missing
        $rootScope.showMessage('Payment card info is missing.', 2000);
        $ionicHistory.goBack();
        return;
      }
//      orderData.payNow = 'Yes';
    }
    if (CONFIG.DEBUG)
      orderData.mockOrder = 'Yes';
    console.log(orderAction + ':', orderData);
    Book[orderAction]({}, orderData, function(ret) {
      console.log(orderAction + ' ret:', ret);
      // FIXME: consider clear the book data and payment info
      //$rootScope.bookData = {};
      //$rootScope.paymentInfo = null;
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        disableBack: true
      });
      $state.go('app.book-complete', {
        orderInfo: {
          bookData: bookData,
          paymentInfo: paymentInfo,
          totalPrice: totalPrice,
          taxInfo: taxInfo
        }
      });

      if (!CONFIG.DEBUG && window.analytics) {
        $cordovaGoogleAnalytics.trackEvent('Book', 'Book Completion', 'Book Completion', totalPrice);
        $cordovaGoogleAnalytics.addTransaction(ret.bookingId, bookData.company.name, totalPrice, taxInfo.taxAmount, '0', 'USD');
      }
    },
    function (err) {
      //$timeout(function() {
      //  $ionicHistory.goBack();
      //}, 3000);
    });
  }
})

.controller('BookCompleteCtrl', function($scope, $rootScope, $state, $stateParams, CONFIG, $cordovaGoogleAnalytics) {

  $rootScope.trackView('Book Complete Screen');

  console.log('BookComplete', $stateParams);
  if (!$stateParams.orderInfo)
    return $state.go('app.splash');
  // not used indeed
  $scope.totalPrice = $stateParams.orderInfo.totalPrice;
  $scope.taxInfo = $stateParams.orderInfo.taxInfo;
  $scope.bookData = $stateParams.orderInfo.bookData;
  $scope.paymentInfo = $stateParams.orderInfo.paymentInfo;
  $rootScope.showMessage('Your wash has been successfully scheduled.', 2000);
});


