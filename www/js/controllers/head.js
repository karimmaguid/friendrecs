var currentUserID = '';
var currentUserName = '';
var interviewID = '';
var newImageURL;
var currentUserFBID;
var lastTimestamp;
var fbFriendArray = [];
var placesLoaded = false;
var lat;
var long;

function headCtrl($scope, $location, $cookieStore) {

    //activate current page in nav
    $scope.getClass = function (path) {
        if ($location.path().substr(0, path.length) == path) {
            return "active";
        } else {
            return "";
        }
    }


    //logout a user
    $scope.logUserOut = function () {
    	$scope.currentUser.set("last_login", Date.now());
    	$scope.currentUser.save();
        Parse.User.logOut();
        $scope.currentUser = Parse.User.current();
        currentUserID = null;
        //$scope.setUserCookie('false');
        $cookieStore.remove('friendRecUserLoggedIn');
        window.location = '/';
    }
    $scope.logFacebookUserIn = function () {
        hello.init({
            facebook: '294516767371408'
        });
        hello('facebook').login({
            scope: 'email,friends'
        }, {
            redirect_uri: 'redirect.html'
        });
        hello.on('auth.login', function (auth) {
            // call user information, for the given network
            $scope.getFBData(auth);
            $scope.getFBFriends();
        });
    }

    $scope.getFBData = function (auth) {
        hello('facebook').api('/me').success(function (r) {
            if (r) {
                //now that we have their social info, log them in or register them

                $scope.fbUser = r;
                $cookieStore.put('friendRecUserLoggedIn', true);
                Parse.User.logIn($scope.fbUser.email, 'padressuck', {
                    success: function (user) {
                        // Do stuff after successful login.
                        currentUserID = user.id;
                        $scope.createFacebookRecord();
                        $scope.currentUser = user;
                        //user.set("last_login", Date.now());
                        user.increment('login_count');
                        user.save();
                        $scope.$apply();
                    },
                    error: function (user, error) {
                        // The login failed. Check error to see why.
                        console.log("no login - reason:" + error);
                        if (error.code == 101) {
                            var user = new Parse.User();
                            user.set("username", $scope.fbUser.email);
                            user.set("password", 'padressuck');
                            // other fields can be set just like with Parse.Object
                            user.set("name", $scope.fbUser.name);
                            user.set("picture", $scope.fbUser.picture);
                            user.set("social_id", $scope.fbUser.id);
                            user.set("social_network", auth.network);
                            user.increment('login_count');
                            //user.set("last_login", Date.now());
                            user.signUp(null, {
                                success: function (user) {
                                    // Hooray! Let them use the app now.
                                    $scope.currentUser = user;
                                    currentUserID = user.id;
                                    currentUserName = user.attributes.username;
                                    $scope.createFacebookRecord();
                                    $cookieStore.put('friendRecUserLoggedIn', true);
                                    //$scope.$apply()
                                    location.reload();
                                },
                                error: function (user, error) {
                                    // Show the error message somewhere and let the user try again.
                                    alert("Error: " + error.code + " " + error.message);
                                }
                            });
                        }
                    }
                });
                $scope.$apply();
            }
            console.log(r);
        });
    }

    $scope.createFacebookRecord = function () {
        var SocialUser = Parse.Object.extend("SocialUser");
        var query = new Parse.Query(SocialUser);
        query.equalTo("user_id", currentUserID);
        query.first({
            success: function (result) {
                if (result) {
                    result.set('user_id', currentUserID);
                    result.set('facebook_data', $scope.currentUser);
                    result.save(null, {
                        success: function (user) {

                        },
                        error: function (user, error) {

                        }
                    });
                } else {
                    //create a newSocialUser record
                    var SocialUserObj = Parse.Object.extend("SocialUser");
                    var socialUserObj = new SocialUserObj();
                    socialUserObj.set('user_id', currentUserID);
                    socialUserObj.set('facebook_data', $scope.fbUser);
                    socialUserObj.save(null, {
                        success: function (user) {
                            console.log(user);
                        },
                        error: function (user, error) {
                            console.log(error);
                        }
                    });
                }
            },
            error: function (error) {
                console.log(error);

            }
        });
    }

    $scope.showNotifications = function(){
        $('#notificaionModal').foundation('reveal', 'open');
        $( "a" ).click(function() {
            $('#notificaionModal').foundation('reveal', 'close');
        });          
    }
   
    var userCookie = $cookieStore.get('friendRecUserLoggedIn');
    if (userCookie == true) {
        //if user is logged in, set their ID and Name in Global Var
        $scope.currentUser = Parse.User.current();
        if ($scope.currentUser) {
            currentUserID = $scope.currentUser.id;
            currentUserName = $scope.currentUser.attributes.username;
            currentUserFBID = $scope.currentUser.attributes.social_id;
            $scope.currentUser.picture = $scope.currentUser.attributes.picture;
            $scope.currentUser.name = $scope.currentUser.attributes.name;
        }
        hello.init({
            facebook: '294516767371408'
        });
        $scope.currentUserID = currentUserID;
        if (!$scope.currentUser) {
            $scope.getFBData();
        }
    }
    $(document).on('closed.fndtn.reveal', '[data-reveal]', function () {
        var modal = $(this);
        if (modal[0].id == 'notificaionModal'){
            $scope.currentUser.set('last_notification', Date.now());
            $scope.currentUser.save();
            $scope.newNotifications = 0;
            $scope.$apply();
        }
    });

     

    
}

