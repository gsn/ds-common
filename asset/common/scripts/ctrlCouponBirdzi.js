(function(angular, $, undefined) {
  'use strict';
  var myDirectiveName = 'ctrlCouponBirdzi';
  angular.module('gsn.core').controller(myDirectiveName, ['$scope', 'gsnStore', 'gsnApi', '$timeout', '$analytics', '$filter', 'gsnProfile', '$location', '$http', myController]).directive(myDirectiveName, myDirective);

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };
    return directive;
  }

  function myController($scope, gsnStore, gsnApi, $timeout, $analytics, $filter, gsnProfile, $location, $http) {
    $scope.activate = activate;
    $scope.loadMore = loadMore;
    $scope.selectedCoupons = {
      items: [],
      targeted: [],
      noCircular: false,
      totalSavings: 0
    };
    $scope.preSelectedCoupons = {
      items: [],
      targeted: []
    };
    $scope.coupons = {
      store: {
        items: []
      },
      birdzi: {
        items: []
      }
    };
    $scope.vm = {
      filterBy: $location.search().q,
      sortBy: 'EndDate',
      sortByName: 'About to Expire'
    };

    $scope.couponType = 'store';
    $scope.itemsPerPage = $location.search().itemsperpage || $location.search().itemsPerPage || $scope.itemsPerPage || 20;

    if ($scope.couponiFrame) {
      $scope.couponType = 'store';
      if (gsnApi.isNull(gsnApi.getSelectedStoreId(), 0) <= 0) {
        $scope.goUrl('/storelocator?fromUrl=' + encodeURIComponent($location.url()));
        return;
      }
    }

    function loadMore() {
      var items = $scope.preSelectedCoupons.items || [];
      if (items.length > 0) {
        var last = $scope.selectedCoupons.items.length - 1;
        for (var i = 1; i <= $scope.itemsPerPage; i++) {
          var item = items[last + i];
          if (item) {
            $scope.selectedCoupons.items.push(item);
          }
        }
      }
    }

    function loadCoupons() {
      var instoreCoupons = gsnStore.getInstoreCoupons();
      if (!$scope.preSelectedCoupons.items) {
        $scope.preSelectedCoupons = {
          items: [],
          targeted: []
        };
      }

      $scope.coupons.store.items = instoreCoupons.items || [];
      $scope.preSelectedCoupons.items.length = 0;
      $scope.preSelectedCoupons.targeted.length = 0;
      var list = $scope.preSelectedCoupons;
      if ($scope.couponType === 'store') {
        list.items = instoreCoupons.items;
      } else {
        // loading jsonp coupon
        if ($scope.coupons.birdzi.items.length > 0) {
          return;
        }

        $.ajax({
            url: 'https://zip.brickinc.net/coupons.php?cid=3604',
            dataType: 'jsonp',
            success: function(data){
              // process coupon data, just for reference
              angular.forEach(data, function(item) {
                item.EndDate = item.enddate;
                item.StartDate = item.startdate;
                item.SmallImageUrl = item.mediapath;
                item.OfferPriority = item.rank;
                item.CategoryName = item.categoryname;
                item.Id = item.couponid;
                item.BrandName = item.title;
                item.Description1 = item.description;
                item.Description2 = item.rules;
                item.ImageUrl = item.detailmediapath;
                item.IsTargeted = false;
              });

              $scope.coupons.birdzi.items = data;
              $scope.preSelectedCoupons.items = data;
              $timeout($scope.loadMore, 500);
            }
        });
      }
    }

    function activate() {
      loadCoupons();
      // apply filter
      $scope.preSelectedCoupons.items = $filter('filter')($filter('filter')($scope.preSelectedCoupons.items, $scope.vm.filterBy), {
        IsTargeted: false
      });
      $scope.preSelectedCoupons.items = $filter('orderBy')($filter('filter')($scope.preSelectedCoupons.items, $scope.vm.filterBy), $scope.vm.sortBy);
      $scope.preSelectedCoupons.targeted = $filter('orderBy')($filter('filter')($scope.preSelectedCoupons.targeted, $scope.vm.filterBy), $scope.vm.sortBy);
      $scope.selectedCoupons.items.length = 0;
      $scope.selectedCoupons.targeted = $scope.preSelectedCoupons.targeted;
      loadMore();
    }

    $scope.$on('gsnevent:circular-loaded', function(event, data) {
      if (data.success) {
        $timeout(activate, 500);
        $scope.selectedCoupons.noCircular = false;
      } else {
        $scope.selectedCoupons.noCircular = true;
      }
    });

    $scope.$watch('vm.sortBy', activate);
    $scope.$watch('vm.filterBy', activate);

    $timeout(activate, 500);
  }
})(angular, jQuery);
