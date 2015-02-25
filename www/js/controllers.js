angular.module('starter.controllers', [])


// A simple controller that fetches a list of data from a service
.controller('NearbyCtrl', function($scope, PetService, $http, $location) {
    $scope.$watch('location', function(newVal, oldVal) {
        if (newVal) {
            $location.path('/tab/place/' + newVal.place_id);
        }
    }, true);

    $scope.getLocation = function() {
        placesLoaded = false;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition($scope.showPosition);
        }
    };

    $scope.showPosition = function(position) {
    	lat = position.coords.latitude; long = position.coords.longitude;
        $scope.latitude = position.coords.latitude;
        $scope.longitude = position.coords.longitude;
        $scope.$apply();

        var map;
        var infowindow;

        var pyrmont = new google.maps.LatLng($scope.latitude, $scope.longitude);

        map = new google.maps.Map(document.getElementById('map-canvas'), {
            center: pyrmont,
            zoom: 15
        });

        var request = {
            location: pyrmont,
            radius: 500,
            types: ['art_gallery', 'bakery', 'bar', 'bowling_alley', 'cafe', 'campground', 'casino', 'convenience_store', 'food', 'gym', 'liquor_store', 'museum', 'night_club', 'park', 'restaurant', 'spa']
        };
        infowindow = new google.maps.InfoWindow();
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, callback);


        function callback(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                $scope.businesses = results;
                angular.forEach($scope.businesses, function(place, key) {
                    if (place.photos) {
                        place.img = place.photos[0].getUrl({
                            'maxWidth': 300,
                            'maxHeight': 300
                        });
                    }
                    $scope.nearbyPlacesIds.push(place.place_id);
                    //how far?
                    place.distance = distance($scope.latitude, $scope.longitude, place.geometry.location.k, place.geometry.location.D).toFixed(1);
                });
                placesArray = $scope.businesses;
                placesLoaded = true;
                $scope.$apply();
                $scope.getPlaceReviews();
            }
        }

    };
    $scope.nearbyPlacesIds = [];
    if (!placesLoaded) {
        $scope.getLocation();
    } else {
        $scope.businesses = placesArray;
        $scope.$apply();
    }
    if (fbFriendArray.length < 1) {
        loadFBFriends();
    }
    $scope.getPlaceReviews = function() {
        var PlaceObject = Parse.Object.extend("PlaceReviews");
        var placeObject = new Parse.Query(PlaceObject);

        placeObject.containedIn("placeID", $scope.nearbyPlacesIds);
        placeObject.find({
            success: function(results) {
                angular.forEach(results, function(frPlace, key) {
                    angular.forEach($scope.businesses, function(business, key2) {
                        if (business.place_id == frPlace.attributes.placeID) {
                            business.friends = [];
                            angular.forEach(frPlace.attributes.fbUserIds, function(friendid, key3) {
                                //business.friends.push(fbFriendArray[friendid]);
                                if (friendid != currentUserFBID) {
                                    business.friends.push(friendid);
                                }
                            });
                            business.recs = frPlace.attributes.users.length;
                        }
                    });
                });
                $scope.$apply();
                $scope.$broadcast('scroll.refreshComplete');
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    };
})


// A simple controller that shows a tapped item's data
.controller('PlaceDetailCtrl', function($scope, $stateParams, PetService, $timeout, $ionicNavBarDelegate, $location) {

    $scope.getLocation = function() {
        placesLoaded = false;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition($scope.showPosition);
        }
    };
    $scope.showPosition = function(position) {
    	if (position) {
    		$scope.latitude = position.coords.latitude;
        	$scope.longitude = position.coords.longitude;
    	}
    	else {
    		$scope.latitude = lat;
        	$scope.longitude = long;
    	}
    	
    	$scope.placeID = $stateParams.placeId;
	    var map = new google.maps.Map(document.getElementById('map-canvas-place'), {
	        center: new google.maps.LatLng($scope.latitude, $scope.longitude),
	        zoom: 15
	    });

	    var request = {
	        placeId: $scope.placeID
	    };

	    var infowindow = new google.maps.InfoWindow();
	    var service = new google.maps.places.PlacesService(map);

	    service.getDetails(request, function(place, status) {
	        if (status == google.maps.places.PlacesServiceStatus.OK) {
	            if (place.photos) {
	                place.img = place.photos[0].getUrl({
	                    'maxWidth': 800,
	                    'maxHeight': 800
	                });
	            }
	            var d = new Date();
				var n = d.getDay();
	            place.hours = place.opening_hours.weekday_text[n-1];
	            place.distance = distance($scope.latitude,  $scope.longitude, place.geometry.location.k, place.geometry.location.D).toFixed(1);
	            $scope.place = place;
	            $scope.getPlaceReviews();
	              var marker = new google.maps.Marker({
			        map: map,
			        position: place.geometry.location
			      });
			      google.maps.event.addListener(marker, 'click', function() {
			        infowindow.setContent(place.name);
			        infowindow.open(map, this);
			      });
	            $scope.$apply();
	        }
	    });
    }
    if (!lat) {
	    $scope.getLocation();
    }
    else {
    	$scope.showPosition();
    }
    $scope.currentUser = Parse.User.current();
    $scope.myGoBack = function() {
       // $ionicNavBarDelegate.back();
       $location.path('/tab/nearby/');
    };
    $scope.likePlace = function() {
        var PlaceObject = Parse.Object.extend("PlaceReviews");
        var placeObject = new Parse.Query(PlaceObject);

        placeObject.equalTo("placeID", $scope.placeID);
        placeObject.find({
            success: function(results) {
                // Do something with the returned Parse.Object values
                if (results.length == 0) {
                    var newPlaceObject = new PlaceObject();
                    newPlaceObject.set("placeID", $scope.placeID);
                    newPlaceObject.set("placeName", $scope.place.name);
                    newPlaceObject.increment("likes");
                    newPlaceObject.addUnique("users", $scope.currentUser.id);
                    newPlaceObject.addUnique("fbUserIds", $scope.currentUser.attributes.social_id);
                    newPlaceObject.addUnique("fbUserNames", $scope.currentUser.attributes.name);

                    newPlaceObject.save(null, {
                        success: function(newPlaceObject) {
                            // Execute any logic that should take place after the object is saved.
                            alert('New object created with objectId: ' + newPlaceObject.id);
                        },
                        error: function(newPlaceObject, error) {
                            // Execute any logic that should take place if the save fails.
                            // error is a Parse.Error with an error code and message.
                            alert('Failed to create new object, with error code: ' + error.message);
                        }
                    });
                } else {
                    results[0].addUnique("users", $scope.currentUser.id);
                    results[0].addUnique("fbUserIds", $scope.currentUser.attributes.social_id);
                    results[0].addUnique("fbUserNames", $scope.currentUser.attributes.name);
                    results[0].save();
                }

                $scope.$apply()
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    };
  	 if (fbFriendArray.length < 1) {
        loadFBFriends();
    }
  	 $scope.getPlaceReviews = function() {
        var PlaceObject = Parse.Object.extend("PlaceReviews");
        var placeObject = new Parse.Query(PlaceObject);

        placeObject.equalTo("placeID", $scope.placeID);
        placeObject.find({
            success: function(results) {
                angular.forEach(results, function(frPlace, key) {
	                $scope.place.friends = [];
	                angular.forEach(frPlace.attributes.fbUserIds, function(friendid, key3) {
	                    //business.friends.push(fbFriendArray[friendid]);
	                    if (friendid != currentUserFBID) {
	                        $scope.place.friends.push(friendid);
	                    }
	                });
	                $scope.place.recs = frPlace.attributes.users.length;
                    });
                $scope.$apply();
                $scope.$broadcast('scroll.refreshComplete');
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    };

});



function loadFBFriends() {
    hello('facebook').api('me/friends', function(r, next) {
        for (var i = 0; i < r.data.length; i++) {
            var o = r.data[i];
            //put each friend's FB ID in an array
            fbFriendArray[o.id] = o.name;
        };
    });

}

function distance(lat1, lon1, lat2, lon2, unit) {
    var radlat1 = Math.PI * lat1 / 180;
    var radlat2 = Math.PI * lat2 / 180;
    var radlon1 = Math.PI * lon1 / 180;
    var radlon2 = Math.PI * lon2 / 180;
    var theta = lon1 - lon2;
    var radtheta = Math.PI * theta / 180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == "K") {
        dist = dist * 1.609344
    }
    if (unit == "N") {
        dist = dist * 0.8684
    }
    return dist;
}