//Global functions for use anywhere
function trimSpace(str) {
    str = str.toLowerCase();
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}


function returnUniques(a) {
    var unique = a.filter(function (itm, i, a) {
        return i == a.indexOf(itm);
    });
    return unique;
}

function guid(short) {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        if (short) {
            return s4() + s4();
        } else {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        }
    }
    // helper function to grab non-angular parameters

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function firstWord(text) {
    if (text) {
        return text.substr(0, 2)
    }
}

function convertToSlug(Text) {
    return Text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

function getPageHeight() {
    return (document.height !== undefined) ? document.height : document.body.offsetHeight;
}

function getPageWidth() {
    return (document.width !== undefined) ? document.width : document.body.offsetWidth;
}

function stripHTML(html) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

function stripScripts(s) {
    var div = document.createElement('div');
    div.innerHTML = s;
    var scripts = div.getElementsByTagName('script');
    var i = scripts.length;
    while (i--) {
        scripts[i].parentNode.removeChild(scripts[i]);
    }
    return div.innerHTML;
}
Array.prototype.pushIfNotExist = function (element, comparer) {
    if (!this.inArray(comparer)) {
        this.push(element);
    }
};
var outputHTML = []; // Buffer data. This data is used to create a table using `.innerHTML`
var totalWords = [];
var keyWordsArray = [];
var text = '';
var keywordRuns = 0;

function getKeywords(keywordText) {
    var text = '';

    text += keywordText;
    keywordRuns++;
    //if (keywordRuns == 3) {
        keywordRuns = 0;
        text = text.replace(/<\/?[^>]+(>|$)/g, "");
        // console.log(text);
        var atLeast = 2; // Show results with at least .. occurrences
        var numWords = 10; // Show statistics for one to .. words
        var ignoreCase = true; // Case-sensitivity
        var REallowedChars = /[^a-zA-Z'\-]+/g;
        // RE pattern to select valid characters. Invalid characters are replaced with a whitespace

        //now remove common words
        var commonText = "the has http this contentwrapper wrappper review rating view margin background padding none that shipping delivery are src jpg png gif be as to of img class div span and a is in that have I it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take  people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us a b c";
        commonText = commonText.split(' ');
        // Remove all irrelevant characters
        text = text.replace(REallowedChars, " ").replace(/^\s+/, "").replace(/\s+$/, "");

        commonText.forEach(function (word) {
            word = ' ' + word + ' ';
            re = new RegExp(word, "g");
            text = text.toLowerCase();
            text = text.replace(re, ' ');
        });

        var i, j, k, textlen, len, s;
        // Prepare key hash
        var keys = [null]; //"keys[0] = null", a word boundary with length zero is empty
        var results = [];
        numWords++; //for human logic, we start counting at 1 instead of 0
        for (i = 1; i <= numWords; i++) {
            keys.push({});
        }

        // Create a hash
        if (ignoreCase) text = text.toLowerCase();
        text = text.split(/\s+/);
        for (i = 0, textlen = text.length; i < textlen; i++) {
            s = text[i];
            keys[1][s] = (keys[1][s] || 0) + 1;
            for (j = 2; j <= numWords; j++) {
                if (i + j <= textlen) {
                    s += " " + text[i + j - 1];
                    keys[j][s] = (keys[j][s] || 0) + 1;
                } else break;
            }
        }

        // Result parsing
        var totalMatches = 0;

        // Prepares results for advanced analysis
        for (var k = 1; k <= numWords; k++) {
            results[k] = [];
            var key = keys[k];
            for (var i in key) {
                if (key[i] >= atLeast) results[k].push({
                    "word": i,
                    "count": key[i]
                });
            }
        }
        var f_sortAscending = function (x, y) {
            return y.count - x.count;
        };
        for (k = 1; k < numWords; k++) {
            results[k].sort(f_sortAscending); //sorts results

            // Customize your output. For example:
            var words = results[k];
            if (words.length) outputHTML.push('<th colSpan="3" class="num-words-header">' + k + ' word' + (k == 1 ? "" : "s") + '</th>');
            for (i = 0, len = words.length; i < len; i++) {
                var word = words[i].word;
                var count = words[i].count;
                if (words[i].word.length > 2 && word.indexOf('-') != 0) {
                    if (i < 100) {
                        //Characters have been validated. No fear for XSS
                        outputHTML.push("<td>" + words[i].word + "</td><td>" +
                            words[i].count + "</td><td>" +
                            Math.round(words[i].count / textlen * 10000) / 100 + "%</td>");
                    }
                    if (i < 50) {
                        keyWordsArray.push(words[i].word);
                    }
                    totalMatches++;
                }
            }
        }
        outputHTML = '<table id="wordAnalysis"><thead><tr>' +
            '<td>Phrase</td><td>Count</td><td>Relativity</td></tr>' +
            '</thead><tbody><tr>' + outputHTML.join("</tr><tr>") +
            "</tr></tbody></table>";
        console.log(totalWords);
    //    $('#Keywords-Scraped').html("<div>Found " + totalMatches + " keywords across top 3 websites, here are the top 100 in each combo set: </div>" + outputHTML);
        return keyWordsArray;
  //  }
}

function submitActivity(activity, userID, entityUserID, userName, entityID, entityTitle, referenceURL, referenceTitle, referenceUser, entityImage, user_fb_id, itemTextLong) {
    var ActivityObj = Parse.Object.extend("UserActivities");
    var activityObj = new ActivityObj();
    activityObj.set("activity", activity);
    activityObj.set("userID", userID);
    activityObj.set("userName", userName);
    activityObj.set("entityID", entityID);
    activityObj.set("entity_title", entityTitle);
    if (itemTextLong) {
        activityObj.set("entity_text", itemTextLong);
    }
    activityObj.set("timestamp", Date.now());
    activityObj.set("entity_ref_url", referenceURL);
    activityObj.set("entity_ref_title", referenceTitle);
    activityObj.set("entity_ref_user", referenceUser);
    activityObj.set("entity_image", entityImage);
    activityObj.set("entity_user_id", entityUserID);
    activityObj.set("user_fb_id", user_fb_id);
    activityObj.save(null, {
        success: function (activityOBJ) {

        },
        error: function (activityOBJ, error) {
            alert('Failed to create new object, with error code: ' + error.description);
        }
    });
}

function getYoutubeId(url) {
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regExp);

    if (match && match[2].length == 11) {
        return match[2];
    } else {
        return 'error';
    }
}
