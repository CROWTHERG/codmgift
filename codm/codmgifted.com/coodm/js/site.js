var SITE = SITE || {};

if (!window.console) console = {log: function() {}};

SITE.constants = {
	ERROR_TOOLTIP_TOP_OFFSET : -65,
	ERROR_TOOLTIP_LEFT_OFFSET : -165,
	STYLE_CLASS_FOR_VALID : 'validationPassed',
	STYLE_CLASS_FOR_ERROR : 'validationError'
};

SITE.util = {
	adjustHeightOfSelect : function() {
		$('.SSO-PAGE select, .SSO-MODAL select').height( function() {
			var $sibling = $(this).siblings('.customStyleSelectBox');
			$(this).height(
				$sibling.height(
					$sibling.find('.customStyleSelectBoxInner')
						.height()).height() + 13);
		});
	},

	buildProxy : function($obj, e) {
		var val = $obj.val();
		$obj[e](function() {
			val = $obj.val();
		});
		return {
			val : function() {
				return val;
			}
		};
	},

	buildCheckboxProxy : function($obj, e, forceCheck) {
		var val = $obj.is(':checked') || "";
		var isForceCheck = forceCheck ? forceCheck : false;

		$obj[e](function() {
			val = $obj.is(':checked') || "";
		});

		return {
			val : function() {
				return val;
			},
			
			getForceCheck : function() {
				return isForceCheck;
			}
		};
	},

	hasQuery : function(key) {
		var hasQuestionMark = (location.search.match(/^\?/)) ? 1 : 0;
		var queries = location.search.substring(hasQuestionMark);
		queries = queries.split("&");
		
		for(var i = 0; i < queries.length; i++) {
			var pair = queries[i].split("=");
			if(pair[0].match(key) && (pair[0].toLowerCase() == key.toLowerCase()))
				return true;
		}
		
		return false;
	},

	getQueryValue : function(key) {
		var queries = location.search.split("&");
	
		for(var i = 0; i < queries.length; i++) {
			var pair = queries[i].split("=");
			if(pair[0].match(key))
				return pair[1];
		}

		return null;
	},

	hasQueryString: function(href) {
		if(href == undefined) return false;
		
		return (href.indexOf("?") >= 0);
	}
};

SITE.core = {
	apiUrl : SSO.utility.getApiUrl(),
	locale : "",

	getSecureUrl : function(url) {
		var hostname = location.hostname;
		if (hostname.indexOf('localhost') === 0 || hostname === '127.0.0.1') {
			return url;
		} else {
			return url.replace("http://", "https://").replace("8080", "8443");
		}
	},

	hasLength : function(anyString) {
		if (anyString && anyString.length) {
			return true;
		} else {
			return false;
		}
	},

	buildApiEndpoint : function() {
		scriptTag = document.getElementById('common-script'),
				scriptUrl = scriptTag.src;
		return scriptUrl.substr(0, scriptUrl.indexOf('/scripts/site.js'));
	},

	// Determine the locale of self page
	getLocale : function() {
		var locale = null;
		
		if (!this.hasLength(locale)) 
			locale = SSO.utility.getCookie('ACT_SSO_LOCALE');
		
		if (!this.hasLength(locale)) {
			locale = 'en_US';
		}
		
		return locale;
	},

	loadLocaleDictionary : function(locale) {
		var u = this.getSecureUrl(SSO.utility.getApiUrl())
				+ '/script/siteDictionary/'
				+ (locale ? ("loc_" + locale) : "default") + '.json';
		jQuery.ajax({
			cache : true,
			url : u,
			dataType : 'json',
			success : function(d) {
				SITE.dictionary = d.dictionary;
				SITE.EUAgeGates = d.EUAgeGates;
				SITE.core.dictionaryLoaded = true;
				SITE.core.fullyInitdCheck();
			},
			error : function(d) {
				SITE.core.dictionaryLoaded = false;
			}
		});
	},
	
	fullyInitdCheck : function() {
		var core = SITE.core;
		/*
		 * Falsy meanings: dictionaryLoaded === false - failed to load
		 * dictionaryLoaded === undefined - still loading
		 */
		if (core.dictionaryLoaded && core.documentIsReady) {
			// safe to run all SSO initialization functions
			this.fullyInitdActions();
		}
	},

	// Fire when SITE.core is fully init'd and Document is ready
	fullyInitdActions : function() {
		SITE.mobilegame.init();
		SITE.registerEmail.init();
		SITE.registration.init();
		SITE.login.init();
		SITE.optOut.init();
		SITE.resendEmail.init();
		SITE.authTokenManager.init();
		SITE.anonymousOptOut.init();
		SITE.cdl.init();
		SITE.temp141.init();
		SITE.recaptchaSizing.init();
		SITE.promoCheck.init();
		//SITE.oneTrust.init();
	},

	init : function() {
		this.loadLocaleDictionary(this.getLocale());

		this.debug = true; // remove this for PROD
		SITE.core.documentIsReady = true;
		SITE.core.fullyInitdCheck();
	}
};

SITE.accessibility = {
	handleModalTabbable : function(dialog) {	
		var focusedOriginEl = $(':focus');		
		var tabbableEls = new Array();
		var tabbableLength;
		const isUnlinkModal = dialog.container.find('#unlink-account-modal').length;

		if(isUnlinkModal) {
			//different traversal to find tabbable elements for unlink modal markup structure
			var closeButtonEl = dialog.container.find('> a:not(.hidden)');
			var notHiddenEls = dialog.container.find('#unlink-account-modal > :not(.hidden)');
			var foundEls = notHiddenEls.find('a:not(.hidden), button, area[href], input:not([disabled], [type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
			tabbableEls.push(closeButtonEl);			
			$.each(foundEls, function( index, value ) {
				tabbableEls.push(value);
			});
		} else {
			tabbableEls = dialog.container.find('a:not(.hidden), button, area[href], input:not([disabled], [type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
		}
		
		tabbableEls = Array.prototype.slice.call(tabbableEls);
		tabbableLength = tabbableEls.length;
		
		$.each(tabbableEls, function( index, value ) {
			$(tabbableEls[index]).attr("tabindex", "0");
		});
		
		dialog.container.on("keydown click", keydownEventListener);
		dialog.overlay.on("click", function () {
			focusedOriginEl.focus();
		});
		
		var focusedElIndex = 0;
		$(tabbableEls[focusedElIndex]).focus();
		var focusedCurrentEl = $(':focus');
		
	    var keys = {
	    	tab: 9,
	    	esc: 27,
	    	enter: 13,
	        end: 35,
	        home: 36,
	        left: 37,
	        up: 38,
	        right: 39,
	        down: 40,
	        delete: 46
	    };

	    // Handle keydown on tabs
	    function keydownEventListener (event) {
	        var key = event.keyCode;
	        var type = event.type;
	        
	        switch (true) {
	            case (type == "click"):	                	                
	                if(isUnlinkModal) {
		            	$(tabbableEls[focusedElIndex]).css("outline", "none");
		            } 
		            
	            	focusedElIndex = 0;
	                $(tabbableEls[focusedElIndex]).focus();
	                
	                if(isUnlinkModal) {
	                	$(tabbableEls[focusedElIndex]).css("outline", "auto");
	                	$(tabbableEls[focusedElIndex]).css("outline-offset", "4px");
	                	$(tabbableEls[focusedElIndex]).css("outline-color", "transparent");
		            } 
	                
					var focusedEl = $(':focus');
	                break;	            	
	            case (key == keys.tab):
	                event.preventDefault();
	                
	                if(isUnlinkModal) {
		            	$(tabbableEls[focusedElIndex]).css("outline", "none");
		            } 
	                
	                if(event.shiftKey) {
	                	focusedElIndex = focusedElIndex - 1;
	                } else {
	                	focusedElIndex = focusedElIndex + 1;
	                }
	                if(focusedElIndex >= tabbableLength) { 
	                	focusedElIndex = 0;
	                } else if(focusedElIndex < 0) {
	                	focusedElIndex = tabbableLength-1;
	                }
	                $(tabbableEls[focusedElIndex]).focus();
	                
	                if(isUnlinkModal) {
	                	$(tabbableEls[focusedElIndex]).css("outline", "auto");
	                	$(tabbableEls[focusedElIndex]).css("outline-offset", "4px");
	                	$(tabbableEls[focusedElIndex]).css("outline-color", "transparent");
		            } 

					var focusedEl = $(':focus');
	                break;	                
	            case (key == keys.esc):
	                event.preventDefault();
	                focusedOriginEl.focus();
	                break; 
	            case (key == keys.up):
	            case (key == keys.down):
	                event.preventDefault();
	                break;
	        };
	    };
	}
};

SITE.sms = {
	isSMSSub: false,
	smsBrand: null,

	init : function() {
		this.checkSMSSub();
		if(SITE.sms.isSMSSub)
			this.setupSMSSub();
	},

	checkSMSSub: function() {
		var isSMSFlow = SITE.util.hasQuery("sms") || (SSO.utility.getCookie("sms") && SSO.utility.getCookie("sms").length);
		if(isSMSFlow) {
			SITE.sms.smsBrand = SITE.util.getQueryValue("sms");
			if(SITE.sms.smsBrand == null) {
				SITE.sms.smsBrand = SSO.utility.getCookie("sms");
			}
		}

		if(SITE.sms.smsBrand != null)
			SITE.sms.isSMSSub = true;
	},

	setupSMSSub: function() {
		$("#account-preferences-section .contactUpdateMobile #changeMobileLink").addClass("highlight");
		$("#account-profile-phonenumber .personalInfoForms, #account-profile-phonenumber button").addClass("highlight");

		$(".profile-tab-nav .preferences").click();
    	
	},

	afterPhoneAdded: function() {
		$("#account-preferences-section .contactUpdateMobile #changeMobileLink").removeClass("highlight");
		$("#account-profile-phonenumber, #account-profile-phonenumber button").removeClass("highlight");

		$("#account-preferences-section ul.brand-list ." + SITE.sms.smsBrand).addClass("highlight");

		$(".profile-tab-nav .preferences").click();

		$("html, body").scrollTop($(".brand-list ." + SITE.sms.smsBrand).offset().top);
		
		SSO.utility.deleteCookie("sms");
		SSO.utility.deleteQuery("sms");
	}
};

SITE.validationFunctions = (function() {

	var ajaxValidator = function(url, param) {
		return function(value, callback) {
			var async = callback ? true : false;
			var result, data = {};
			data[param] = value;
				
			$.ajax({
				type : 'POST',
				headers: SSO.csrf.getCSRFObj(),
				async : async,
				datatype : "json",
				data : data,
				url : SSO.utility.getApiUrl() + "/" + url,
				success : function(d) {
					if (async)
						callback(d);
					else
						result = d;
				}
			});
			return result;
		};
	};

	var precheckedAjaxValidator = function(precheck, dictMessage, url, param) {
		var av = ajaxValidator(url, param);
		return function(value, callback) {
			if(precheck(value)) {
				return av(value, callback);
			} else {
				return returnValidationResult("invalid", [ SITE.dictionary[dictMessage] ], callback);
			}
		};
	};

	var returnValidationResult = function(status, messageList, callback) {
		var result = {
			status : status,
			exceptionMessageList : messageList
		};
		if (callback)
			callback(result);
		return result;
	};

	var returnResult = function(test, message, callback) {
		if (test)
			return returnValidationResult("valid", [], callback);
		else
			return returnValidationResult("invalid", [ message ], callback);
	};

	var validateRetypeField = function(validationMessage, toLowerCase) {
		return function(retypeValue, originalValue, callback) {
			if(toLowerCase) {
				retypeValue = retypeValue.toLowerCase();
				originalValue = originalValue.toLowerCase();
			}

			return returnResult(originalValue == retypeValue,
					SITE.dictionary[validationMessage], callback);
		};
	};
	
	var emailRegex = /^[^@]+@[^\.@]+\.[^@\.](.*[^@\.])?$/;
	var emailValidator = precheckedAjaxValidator(function(v) {
		return v.match(emailRegex);
	}, "validation-messages-enter-valid-email", "checkEmail", "email");
	
	var usernameValidator;
	if(SITE.override && SITE.override.validateUsername)
		usernameValidator = SITE.override.validateUsername;
	else
		usernameValidator = precheckedAjaxValidator(function(v) {
			return v && v.length > 1;
		}, "validation-messages-username-too-short", "checkUsername", "username");
	
	var passwordValidator = precheckedAjaxValidator(function(v) {
		return v && v.length > 7;
	}, "validation-messages-password-too-short", "checkPassword", "password");
	
	var emailFormatValidator = precheckedAjaxValidator(function(v) {
		return v.match(emailRegex);
	}, "validation-messages-enter-valid-email", "checkEmailFormat", "email");

	var heroesEmailValidator = precheckedAjaxValidator(function(v) {
		return v.match(emailRegex);
	}, "validation-messages-enter-valid-email", "checkEmail", "email");
	
	return {

		validateUsername : usernameValidator,
		validatePassword : passwordValidator,
		validateEmail : emailValidator,
		validateEmailFormat : emailFormatValidator,

		validateRetypePassword : validateRetypeField('validation-messages-reenter-password'),
		validateRetypeEmail : validateRetypeField('validation-messages-reenter-email', true),

		validateName : function(value, callback) {
			if (value.length > 64)
				return returnResult(false,
						SITE.dictionary['validation-messages-nametoolong'],
						callback);
			if (value.length < 2)
				return returnResult(false,
						SITE.dictionary['validation-messages-nametooshort'],
						callback);
			return returnResult(/^([a-zA-Z\u0A00-\u0A7F\\.' -]*)$/i.test(value) && 
					/^([a-zA-Z\u0A00-\u0A7F]+(([\\.']?[ ]?|[-])[a-zA-Z\u0A00-\u0A7F]+)*[\\.]?)$/i
							.test(value),
					SITE.dictionary['validation-messages-enter-nameonly'],
					callback);
		},

		// Validate country is going to be page specific
		validateCountry : function(value, callback) {
			return returnResult(value != "",
					SITE.dictionary['validation-messages-select-country'],
					callback);
		},

		validateOtherPlatform : function(value, callback) {
			return returnResult(
					value != "",
					SITE.dictionary['validation-messages-selection-other-platform'],
					callback);
		},

		validatePostalCode : function(value, country, callback) {
			var message = SITE.dictionary['validation-messages-enter-postalcode'];

			if ((country == "US" || country == "AU" || country == "GB") && value == "") {
				if($("#postalCode-data-row").hasClass("interacted") == false) {
					$("#postalCode-data-row").addClass("initial");
				}
				return returnResult(false, message, callback);
			} else if ((country == "US" || country == "AU" || country == "GB") && value != "") {
				$("#postalCode-data-row").removeClass("initial");
				$("#postalCode-data-row").addClass("interacted");
			} 
			
			if (country == "US") {
				return returnResult(/^\d{5}([\-]\d{4})?$/.test(value), message, callback);
			} else if (country == "AU") {
				return returnResult(/^\d{4}$/.test(value), message, callback);
			} else if (country == "GB") {
				var gbRegex = /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([AZa-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z])))) {0,2}[0-9][A-Za-z]{2})$/;
				return returnResult(gbRegex.test(value), message, callback);
			} else {
				return returnResult(true, message, callback);
			}
		},

		validateRegion : function(value, country, callback) {
			var message = SITE.dictionary['validation-messages-enter-region'];
			if (country == "US") {
				return returnResult(value, message, callback);
			} else {
				return returnResult(true, message, callback);
			}
		},

		validateDOB : function(month, day, year, callback) {
			var message = SITE.dictionary['validation-messages-enter-date'];
			if (month && day && year) {
				year = parseInt(year);
				month = parseInt(month - 1);
				day = parseInt(day);
				date = new Date(year, month, day);
				return returnResult(date.getFullYear() == year
						&& date.getMonth() == month && date.getDate() == day,
						message, callback);
			}
			return returnResult(false, message, callback);
		},

		validateQuestion : function(value, callback) {
			return returnResult(value != "",
					SITE.dictionary['validation-messages-select-question'],
					callback);
		},

		validateAnswer : function(value, callback) {
			return returnResult(value != "",
					SITE.dictionary['validation-messages-enter-answer'],
					callback);
		},

		validateAddress : function(value, callback) {
			return returnResult(!/[!@#\$%\^&\*\(\)\+=\{\}\[\]\|`~<>\?]/.test(value) && value != "",
					SITE.dictionary['validation-messages-enter-address'],
					callback);
		},

		validateAddressLine2 : function(value, callback) {
			return returnResult(!/[!@#\$%\^&\*\(\)\+=\{\}\[\]\|`~<>\?]/.test(value) || value == "",
					SITE.dictionary['validation-messages-enter-address'], callback);
		},

		validateCity : function(value, callback) {
			return returnResult(!/[!@#\$%\^&\*\(\)\+=\{\}\[\]\|`~<>\?]/.test(value) && value != "",
					SITE.dictionary['validation-messages-enter-city'], callback);
		},

		validateCurrentPasword : function(value, callback) {
			return returnResult(value != "", SITE.dictionary['validation-messages-enter-current-password'], callback);
		}, 
		
		validateReenterCurrentPassword : function(value, callback) {
			return returnResult(value != "", SITE.dictionary['validation-messages-reenter-current-password'], callback);
		},

		validateTermsOfService : function(value, callback) {
			return returnResult(value, SITE.dictionary['validation-messages-tos-checked'], callback);
		},

		validateHeroesId : function(value, callback) {
			return returnResult(/^[0-9]+$/.test(value) && value != "", 
				SITE.dictionary['validation.messages.enter.heroesid'], callback);
		},

		validateHeroesEmail : function(value, callback) {
			var isLoggedIn = ssobar.user.isLoggedIn;

			if(isLoggedIn) {
				var accountEmail = $("#register-heroes #email-address").data("value");
				
				if(accountEmail.toLowerCase() != value.toLowerCase()) 
					return returnResult(accountEmail.toLowerCase() == value.toLowerCase(), SITE.dictionary['validation-messages-heroes-email-mismatch'], callback);
				else return returnResult(emailRegex.test(value), SITE.dictionary['validation-messages-enter-valid-email'], callback);
			} else {
				var failureMessage = emailRegex.test(value) ? SITE.dictionary["validation-messages-heroes-email-login"] : SITE.dictionary['validation-messages-enter-valid-email']
				var messageCallback = function(result) {
					if(result.status == "invalid")
						result.exceptionMessageList = [failureMessage];
					callback(result);
				};
				var response = heroesEmailValidator(value, messageCallback);
				
				return response;
			}
		},
		
		validateMobileGameEmail : function(value, callback) {
			var isLoggedIn = ssobar.user.isLoggedIn;
			
			if(isLoggedIn && ssobar.config.siteId != "cod-mobile" && ssobar.config.siteId != "codm" && ssobar.config.siteId != "wzm") {
				var accountEmail = $("#email-address").attr("value");
				
				if(accountEmail.toLowerCase() != value.toLowerCase()) 
					return returnResult(accountEmail.toLowerCase() == value.toLowerCase(), SITE.dictionary['validation-messages-heroes-email-mismatch'], callback);
				else return returnResult(emailRegex.test(value), SITE.dictionary['validation-messages-enter-valid-email'], callback);
			} else {
				var parseFailureMessageForLink = function(text) {
					var getLoginLink = function () {
						var siteId = ssobar.config.siteId;
						var queryValue = SITE.util.getQueryValue("playerId");
						var queryString = (queryValue == null) ? "" : "playerId=" + queryValue;
						var loginUrl = SSO.utility.getBaseUrl() + "/" + siteId + "/loginMobileGame?" + queryString;
						var loginLink = loginUrl;
						
						return loginLink
					}
					
					var cont = $("<div>").append(text);
					$(cont).find("a").attr("href", getLoginLink());
					
					return $(cont).html();
				}
				
				var failureMessage = emailRegex.test(value) ? SITE.dictionary["validation-messages-enter-valid-email-mobilegame"] : SITE.dictionary['validation-messages-enter-valid-email']
				failureMessage = parseFailureMessageForLink(failureMessage);
				
				var messageCallback = function(result) {
					if(result.status == "invalid")
						result.exceptionMessageList = [failureMessage];
					callback(result);
				};
				var response = heroesEmailValidator(value, messageCallback);
				
				return response;
			}
		},
		
		buildPhoneNumberValidator : function($el) {
			var validFormat = function(value) {
				var trimmed = (value || "").trim();
				return !trimmed || $el.intlTelInput("isValidNumber");
			};
			var av = ajaxValidator("checkMobilePhoneNumber", "number");
			var messageKey = "validation-messages-valid-phone-number";
			
			return function(value, callback) {
				var trimmed = (value || "").trim();
				if(!trimmed) {
					//Mobile Number is empty but still valid
					document.getElementById("smsOptIn").checked = false;
					document.getElementById("smsOptIn").disabled = true;
					$("#sms-data-row").css("opacity", "0.4");
					$("#sms-data-row label").css("cursor", "not-allowed");
					return returnValidationResult("valid", [ SITE.dictionary[messageKey] ], callback);
				}
				
				if(validFormat(value)) {
					var formatted = $el.intlTelInput("getNumber");
					//Mobile Number is valid
					document.getElementById("smsOptIn").disabled = false;
					$("#sms-data-row").css("opacity", "1");
					$("#sms-data-row label").css("cursor", "auto");
					return av(formatted, callback);
				} else {
					//Mobile Number is invalid
					document.getElementById("smsOptIn").disabled = false;
					$("#sms-data-row").css("opacity", "1");
					$("#sms-data-row label").css("cursor", "auto");
					return returnValidationResult("invalid", [ SITE.dictionary[messageKey] ], callback);
				}
			};
		},
		
		validateEnableSMS: function(value, phonenumber, callback) {
			var message = SITE.dictionary['validation-messages-enter-phonenumber'];
			if($("#enable-sms").is(":checked")) {
				return returnResult(($("#phoneNumber-data-row").hasClass("validationPassed") && $("#phone-number-display").val().length > 0), message, callback);
			} else {
				return returnResult(true, message, callback);
			}
		},
			
		processValidationResult : function(errorLocation, result) {

			if (result.status == 'valid') {
				$('#' + errorLocation + '-data-row .feedback-control.message').hide();
				$('#' + errorLocation + '-data-row .feedback-control.message').text("");
				$('#' + errorLocation + '-data-row').removeClass("validationError");
				$('#' + errorLocation + '-data-row').addClass("validationPassed");
			} else {
				$('#' + errorLocation + '-data-row .feedback-control.message').show();
				$('#' + errorLocation + '-data-row .feedback-control.message').text("");
				$('#' + errorLocation + '-data-row .feedback-control.message').prepend(result.exceptionMessageList[0] || "");
				$('#' + errorLocation + '-data-row').removeClass("validationPassed");
				$('#' + errorLocation + '-data-row').addClass("validationError");
			}
			return (result.status == 'valid');
		}
	};
})();

SITE.login = {
	initPreregistration: function() {
		var parameters = SSO.utility.urlParameters;
		if("email" in parameters) {
			var email = parameters["email"];
			$("#email-data-row input").val(email);
		}
		if($("#register-heroes").length) 
			SITE.registration.populateHeroesEmail();
	},
	
	initLoginValidation: function() {
		if($(".login-page") && $("input#username").length != 0 && $("input#password").length != 0) {
			var $emailRow = $("#email-data-row");
			var $passRow = $("#password-data-row");
			$("#frmLogin .actions button").click(function(e) {
				e.preventDefault();
				
				var row = "";
				if(SITE.validationFunctions.validateEmailFormat($("#username").val()).status != "valid")
					row = {field: $emailRow, message: SITE.dictionary["validation-messages-enter-valid-email"]};

				if($("input#username").val() == "") row = {field: $emailRow, message: SITE.dictionary["validation-messages-enter-email"]};
				if($("input#password").val() == "") row = {field: $passRow, message: SITE.dictionary["validation-messages-enter-password"]};
				
				if($(".g-recaptcha").length) {
					if(grecaptcha.getResponse() == "") {
						$(".g-recaptcha").addClass("error");
						if(row == "")
							row = {field: $(".g-recaptcha"), message: ""};
					} else {
						$(".g-recaptcha").removeClass("error");
					}
				}
				
				if(row != "") {
					row.field.find(".feedback-control.message").text(row.message).show();
					
					row.field.addClass("has-error");
					//row.field.parent().find(".has-error").find("input").first().focus();
					row.field.parent().find("input").first().focus();
					
					row.field.find("input").on("input", function() {
						$(this).parent().siblings(".feedback-control.message").hide();
						$(this).closest(".data-row").removeClass("has-error");
						$(this).off();
					});
					
					return;
				}
				
				/* START Google Tag Manager - Email Login - "Sign In" Button */
	            dataLayer.push({
	                event: "interaction",
	                category: "interaction",
	                action: "sign in",
	                label: "email"
	            });
	            /* END Google Tag Manager - Email Login - "Sign In" Button */
				
				$("#frmLogin").submit();
			});
		}
	},
	
	init: function() {
		this.initPreregistration();
		this.initLoginValidation();
	}
}

SITE.registerEmail = {
	init: function() {
		this.initValidation();
	},
	
	initValidation: function() {
		this.stopFormSubmit();
	},
	
	stopFormSubmit: function() {
		$("#register-email #register-full").submit(function(e) {
			if($("#register-full .data-row").hasClass("validationPassed"))
				return;
			
			e.preventDefault();
		});
	}
}

SITE.unlinkModal = {
	unlinkSteps: {
		"SUCCESS": "success",
		"TIME_LOCK": "time-lock",
		"ISSUE_WARNING": "issue-warning",
		"OPEN_TICKET": "open-ticket",
		"UNDER_REVIEW": "under-review",
		"ACTIVE_ENFORCEMENT": "active-enforcement",
		"UNAUTHORIZED": "unauthorized",
		"SYSTEM_ERROR": "system-error",
		"TWENTY_FOUR_HOUR": "twentyfour-hour"
	},
	
	accountTypes: ["xbl", "psn", "battle"],

	parseUnlinkingResponse: function($uc, accountType, data) {
		$uc.data("provider", accountType);
		
		this.cleanAccountLinkingState($uc);
		
		if(data == "OPEN_TICKET") {
			
			//TEMP
			
			$uc.find(".contact-cs").removeClass("hidden");
			$uc.find(".contact-cs > p").removeClass("hidden");
			$uc.find(".contact-cs > p > a").removeClass("hidden");
			$uc.find(".contact-cs > h3").removeClass("hidden");
			
			// set form handlers to verify that the form is filled out
			/**
			$.get(SSO.utility.getApiUrl() + "/openTicket/" + accountType)
				.success(function(d) {
					SITE.unlinkModal.parseOpenTicketRequestResponse($uc, d);
					$uc.find(".open-ticket .step-1").find(".hidden").removeClass("hidden");
					$uc.find(".open-ticket .step-1").removeClass("hidden");
					
				}).error(function() {
					
				});
			**/
		}
		
		this.showUnlinkStep($uc, data);

		SITE.unlinkModal.accountTypes.forEach(function(account) {
			$("." + SITE.unlinkModal.unlinkSteps[data]).find("." + account + "-platform-name").addClass("hide");
		});

		$("." + SITE.unlinkModal.unlinkSteps[data]).find("." + accountType + "-platform-name").removeClass("hide");
		
		//special cases
		if(data == "ISSUE_WARNING") {
			$uc.find(".checkbox").removeClass("hidden");
		}
		
		if(data == "TIME_LOCK") {
			$uc.find(".time-lock .hidden").removeClass("hidden");
		}
		
		if(data == "ACTIVE_ENFORCEMENT") {
			$uc.find(".active-enforcement .hidden").removeClass("hidden");
		}
		
		if(data == "TWENTY_FOUR_HOUR") {
			$uc.find(".twentyfour-hour .step-1").find(".hidden").removeClass("hidden");
			$uc.find(".twentyfour-hour .step-1").removeClass("hidden");
		}
	},
	
	parseOpenTicketRequestResponse: function($uc, data) {
		var resp = JSON.parse(data);
		
		if(resp.success == "false") return;
		
		var $ot = $uc.find(".open-ticket");
		
		//build and set localelist
		var locList = resp.localeList;
		
		if(locList != undefined) {
			var $localeSel = $ot.find("#locale-data-row select")
			$localeSel.empty();
			for(var locale in locList) {
				if(!locList.hasOwnProperty(locale)) continue;
				$localeSel.append($("<option>", {
					val: locale
				}).html(locList[locale]));
			}
			
			//default locale for ticket
			var otloc = ssobar.locale || config.locale;
			
			//sets locale based on language to aid psn's limited list
			if(typeof otloc != "undefined") {
				var lang = otloc.split("_")[0];
				var tempLoc;
				
				for(var loc in locList) {
					if(!locList.hasOwnProperty(loc)) continue;
					if(loc.split("_")[0].match(lang))
						tempLoc = loc;
					if(loc.match(otloc)) {
						tempLoc = otloc;
						break;
					}
				}
				
				otloc = tempLoc;
			}
			
			if (typeof locList[otloc] == "undefined")
				otloc = "en_US";
			
			$localeSel.val(otloc);
			
			$localeSel.siblings("span").remove();
			$localeSel.customStyle();
			
			$localeSel.val(otloc);
		}
		
		$ot.find("#unlink-platform").val(resp.platform);
	},

	unlinkingResponseFailed: function($uc) {
		this.cleanAccountLinkingState($uc);
		this.showError($uc);
	},

	loadUnlinkModal: function() {
		$that.data("pending", "false");

		$unlink.modal({
			minHeight: "450px",
			onClose: function () {$unlink.find("h3").addClass("hidden"); $.modal.close();}
		});
	},

	cleanAccountLinkingState: function($uc) {
		$uc.find("h3").addClass("hidden");	//title
		$uc.find("h2").addClass("hidden");	//subtitle
		$uc.find("div").addClass("hidden");	//copy
		$uc.find("a").addClass("hidden"); 	//buttons
	},
	
	showUnlinkStep: function($uc, step) {
		var stepClass = SITE.unlinkModal.unlinkSteps[step];
		$uc.find("." + stepClass).removeClass("hidden");
		$uc.find("." + stepClass + " > h3").removeClass("hidden");
		$uc.find("." + stepClass).find("button").show();
		
		if(step == "ISSUE_WARNING") {
			var chkbox = $uc.find("." + stepClass).find("#confirm-unlink-checkbox");
			var btn = $uc.find("." + stepClass).find(".unlink-button");
			
			chkbox.click(function(e) {				
				if (chkbox.prop("checked") == true) {	
					btn.prop('disabled', false);				
				} else {	
					btn.prop('disabled', true);				
				}
			});
		}
	},

	showError: function($uc, accountType) {
		this.parseUnlinkingResponse($uc, accountType, "SYSTEM_ERROR");
	}
};

SITE.registration = {

	// Plug in an array of fields to monitor, an array of extra fields, a
	// validation function, and a key
	genericMultiFieldChecker : function($el, $ex, validator, key, initValid, usePresentVal) {
		var i, stored = [], valid = initValid ? true : false;
		var forcedCheck = false;

		for (i = 0; i < $el.length; i++)
			stored[i] = usePresentVal ? $el[i].val() : "";

		return {
			check : function(async) {
				var val, doValidate = false, arg = [];
				for (i in $el) {
					if($el[i].hasOwnProperty("getForceCheck"))
						forcedCheck = $el[i].getForceCheck();
					val = $el[i].val();
					arg.push(val);
					if (val != stored[i] || forcedCheck) {
						forcedCheck = false;
						stored[i] = val;
						doValidate = true;
					}
				}
				for (i in $ex)
					arg.push($ex[i].val());

				if (doValidate) {
					if (async) {
						arg.push(function(r) {
							valid = (r.status == "valid");
							SITE.validationFunctions.processValidationResult(key, r);
							
							if (key == "email" && valid) {
								emailVal = $("#email-address").val();								
								if (emailVal.endsWith(".com") || emailVal.endsWith(".net") || emailVal.endsWith(".org") || emailVal.endsWith(".edu")) {										
									if($("#password").length > 0) {
										//$("#password").focus();
										//$("#password-data-row").get(0).scrollIntoView();										
									}									
								}
							}
						});
						validator.apply(this, arg);
					} else
						valid = (validator.apply(this, arg).status == "valid");
				}
				return valid;
			},
			isValid : function() {
				return valid;
			}
		};
	},

	// For one field
	genericFieldChecker : function($el, validator, key, initValid, usePresentVal) {
		return SITE.registration.genericMultiFieldChecker([ $el ], [], validator, key, initValid, usePresentVal);
	},

	initPageErrors : function() {
		// handle errors on forms
		$('.form-validation-error').each(function() {
			var i = this.id;
			i = i.split(".");
			i = $('#' + i[0] + '-data-row');
			i.addClass('error');

			if (!i.hasClass('.data-row')) {
				$(i).parent('.data-row').addClass('error');
			}
		});

		// beachhead page image errors
		$('.account-avatar').error(function() {
			this.src = '/resources/elite/images/default-beachhead.png';
		});

		// Profile page error handler
		$('#player-gravatar').error(function() {
			$(this).hide();
		});
	},

	postalCodeChecker : function() {
	
		var $country = $('select#country');
		if (!$country.length)
			return;

		var $state = $('#state'),
			$stateData = $('#state-data-row'),
			$regionData = $('#region-data-row'),
			$stateCustomSelect = $('#state + .customStyleSelectBox'), 
			$postal = $('#postalCode-data-row'),
			$postalCodeUsa = $('#postalCodeUsa'),
			$postalCodeAu = $('#postalCodeAu'),
			$postalCodeUk = $('#postalCodeUk'), 
			$input = $postal.find('input');

		function handleCountryChange() {
			var selectedCountry = $country.val();
			SSO.utility.log($postalCodeUsa);
			if (selectedCountry === 'US') {
				$stateCustomSelect.fadeIn(function() {
					$state.show();
				});
				$regionData.show();
				// $stateData.show();
				$postalCodeUsa.show();
				$postalCodeAu.hide();
				$postalCodeUk.hide();
				$postal.fadeIn();
				SITE.util.adjustHeightOfSelect();
				
				//show Phone Number when US is selected
				//$("#register-full #phoneNumber-data-row, #register-full #sms-data-row, .phoneNumber.personalInfo, .contactUpdateMobile").fadeIn();
			} else {
				$stateCustomSelect.fadeOut(function() {
					$regionData.hide();
				});
				// $stateData.hide();
				$regionData.hide();
				//$("#register-full #phoneNumber-data-row, #register-full #sms-data-row, .phoneNumber.personalInfo, .contactUpdateMobile").fadeOut();

				if (selectedCountry === 'AU') {
					$postalCodeUsa.hide();
					$postalCodeUk.hide();
					$postalCodeAu.show();
					$postal.fadeIn();
				} else if (selectedCountry === 'GB') {
					$postalCodeUsa.hide();
					$postalCodeAu.hide();
					$postalCodeUk.show();
					$postal.fadeIn();
				} else {
					$input.val('');
					$postal.fadeOut();
				}
			}
		}

		$country.on('change', handleCountryChange);
		handleCountryChange();
	},

	// account switcher on identities page
	initAccountSwitcher : function() {
		$("#nav-gaming").click(function(e) {
			e.preventDefault();
			$(this).find('a').addClass('active');
			$("#nav-social a").removeClass('active');
			$("#gaming-accounts").removeClass('hide');
			$("#social-accounts").addClass('hide');
		});
		$("#nav-social").click(function(e) {
			e.preventDefault();
			$(this).find('a').addClass('active');
			$("#nav-gaming a").removeClass('active');
			$("#social-accounts").removeClass('hide');
			$("#gaming-accounts").addClass('hide');
		});
	},
	
	initAccountLinking: function () {
		var xBoxLinked = false, psnLinked = false, steamLinked = false, battleLinked = false, epicLinked = false;

		$(".account-linking-container .account-linking").click(function(e) {
			var $target = $(e.target);
				
			if ($target.closest(".preference-edit").length) {
				$target.parent().find(".preference-menu").toggle();
			} else { 
				e.preventDefault();
				
				if(SITE.secureSession.isRequired($target) && !SITE.secureSession.isEstablished()) {
					SITE.secureSession.init();
					return;
				}
				
				
				if ($target.closest(".xbl:not(.linked) .account-container .account-link").length) {
					var $focusedOriginEl = $(':focus');
					var href = $('#xblLinkAnchor').attr('href');
					var locale = SITE.core.getLocale();
	
					if(locale && (locale != "" || locale != "en_US")) {
						$('#xblLinkAnchor').attr("href", href + "&mkt=" + locale);
	
						$('.gaming.account-modal-container .xbox').modal({
							overlayClose : true,
							//minHeight : 260,
							onShow : function(dialog) {
								SITE.accessibility.handleModalTabbable(dialog);								
								if (!xBoxLinked) {
									xBoxLinked = true;
								}
							},
							onClose: function () {
								$focusedOriginEl.focus();
								$.modal.close();
							}
						});
					}
				} else if ($target.closest(".psn:not(.linked) .account-container .account-link").length) {
					var $focusedOriginEl = $(':focus');
					$('.gaming.account-modal-container .psn').modal({
						overlayClose : true,
						//minHeight : 300,
						onShow : function(dialog) {
							SITE.accessibility.handleModalTabbable(dialog);							
							if (!psnLinked) {
								psnLinked = true;
							}
						},
						onClose: function () {
							$focusedOriginEl.focus();
							$.modal.close();
						}
					});
				} else if ($target.closest(".battle:not(.linked) .account-container .account-link").length) {
					var $focusedOriginEl = $(':focus');
					$('.gaming.account-modal-container .battle').modal({
						overlayClose : true,
						//minHeight : 300,
						onShow : function(dialog) {
							SITE.accessibility.handleModalTabbable(dialog);
							if (!battleLinked) {
								battleLinked = true;
							}
						},
						onClose: function () {
							$focusedOriginEl.focus();
							$.modal.close();
						}
					});
				} else if ($target.closest(".epic:not(.linked) .account-container .account-link").length) {
					var $focusedOriginEl = $(':focus');
					$('.gaming.account-modal-container .epic').modal({
						overlayClose : true,
						//minHeight : 300,
						onShow : function(dialog) {
							SITE.accessibility.handleModalTabbable(dialog);
							if (!epicLinked) {
								epicLinked = true;
							}
						},
						onClose: function () {
							$focusedOriginEl.focus();
							$.modal.close();
						}
					});
				} else if ($target.closest(".steam:not(.linked) .account-container .account-link").length) {
					var $focusedOriginEl = $(':focus');
					$('.gaming.account-modal-container .steam').modal({
						overlayClose : true,
						//minHeight : 300,
						onShow : function(dialog) {
							SITE.accessibility.handleModalTabbable(dialog);
						},
						onClose: function () {
							$focusedOriginEl.focus();
							$.modal.close();
						}
					});
				} else if ($target.closest(".nintendo:not(.linked) .account-container .account-link").length) {
					var $focusedOriginEl = $(':focus');
					$('.gaming.account-modal-container .nintendo').modal({
						overlayClose : true,
						//minHeight : 300,
						onShow : function(dialog) {
							SITE.accessibility.handleModalTabbable(dialog);
						},
						onClose: function () {
							$focusedOriginEl.focus();
							$.modal.close();
						}
					});
				} else if ($target.closest(".facebook:not(.linked) .account-container .account-link").length) {
					var $focusedOriginEl = $(':focus');
					$('.social.account-modal-container .facebook').modal({
						overlayClose : true,
						//minHeight : 260,
						onShow : function(dialog) {
							SITE.accessibility.handleModalTabbable(dialog);
						},
						onClose: function () {
							$focusedOriginEl.focus();
							$.modal.close();
						}
					});
				} else if ($target.closest(".twitter:not(.linked) .account-container .account-link").length) {
					var $focusedOriginEl = $(':focus');
					$('.social.account-modal-container .twitter').modal({
						overlayClose : true,
						//minHeight : 260,
						onShow : function(dialog) {
							SITE.accessibility.handleModalTabbable(dialog);
						},
						onClose: function () {
							$focusedOriginEl.focus();
							$.modal.close();
						}
					});
				} else if ($target.closest(".twitch:not(.linked) .account-container .account-link").length) {
					var $focusedOriginEl = $(':focus');
					$('.social.account-modal-container .twitch').modal({
						overlayClose : true,
						//minHeight : 260,
						onShow : function(dialog) {
							SITE.accessibility.handleModalTabbable(dialog);
						},
						onClose: function () {
							$focusedOriginEl.focus();
							$.modal.close();
						}
					});
				} else if ($target.closest(".youtube:not(.linked) .account-container .account-link").length) {
					var $focusedOriginEl = $(':focus');
					$('.social.account-modal-container .youtube').modal({
						overlayClose : true,
						//minHeight : 260,
						onShow : function(dialog) {
							SITE.accessibility.handleModalTabbable(dialog);
						},
						onClose: function () {
							$focusedOriginEl.focus();
							$.modal.close();
						}
					});
				} else if ($target.closest(".amazon:not(.linked) .account-container .account-link").length) {
					var $focusedOriginEl = $(':focus');
					$('.social.account-modal-container .amazon').modal({
						overlayClose : true,
						//minHeight : 260,
						onShow : function(dialog) {
							SITE.accessibility.handleModalTabbable(dialog);
						},
						onClose: function () {
							$focusedOriginEl.focus();
							$.modal.close();
						}
					});
				}
			}
		});

		$(".linked .account-link").click( function (e) {
			e.preventDefault();
			e.stopImmediatePropagation();
			var gamingAccounts = ["psn", "xbl", "battle", "steam", "nintendo"];
			var socialAccounts = ["facebook", "twitter", "twitch", "youtube", "amazon"];
			var $accountLinks = $(".account-linking-container").find(".account-link");
			
			var $target = $(e.target);
			var accountType = $target.parents("li").attr("class").split(" ")[0];
			var $unlink = $("#unlink-account-modal");
			
			if(SITE.secureSession.isRequired($target) && !SITE.secureSession.isEstablished()) {
				SITE.secureSession.init();
				return;
			}
			
			var pending = false;
			$accountLinks.each(function() {
				if($(this).data("pending") == "true")
					pending = true;
			})
			
			if(pending)
				return;
			
			if(gamingAccounts.includes(accountType)) {
				var $that = $(this);	
				$that.data("pending", "true");
				
				$.get(SSO.utility.getApiUrl() + "/unlinkableCheck/" + accountType)
					.success( function(d) {
						$unlink.find(".unlink-title").removeClass("hidden");
						if (d && d.status === "error") {
							SITE.unlinkModal.parseUnlinkingResponse($unlink, accountType, "SYSTEM_ERROR");
						} else {
							SITE.unlinkModal.parseUnlinkingResponse($unlink, accountType, d.data);
						}
					}).error(function() {
						SITE.unlinkModal.unlinkingResponseFailed($unlink);
					}).complete(function() {
						$unlink.find(".button").hide();
						var $focusedOriginEl = $(':focus');
						$unlink.modal({
							minHeight: "450px",
							overlayClose: true,
							onShow: function(dialog) {							
								SITE.accessibility.handleModalTabbable(dialog);
							},
							onClose: function () {
								SITE.unlinkModal.cleanAccountLinkingState($unlink);
								$unlink.find("h3").addClass("hidden"); 
								$.modal.close();
								$that.data("pending", "false");
								$focusedOriginEl.focus();
							}
						});
					});
			} else if (socialAccounts.includes(accountType)) {
				var href = SITE.core.apiUrl + "/profile?action=deregister&accountType=" + accountType;
				SITE.unlinkModal.cleanAccountLinkingState($unlink);
				
				$unlink.find(".no-unlink-available").hide();
				$unlink.find(".button").attr("href", href).show();
				
				$unlink.find("h3").addClass("hidden");
				$unlink.find("." + accountType).removeClass("hidden");
				var $focusedOriginEl = $(':focus');
				$unlink.modal({
					height: "200px",
					minHeight: "200px",
					overlayClose : true,
					onShow : function(dialog) {
						SITE.accessibility.handleModalTabbable(dialog);
					},
					onClose: function () {
						$unlink.find("h3").addClass("hidden"); 
						$.modal.close();
						$focusedOriginEl.focus();
					}
				});
			} else {
				var href = SITE.core.apiUrl + "/profile?action=deregister&accountType=" + accountType;
				SITE.unlinkModal.cleanAccountLinkingState($unlink);
				
				$unlink.find(".button").attr("href", href);

				if(accountType == "psn" || accountType == "xbl" || accountType == "battle" || accountType == "steam" || accountType == "nintendo") {
					$unlink.find(".no-unlink-available").show();
					$unlink.find(".button").attr("href", "#").hide();
				} else {
					$unlink.find(".no-unlink-available").hide();
					$unlink.find(".button").attr("href", href).show();
				}
				
				$unlink.find("h3").addClass("hidden");
				$unlink.find("." + accountType).removeClass("hidden");
				var $focusedOriginEl = $(':focus');
				$unlink.modal({
					height: "200px",
					minHeight: "200px",
					overlayClose : true,
					onShow : function(dialog) {
						SITE.accessibility.handleModalTabbable(dialog);
					},
					onClose: function () {
						$unlink.find("h3").addClass("hidden"); 
						$.modal.close();
						$focusedOriginEl.focus();
					}
				});
			}
		});
		
		$("#unlink-account-modal .unlink-button").click(function(e) {
			e.preventDefault();
			var $unlinkModal = $("#unlink-account-modal");
			var provider = $unlinkModal.data("provider");
			
			if(!$("#unlink-account-modal").find(".checkbox input").is(":checked"))
				return;
			
			$.get(SSO.utility.getApiUrl() + "/unlink/" + provider)
				.success(function(d) {
					if(d.data.unlinked) {
						//show success screen, but trigger page refresh once they hit continue
						SITE.unlinkModal.parseUnlinkingResponse($unlinkModal, provider, "SUCCESS");
						
						$unlinkModal.parent().parent().find(".simplemodal-close").click(function(e) {
							e.preventDefault();
							e.stopPropagation();
							
							window.location.reload(true);
						})
					} else {
						//show open-ticket
						SITE.unlinkModal.unlinkingResponseFailed($unlinkModal);
					}
						
				}).error(function() {
					SITE.unlinkModal.unlinkingResponseFailed($unlinkModal);
				});
		});
		
		$("#unlink-account-modal .open-ticket-button").click(function(e) {
			e.preventDefault();
			
			if($("#unlink-account-modal .open-ticket-button").data("pending") == true)
				return;
			
			$("#unlink-account-modal .open-ticket-button").data("pending", true);
			
			var $uc = $("#unlink-account-modal");
			var provider = $uc.data("provider");
			var $ucForm = $uc.find("form");
			
			var hasErrors = false;
			
			if($ucForm.find("#unlink-platform").val() == "")
				$ucForm.find("#unlink-platform").val(provider);
			
			if($ucForm.find("#unlink-email").val() == "") {
				hasErrors = true;
				$ucForm.find("#unlink-email").parents(".data-row-container").addClass("error")
				//highlight field
			} else {
				$ucForm.find("#unlink-email").parents(".data-row-container").removeClass("error")
			}

			if($ucForm.find("#unlink-selectedLocale").val() == "") {
				hasErrors = true;
				$ucForm.find("#unlink-selectedLocale").parents(".data-row-container").addClass("error")
				//highlight field
			} else {
				$ucForm.find("#unlink-selectedLocale").parents(".data-row-container").removeClass("error")
			}
			
			if($ucForm.find("#unlink-description").val() == "") {
				hasErrors = true;
				$ucForm.find("#unlink-description").parents(".data-row-container").addClass("error")
				//highlight field
			} else {
				$ucForm.find("#unlink-description").parents(".data-row-container").removeClass("error")
			}
			
			if(!hasErrors)
				$.post(SSO.utility.getApiUrl() + "/openTicket", $ucForm.serialize()).success(function(d) {
					var resp = JSON.parse(d);
					if(resp.success) {
						$uc.find(".open-ticket .step-1").addClass("hidden");
						$uc.find(".open-ticket .step-2").removeClass("hidden");
					}
				}).complete(function() {
					$("#unlink-account-modal .open-ticket-button").data("pending", false);
				});
		})
		
		$("#unlink-account-modal .twentyfour-hour-button").click(function(e) {
			e.preventDefault();
			
			var $unlinkModal = $("#unlink-account-modal");
			var provider = $unlinkModal.data("provider");
			
			$.get(SSO.utility.getApiUrl() + "/unlink/" + provider)
				.success(function(d) {
					if(d.data.unlinked) {
						//show success screen, but trigger page refresh once they hit continue
						SITE.unlinkModal.parseUnlinkingResponse($unlinkModal, provider, "SUCCESS");
						
						$unlinkModal.parent().parent().find(".simplemodal-close").click(function(e) {
							e.preventDefault();
							e.stopPropagation();
							
							window.location.reload(true);
						})
					} else {
						//show open-ticket
						SITE.unlinkModal.unlinkingResponseFailed($unlinkModal);
					}
						
				}).error(function() {
					SITE.unlinkModal.unlinkingResponseFailed($unlinkModal);
				});
		});
	},

	errorMessageToTooltip : function(error, element) {
		var errorMsg = error.text();

		if (errorMsg) {
			var fieldId = $(element[0]).attr('name');
			SITE.registration.createErrorTooltip(errorMsg, fieldId, element);
		}
	},

	highlightFieldIcon : function(name) {
		name += '-data-row';
		var obj = document.getElementById(name);
		obj.setAttribute('class', 'data-row ' + SITE.constants.STYLE_CLASS_FOR_ERROR);
	},

	createErrorTooltip : function(message, elementName, element) {
		var errorIconSelector = '#' + elementName
				+ '-data-row.validationError .feedback-control.icon', errorMessageSelector = '#'
				+ elementName
				+ '-data-row.validationError .feedback-control.message', $dob = $(
				element).closest('#dob-data-row');

		if (typeof message === 'object') {
			message = message[0];
		}

		if (!$dob.length) {
			$(errorMessageSelector).html(message).show();
		} else {
			$('#dob-error-feedback').html(message).show();
		}

	},

	// Handle Form Submits on Profile Page
	profileFormSubmit : function(form, successCallback, submitButton) {

		var $form = $(form);

		if (submitButton) {
			submitButton.attr('disabled', 'disabled');
		}

		var $phoneNumber = $("#phone-number");
		var $phoneNumberDisplay = $("#phone-number-display");
		if(($phoneNumberDisplay.val() || "").trim()) {
			$phoneNumber.val($phoneNumberDisplay.intlTelInput("getNumber"));
			if($(".nophone").length > 0){
				$(".nophone").removeClass("nophone");
			}
		} else {
			$phoneNumber.val("");
		}
				
		$.ajax({
			headers: SSO.csrf.getCSRFObj(),
			url : $form.attr('action'),
			type : $form.attr('method'),
			dataType : 'json',
			data : $form.serialize(),
			success : function(data) {
				if (data.status === 'error') {
					for ( var error in data.errors) {
						if (typeof error != 'undefined') {
							if (error === 'form') {
								// place error directly on form
								$form.find('.personalInfoForms').prepend(
										data.errors.form[0]);
							} else {
								SITE.registration.highlightFieldIcon(error);
								SITE.registration.createErrorTooltip.call(this,
										data.errors[error], error);
							}
						}
					}
				} else {
					successCallback();
				}
				submitButton && submitButton.removeAttr('disabled');
			}
		});
	},

	submitRegistrationForm : function() {
		// Trim trailing spaces on text fields
		$('#first-name').val($.trim($('#first-name').val()));
		$('#last-name').val($.trim($('#last-name').val()));
		$('#email-address').val($.trim($('#email-address').val()));
		$('#forum-name').val($.trim($('#forum-name').val()));

		var $phoneNumber = $("#phone-number");
		var $phoneNumberDisplay = $("#phone-number-display");
		if(($phoneNumberDisplay.val() || "").trim()) {
			$phoneNumber.val($phoneNumberDisplay.intlTelInput("getNumber"));
		} else {
			$phoneNumber.val("");
		}
		
		// Submit the form
		$('#register-full').submit();
	},

	submitMissingInformationForm : function() {
		$('#forum-name').val($.trim($('#forum-name').val()));

		// Submit the form
		$('#register-missing').submit();
	},

	submitHeroesRegistrationForm: function() {
		$('#email-address').val($.trim($('#email-address').val()));
		$('#heroesId').val($.trim($('#heroesId').val()));

		$('#register-heroes').submit();
	},

	// TODO: Are either highlightField/unhighlightField used?
	highlightField : function(element, errorClass, validClass) {
		var name = $(element).attr('name'), $dob = $(element).closest(
				'#dob-data-row');

		$('#' + name + '-data-row').addClass(errorClass);
		if ($dob.hasClass(validClass))
			$dob.addClass(errorClass);
	},

	unhighlightField : function(element, errorClass, validClass) {
		var $name = $('#' + $(element).attr('name') + '-data-row'), $dataRow = $(
				element).closest('.data-row');

		$name.removeClass(errorClass).addClass(validClass);

		if (($dataRow.attr('id') != 'email-data-row')
				|| $(".sso-message").length == 0) {
			$name.find('.feedback-control.message').hide().html('');
		}

		if ($dataRow.attr('id') !== 'dob-data-row')
			return;

		$dataRow.children('.' + errorClass).each(function() {
			var $this = $(this);
			SITE.registration.regValidator.element($this.find('select'));
		});
		if ($dataRow.find('.' + errorClass).length)
			return;
		$('#dob-error-feedback').hide().html('');
	},

	eligibleForMarketing : function() {
		// TODO: extend so same logic works on Profile and More Information Page
		var year = parseInt($('#DateOfBirth_Year').val()), month = parseInt($(
				'#DateOfBirth_Month').val() - 1), day = parseInt($(
				'#DateOfBirth_Day').val()), country = $('select#country').val()
				|| 'Default', min_age = country === 'US' ? 13
				: parseInt(SITE.EUAgeGates[country]
						|| SITE.EUAgeGates['Default']), userDate = new Date(
				(year + min_age), month, day), currentDate = new Date();

		// if younger than min_age, adding min_age years to their time
		// will make it greater than today's date
		return (userDate.getTime() - currentDate.getTime()) < 0;
	},

	wireNewsletter : function() {
		var $form = $('#account-profile-subscription'), $success = $('<div class="subscription-success"> '
				+ SITE.dictionary['subscription-success'] + '</div>');

		// Create loading indicator
		SITE.loadingIndicator.addTo($form);

		function displaySuccess() {
			$success.appendTo($form).fadeIn(500, function() {
				setTimeout(function() {
					$success.fadeOut('slow');
				}, 1000);
			});
		}

		$(".checkbox-newsletter").click( function(e) {
			var $this = $(this), 
				checked = this.checked, 
				action = checked ? 'subscribe' : 'unsubscribe';

			if ($this.attr('disabled'))
				return;

			$success.hide();
			SITE.loadingIndicator.show();

			$this.attr('disabled', 'disabled');
			
			$.ajax({
				url : $form.attr('action'),
				headers: SSO.csrf.getCSRFObj(),
				type : 'post',
				dataType : 'json',
				data : {
					'id' : $this.val(),
					'action' : action
				},
				success : function(data) {
					// $this.fadeTo(2000, 1);
					$this.removeAttr('disabled');

					if (data.status !== 'success') {
						// reset checkbox
						$this.attr('checked', !checked);
					}

					displaySuccess();
					SITE.loadingIndicator.hide();
				},
				error : function() {
					// $this.fadeTo(2000, 1);
					$this.removeAttr('disabled');

					// reset checkbox
					$this.attr('checked', !checked);

					SITE.loadingIndicator.hide();
				}
			});

			// Update static fields on page
			$('.inline .checkbox-label').html('some new text - thanks for opting in');
		});
	},

	initRegistration : function() {
		var vf = SITE.validationFunctions;
		var gfc = SITE.registration.genericFieldChecker;
		var gmfc = SITE.registration.genericMultiFieldChecker;
		var checkers = {}, passwordCheckers = {};
		
		// jaz, where should this go?
		var phoneNumberDataRow = $("#phoneNumber-data-row");

		var countryProxy = SITE.util.buildProxy($("#country"), "change");
		var monthProxy = SITE.util.buildProxy($('#DateOfBirth_Month'), 'change');
		var dayProxy = SITE.util.buildProxy($('#DateOfBirth_Day'), 'change');
		var yearProxy = SITE.util.buildProxy($('#DateOfBirth_Year'), 'change');
		var termsOfServiceProxy = SITE.util.buildCheckboxProxy($('#terms-of-service'), "change"); 
		var enableSMSProxy = SITE.util.buildCheckboxProxy($("#enable-sms"), "change", true);
		
		if ($("#email-address").length)
			checkers.email = gfc($('#email-address'), vf.validateEmail, "email");
		if ($("#retype-email-address").length)
			checkers.retypeEmail = gmfc([ $('#retype-email-address') ], [ $('#email-address') ],
					vf.validateRetypeEmail, "retypeEmail");

		if ($("#first-name").length)
			checkers.firstname = gfc($('#first-name'), vf.validateName, "firstName");
		if ($("#last-name").length)
			checkers.lastname = gfc($('#last-name'), vf.validateName, "lastName");
		if ($("#phone-number-display").length) {
			var $phoneNumber = $("#phone-number");
			var $phoneNumberDisplay = $("#phone-number-display");
			if($phoneNumber.val()) $phoneNumberDisplay.val($phoneNumber.val());
			var preferred = ($phoneNumberDisplay.attr("data-preferred-countries") || "").trim().split(/\s*,\s*/);
			$phoneNumberDisplay.intlTelInput({
				utilsScript: "../resources/common/scripts/intlTelInput/utils.js",
				preferredCountries: preferred
			});
			checkers.phoneNumber = gfc($phoneNumberDisplay, vf.buildPhoneNumberValidator($phoneNumberDisplay), "phoneNumber", true);
		}
		
		if($("#enable-sms").length) {
			checkers.enableSMS = gmfc([ enableSMSProxy ], [ $("#phone-number-display") ],
				vf.validateEnableSMS, "sms", true);
		}
		
		var countryField = $("#country");
		if(phoneNumberDataRow) {
			var updatePhoneRowOnCountryChange = function() {
				if(countryField.val() == "US") {
					phoneNumberDataRow.fadeIn();
				} else {
					phoneNumberDataRow.fadeOut();
				}
			}
			countryField.on("change", updatePhoneRowOnCountryChange);
			updatePhoneRowOnCountryChange();
		}
		if ($("#country").length)
			checkers.country = gfc(countryProxy, vf.validateCountry, "country");
			
		var forumNameError = $("#forum-name").parents(".data-row").find(".feedback-control.message").text().length > 0;
		if ($("#forum-name").length)
			checkers.username = gfc($('#forum-name'), vf.validateUsername, "userName", false, forumNameError);
			
		if ($("#username").length)
			checkers.username = gfc($('#username'), vf.validateUsername, "username", false, false);
	
		if ($("#postal-code").length)
			checkers.postalCode = gmfc([ $("#postal-code"), countryProxy ], [], vf.validatePostalCode, "postalCode");
		if ($("#DateOfBirth_Month").length)
			checkers.dateOfBirth = gmfc([ monthProxy, dayProxy, yearProxy ], [], vf.validateDOB, "dob");

		if ($("#password").length)
			passwordCheckers.password = gfc($('#password'), vf.validatePassword, "password");
		if ($("#retype-password").length)
			passwordCheckers.retypePassword = gmfc([ $("#retype-password") ],
					[ $("#password") ], vf.validateRetypePassword, "retypePassword");
		if($("#reenterPasswordUsername").length)
			passwordCheckers.password = gfc($("#reenterPasswordUsername"), vf.validateReenterCurrentPassword, "password");
		if($("#terms-of-service").length)					
			checkers.termsOfService =  gfc(termsOfServiceProxy, vf.validateTermsOfService, "termsOfService");

		if($("#heroesId").length) {
			checkers.heroesId = gfc($('#heroesId'), vf.validateHeroesId, 'heroesId');
			checkers.email = gfc($('#email-address'), vf.validateHeroesEmail, 'email');
		}
		
		if($("#playerId").length) {
			checkers.email = gfc($('#email-address'), vf.validateMobileGameEmail, 'email');
		}
		
		//Password field - show/hide password toggle
		if($(".visibility-toggle").length) {
			$(".visibility-toggle").on("click keydown", function(e) {
				var keycode = e.keyCode ? e.keyCode : e.which;
				if ((keycode == '13' || keycode == '32' || keycode == '1')) { 
					e.preventDefault();
					var thisPassword = $(this).siblings("input#password");
					var inputType = thisPassword.attr("type");

					if (inputType === "password") {
						thisPassword.attr("type", "text");

					} else {
						thisPassword.attr("type", "password");
					}
					$(this).toggleClass("visible");
				}
			});
		}

		var button = $('button.submit');

		var doCheck = function() {
			var allValid = true;
			for ( var c in checkers) {
				checkers[c].check(true);
				allValid = allValid && checkers[c].isValid();
			}
			if ($('#facebookId').length > 0 || $("#reenterPasswordUsername-data-row").length > 0 || $("#register.mobile-game").length > 0) {
				for ( var c in passwordCheckers) {
					passwordCheckers[c].check(true);
					allValid = allValid && passwordCheckers[c].isValid();
				}
			}

			if ($('.g-recaptcha').length && allValid) {
				allValid = grecaptcha.getResponse() != "";
			}

			if (allValid) {
				button.removeAttr('disabled');
				button.removeClass('disabled');
			} else {
				if (!button.hasClass('disabled'))
					button.addClass('disabled');
			}
			return allValid;
		};

		var setupClickHandler = function(submitFunction) {
			button.click(function(e) {
				e.preventDefault();
				if (doCheck(false))
					submitFunction();
				return false;
			});
		};

		if ($('#register-full').hasClass('registration')) {
			SITE.registration.disableSubmitButton($('#register-full'));
			setInterval(function() {
				doCheck();
//				if (SITE.registration.eligibleForMarketing()) {
//					SITE.registration.enableNewsletter();
//				} else {
//					SITE.registration.disableNewsletter();
//				}
			}, 500);
			setupClickHandler(SITE.registration.submitRegistrationForm);
		} else if ($('#register-missing').hasClass('registration')) {
			SITE.registration.disableSubmitButton($('#register-missing'));
			setInterval(function() {
				doCheck();
			}, 500);
			setupClickHandler(SITE.registration.submitMissingInformationForm);
		} else if ($('#register-heroes').hasClass('registration')) {
			SITE.registration.disableSubmitButton($('#register-heroes'));
			setInterval(function() {
				doCheck();
			}, 500);
			setupClickHandler(SITE.registration.submitHeroesRegistrationForm);

		}
	},

	setupGenericProfileValidation : function(checkers, form, successCallback,
			successFunction) {
		var doCheck = function(async) {
			var c, v = true;
			for (c in checkers) {
				v = checkers[c].check(async) && v;
			}
			return v;
		};
		var button = form.find('button');
		var authenticationTrigger = form.find('.authentication-trigger');

		setInterval(function() {
			if (doCheck(true))
				SITE.registration.enableSubmitButton(form);
			else
				SITE.registration.disableSubmitButton(form);
		}, 500);

		button.click(function(e) {
			e.preventDefault();
			if (doCheck(false)) {
				if (successFunction) successFunction();
				else SITE.registration.profileFormSubmit(form, successCallback, button);
			}
		});

	},

	setupNameValidation : function() {
		var checkers = {
			firstNameChecker : SITE.registration.genericFieldChecker(
					$('#new-first-name'),
					SITE.validationFunctions.validateName, "firstName"),
			lastNameChecker : SITE.registration.genericFieldChecker(
					$('#new-last-name'), SITE.validationFunctions.validateName,
					"lastName")
		};
		var successCallback = function() {
			var firstName = $('#new-first-name').val();
			var lastName = $('#new-last-name').val();
			$('.userName .personalInfoDisplay')
				.find(".first-name").text(firstName).end()
				.find(".last-name").text(lastName);
			$('#first-name').text(firstName);
			$('#last-name').text(lastName);			
			$('h1.user-name .first-name').html(firstName);
			$('h1.user-name .last-name').html(lastName);								
			$('.userName p.personalInfoDisplay').html(firstName + ' ' + lastName);			
			$('.userName .editLink').click();
		};
		SITE.registration.setupGenericProfileValidation(checkers, $('#account-profile-fullname'), successCallback);
	},

	setupEmailValidation : function() {
		var checkers = {
			emailChecker : SITE.registration.genericFieldChecker(
					$('#email-address'),
					SITE.validationFunctions.validateEmail, "email")
		};
		var successCallback = function() {
			$('.emailAddress .personalInfoDisplay .email').html(
					$('input#email-address').val());
			$('.emailAddress .editLink').click();
			setTimeout(function() {
				$("#reenterPassword").val("");
				setTimeout(function() {
					var row = $("#reenterPassword-data-row"); 
					row.removeClass("validationError").removeClass("validationPassed");
					row.find(".feedback-control.message").text("").hide();
				}, 500);
			}, 500);
		};

		SITE.registration.disableSubmitButton($('#account-profile-email'));
		var originalEmail = $('input#email-address').val();

		var checkEmailInt = setInterval(function() {
			if(originalEmail != $('input#email-address').val()) {
				clearInterval(checkEmailInt);
				SITE.registration.setupGenericProfileValidation(checkers,
						$('#account-profile-email'), successCallback);
			}
		}, 500);
	},

	setupEmailResetPasswordValidation : function() {
		if ($("#email").length == 0)
			return;

		var checkers = {
			emailChecker : SITE.registration.genericFieldChecker($('#email'),
					SITE.validationFunctions.validateEmailFormat, "email")
		};
		var successCallback = function() {
			$('#frmForgotPassword').submit();
		};
		SITE.registration.setupGenericProfileValidation(checkers,
				$('#frmForgotPassword'), null, successCallback);
	},

	setupResetPasswordValidation : function() {
		var checkers = {
			passwordChecker : SITE.registration.genericFieldChecker(
					$('#newPassword'),
					SITE.validationFunctions.validatePassword, "newPassword"),
			retypePasswordChecker : SITE.registration.genericMultiFieldChecker(
					[ $('#retype-password') ], [ $('#newPassword') ],
					SITE.validationFunctions.validateRetypePassword,
					"newRetypePassword")
		};
		var successFunction = function() {
			$('#formResetPassword').submit();
		};
		SITE.registration.setupGenericProfileValidation(checkers,
				$('#formResetPassword'), null, successFunction);
	},

	setupCreatePasswordValidation : function() {
		var checkers = {
			passwordChecker : SITE.registration.genericFieldChecker(
					$('#createNewPassword'),
					SITE.validationFunctions.validatePassword,
					"createNewPassword"),
			retypePasswordChecker : SITE.registration.genericMultiFieldChecker(
					[ $('#retype-createNewPassword') ],
					[ $('#createNewPassword') ],
					SITE.validationFunctions.validateRetypePassword,
					"createNewRetypePassword")
		};
		var successFunction = function() {
			var data = {
				'newPassword' : $('#createNewPassword').val(),
				'newRetypePassword' : $('#retype-createNewPassword').val()
			};
			
			$.ajax({
				type : 'POST',
				headers: SSO.csrf.getCSRFObj(),
				url : SSO.utility.getApiUrl() + "/profilePassword",
				data : data,
				async : false
			});
			
			window.location.href = SSO.utility.getApiUrl()
					+ "/profile?action=deregister&accountType=facebook";
		};
		SITE.registration.setupGenericProfileValidation(checkers,
				$('#formCreateNewPassword'), null, successFunction);
	},

	setupPasswordValidation : function() {
		var checkers = {
//			currentPasswordChecker : SITE.registration.genericFieldChecker(
//					$('#currentPassword'),
//					SITE.validationFunctions.validateCurrentPasword, "currentPassword"),
			passwordChecker : SITE.registration.genericFieldChecker(
					$('#newPassword'),
					SITE.validationFunctions.validatePassword, "newPassword"),
			retypePasswordChecker : SITE.registration.genericMultiFieldChecker(
					[ $('#retype-password') ], [ $('#newPassword') ],
					SITE.validationFunctions.validateRetypePassword,
					"newRetypePassword")
		};

		var successFunction = function() {
			var data = {
//				'currentPassword' : $('#currentPassword').val(),
				'newPassword' : $('#newPassword').val(),
				'newRetypePassword' : $('#retype-password').val()
			};
		
			$.ajax({
				url: SSO.utility.getApiUrl() + "/profilePassword",
				data: data,
				headers: SSO.csrf.getCSRFObj(),
				type: "POST",
				success: function(d) {
					if (d.status === 'error') {
						for (var error in d.errors) {
							if(error) {
								SITE.registration.highlightFieldIcon(error);
								SITE.registration.createErrorTooltip.call(this, d.errors[error], error);
							}
							
							$('#currentPassword').val("");
						}
					} else {
						$('.password .editLink').click();
						
						var clearValidationInfo = function(inp, row) {
							$(inp).val("");
							setTimeout(function() {
								$(row).removeClass("validationPassed").removeClass("validationError");
								$(row).find(".feedback-control.message").text("").hide();
							}, 700);
						};
						
						setTimeout(function() {
							clearValidationInfo("#currentPassword", '#currentPassword-data-row');
							clearValidationInfo("#newPassword", '#newPassword-data-row');
							clearValidationInfo("#retype-password", '#newRetypePassword-data-row');
						}, 500);
					}
				},
				error: function(response) {
					console.log(response);
				}
			});
		}

		SITE.registration.setupGenericProfileValidation(checkers,
			$('#account-profile-password'), null, successFunction);
	},

	setupMailingAddressValidation : function() {
		var countryProxy = SITE.util.buildProxy($("#country"), "change");
		var stateProxy = SITE.util.buildProxy($('#region'), "change");

		var checkers = {
			addressLine1Checker : SITE.registration.genericFieldChecker(
					$('#address1'), SITE.validationFunctions.validateAddress,
					"addressLine1"),
			addressLine2Checker : SITE.registration.genericMultiFieldChecker([
					$('#address2'), $('#address1') ], [], function(v, v2, c) {
				return SITE.validationFunctions.validateAddressLine2(v, c);
			}, "addressLine2", true),
			cityChecker : SITE.registration.genericFieldChecker($('#city'),
					SITE.validationFunctions.validateCity, "city"),
			regionChecker : SITE.registration.genericMultiFieldChecker([
					stateProxy, countryProxy ], [],
					SITE.validationFunctions.validateRegion, "region"),
			postalCodeChecker : SITE.registration.genericMultiFieldChecker([
					$('#postal-code'), countryProxy ], [],
					SITE.validationFunctions.validatePostalCode, "postalCode"),
			countryChecker : SITE.registration.genericFieldChecker(
					countryProxy, SITE.validationFunctions.validateCountry,
					"country")
		};
		var successCallback = function() {
			var country = $("select#country").val();
			
			var state = $("select#region").val();
			var zip = $("input#postal-code").val();
			
			if(country != "US" && country != "GB" && country != "AU")
				zip = "";
			
			if(country != "US")
				state = "";
			
			$(".personalInfoDisplay")
				.find("span.address-line-1").html($('input#address1').val()).end()
				.find("span.address-line-2").html($('input#address2').val()).end()
				.find("span.city").html($('input#city').val()).end()
				.find("span.state").html(state).end()
				.find("span.country").html($('select#country').val()).end()
				.find("span.zip").html(zip).end()

			$('.mailingAddress .editLink').click();
		};
		SITE.registration.setupGenericProfileValidation(checkers, $('#account-profile-address'), successCallback);
	},

	setupPhoneNumberValidation : function() {
		var $phoneNumber = $("#phone-number");
		var $phoneNumberDisplay = $("#phone-number-display");
		if($phoneNumber.val()) $phoneNumberDisplay.val($phoneNumber.val());
		var preferred = ($phoneNumberDisplay.attr("data-preferred-countries") || "").trim().split(/\s*,\s*/);
		var promise = $phoneNumberDisplay.intlTelInput({
			utilsScript: "../resources/common/scripts/intlTelInput/utils.js",
			preferredCountries: preferred
		});
		promise.done(function() {
			if($phoneNumber.val())
				$(".phoneNumber .phone-number").text($phoneNumber.val());
		});
		
		var gfc = SITE.registration.genericFieldChecker;
		var vf = SITE.validationFunctions;
		
		var checkers = {
			phoneNumber : gfc($phoneNumberDisplay, vf.buildPhoneNumberValidator($phoneNumberDisplay), "phoneNumber"),
			reenterPasswordChecker : gfc($('#reenterPasswordPhone'), vf.validateReenterCurrentPassword, "reenterPasswordPhone")
		};
		
		var successCallback = function() {
			var num = $phoneNumber.val() || "";
			$phoneNumberDisplay.intlTelInput("setNumber", num);
			$(".phoneNumber .personalInfoDisplay .phone-number").text($("#phone-number-display").val());
			$('.phoneNumber .editLink').click();

			setTimeout(function() {
				$("#reenterPasswordPhone").val("");
				setTimeout(function() {
					var row = $("#reenterPasswordPhone-data-row"); 
					row.removeClass("validationError").removeClass("validationPassed");
					row.find(".feedback-control.message").text("").hide();
				}, 500);
			}, 500);
			
			if(SITE.sms.isSMSSub == true)
				SITE.sms.afterPhoneAdded();
		};
		
		SITE.registration.setupGenericProfileValidation(checkers, $('#account-profile-phonenumber'), successCallback);
	},
	
	setupSecurityQuestionValidator : function() {
		var securityQuestionProxy = SITE.util.buildProxy($('#questionId'), "change");

		var checkers = {
			questionChecker : SITE.registration.genericFieldChecker(securityQuestionProxy,
					SITE.validationFunctions.validateQuestion, 'questionId'),
			answerChecker : SITE.registration.genericFieldChecker($('#answer'),
					SITE.validationFunctions.validateAnswer, 'answer')
		};
		var successCallback = function() {
			$('.securityQuestion .editLink').click();
		};
		SITE.registration.setupGenericProfileValidation(checkers, $('#placeholder-securityQuestion'), successCallback);
	},

	setupSecurityQuestionRequiredModalValidator : function() {
		var securityQuestionProxy = SITE.util.buildProxy($('#questionId-required'),
				'change');
		
		var checkers = {
			questionChecker : SITE.registration.genericFieldChecker(
					securityQuestionProxy,
					SITE.validationFunctions.validateQuestion,
					'questionId-required'),
			answerChecker : SITE.registration.genericFieldChecker(
					$('#answer-required'),
					SITE.validationFunctions.validateAnswer, 'answer-required')
		};
		var successCallback = function() {
			$.modal.close();
		};
		SITE.registration.setupGenericProfileValidation(checkers,
				$('#placeholder-securityQuestionRequired'), successCallback);
	},

	setupOtherPlatformValidator : function() {

		var platformProxy = SITE.util.buildProxy($('#otherPlatform'), 'change');

		var checkers = {
			platformChecker : SITE.registration.genericFieldChecker(
					platformProxy,
					SITE.validationFunctions.validateOtherPlatform, 'platform')
		};

		SITE.registration.setupGenericProfileValidation(checkers,
				$('#chooseOtherPlatformRequest'), null, null);
	},

	setupForumNameValidator : function() {
		var checkers = {
			forumNameChecker : SITE.registration.genericFieldChecker(
					$('#forum-name'),
					SITE.validationFunctions.validateUsername, 'userName'),
			reenterPasswordChecker: SITE.registration.genericFieldChecker(
					$('#reenterPasswordUsername'),
					SITE.validationFunctions.validateReenterCurrentPassword, "reenterPasswordUsername")
		};
		var successCallback = function() {
			$('.forumName .personalInfoDisplay .forum-name').html(
					$('input#forum-name').val());
			$('.forumName .editLink').click();
			setTimeout(function() {
				$("#reenterPasswordUsername").val("");
				setTimeout(function() {
					var row = $("#reenterPasswordUsername-data-row"); 
					row.removeClass("validationError").removeClass("validationPassed");
					row.find(".feedback-control.message").text("").hide();
				}, 500);
			}, 500);
		};
		SITE.registration.setupGenericProfileValidation(checkers,
				$('#account-profile-forumname'), successCallback);
	},

	setupHeroesIdValidator : function() {
		var checkers = {

		};
	},

	disableSubmitButton : function(form) {
		$form = $(form);
		$regSubmit = $form.find('.submit');
		if (!head.browser.ie) {
			$regSubmit.attr('disabled', 'disabled');
		}
		$regSubmit.addClass('disabled');
	},

	populateHeroesEmail : function() {
		var $emailField = $("#register-heroes #email-address");
		var accountEmail = $emailField.data("value");
		$emailField.val(accountEmail);
	},

	enableSubmitButton : function(form) {
		$form = $(form);
		$regSubmit = $form.find('.submit');
		$regSubmit.removeAttr('disabled').removeClass('disabled');
	},

	initValidators : function() {

		if ($('#register-full').length > 0 || $('#register-missing').length > 0 || $('#registerHeroes').length > 0 || $("#register.mobile-game").length > 0) {
			this.regValidator = this.initRegistration();
		}

		var setup = {
			'#formCreateNewPassword' : this.setupCreatePasswordValidation,
			'#reset-pw' : this.setupResetPasswordValidation,
			"#frmForgotPassword" : this.setupEmailResetPasswordValidation,
			'#account-profile-email' : this.setupEmailValidation,
			'#account-profile-password' : this.setupPasswordValidation,
			'#placeholder-securityQuestion' : this.setupSecurityQuestionValidator,
			'#account-profile-fullname' : this.setupNameValidation,
			'#account-profile-address' : this.setupMailingAddressValidation,
			'#account-profile-phonenumber' : this.setupPhoneNumberValidation,
			'#placeholder-securityQuestionRequired' : this.setupSecurityQuestionRequiredModalValidator,
			'#platform-data-row' : this.setupOtherPlatformValidator,
			'#forum-name' : this.setupForumNameValidator,
			'#heroesId' : this.setupHeroesIdValidator
//			'#acceptCurrentTOS' : this.setupTOSValidator
		};

		for ( var s in setup) {
			if ($(s).length > 0)
				setup[s]();
		}

	},
	
	initPreregistration: function() {
		var parameters = SSO.utility.urlParameters;
		if("email" in parameters) {
			var email = parameters["email"];	
			$("#email-address").val(email);
			$("#retype-email-address").val(email);
		}
	},

	init : function() {
		this.initPageErrors();
		this.wireNewsletter();
		this.postalCodeChecker();
		this.initAccountSwitcher();
		this.initValidators();
		this.initAccountLinking();
		this.initPreregistration();
	}
};

SITE.resendEmail = {
	init : function() {
		if ($('#grace-login').length) {
			this.setupButtons();
		}
	},

	setupButtons : function() {
		$('#frmResendEmail').click( function(event) {
			event.preventDefault();
			
			$.ajax({
				url : 'resendVerifyEmail',
				headers: SSO.csrf.getCSRFObj(),
				type : 'POST',
				dataType : 'json',
				data : $('#email').serialize(),
				async : false,
				success : function(data) {
					if (data.status == 'success') {
						jQuery('#resend-email')
							.html('<p class=\"email-success\">'
									+ SITE.dictionary['gracelogin-resendemail-success']
								+ '</p>');
					} else {
						var message = "";
						for (index = 0; index < data.exceptionMessageList.length; index++) {
							message += data.exceptionMessageCode + " " + data.exceptionMessageList[index];
						}

						jQuery('#resend-email')
							.html('<p class=\"email-success\">'
								+ SITE.dictionary['gracelogin-resendemail-failure']
								+ '</p><p>'
								+ message
							+ '</p>');
					}
				},
				error : function(data) {
					jQuery('#resend-email')
						.html('<p class=\"email-success\">'
							+ SITE.dictionary['gracelogin-resendemail-failure']
							+ '</p><p>'
							+ data
							+ '</p>');
				}
			});
		});
	}
};

SITE.profile = {
	wireSubnavLinks : function() {
		$('#account-preferences-section').hide();
		
		$(".profile-tab-nav li.personal-information").click(function(e) {
			e.preventDefault();
			$(".profile-tab-nav li.personal-information").addClass('active');
			$(".profile-tab-nav li.preferences, .profile-tab-nav li.account-linking, .profile-tab-nav li.two-factor-authentication").removeClass('active');
			$('#account-preferences-section, .account-linking-container, .privacy-security-container').hide();
			$('#account-profile-section, section #link-accounts, section #link-social-accounts').show();
		});

		$('.profile-tab-nav li.preferences').click(function(e){
			e.preventDefault();
			$(".profile-tab-nav li.preferences").addClass('active');
			$(".profile-tab-nav li.personal-information, .profile-tab-nav li.account-linking, .profile-tab-nav li.two-factor-authentication").removeClass('active');
			$('#account-profile-section, section #link-accounts, section #link-social-accounts, .account-linking-container, .privacy-security-container').hide();
			$('#account-preferences-section').show();
		});
		
		$('.profile-tab-nav li.account-linking').click(function(e){
			e.preventDefault();
			$(".profile-tab-nav li.account-linking").addClass("active");
			$(".profile-tab-nav li.preferences, .profile-tab-nav li.personal-information, .profile-tab-nav li.two-factor-authentication").removeClass('active');
			$('#account-preferences-section, #account-profile-section, section #link-accounts, section #link-social-accounts, .privacy-security-container').hide();
			$('.account-linking-container').show();
		});
		
		$('.profile-tab-nav li.two-factor-authentication').click(function(e){
			e.preventDefault();
			$(".profile-tab-nav li.two-factor-authentication").addClass("active");
			$(".profile-tab-nav li.preferences, .profile-tab-nav li.personal-information, .profile-tab-nav li.account-linking").removeClass('active');
			$('#account-preferences-section, #account-profile-section, section #link-accounts, section #link-social-accounts, .account-linking-container').hide();
			$('.privacy-security-container').show();
		});
		
		if($("#account-profile").hasClass("show-preferences"))
			$('.profile-tab-nav li.preferences').click();
		else if($("#account-profile").hasClass("show-player-info"))
			$('.profile-tab-nav li.personal-information').click();
		else if($("#account-profile").hasClass("show-2FA"))
			$('.profile-tab-nav li.two-factor-authentication').click();
		else
			$('.profile-tab-nav li.account-linking').click();
	},

	wireChangeEmailLink: function() {
		$('#changeEmailLink').click(function(event){
			event.preventDefault();
			$('.personal-information-link').click();
			$('.emailAddress.personalInfo .editLink:not(.selected)').click();
		});
		$("#changeMobileLink").click(function(e){
			e.preventDefault();
			$(".personal-information-link").click();
			$(".phoneNumber.personalInfo .editLink:not(.selected)").click();
		});
	},
	wireEditLinks : function() {
		$(".editLink").click(function() {
			var $thisLink = $(this),
				$thisForm = $(this).siblings("form");
			
			if(SITE.secureSession.isRequired($thisLink) && !SITE.secureSession.isEstablished()) {
				SITE.secureSession.init();
				return;
			}
			
			var $thisDisplay = $(this).siblings(".personalInfoDisplay").hide(),
				$thisForms = $thisForm.find(".personalInfoForms").slideDown('slow');
			
			if (!$(this).hasClass("selected")) {
				$thisDisplay.hide();
				$thisForms.slideDown('slow');
				$(this).addClass('selected').html("x");
				$(this).parents(".personalInfo").addClass('selected');
				
				var ariaLabelEditText = $(this).attr('aria-label');
				$(this).attr("aria-label", SITE.dictionary['profile-form-cancel'] + " " + ariaLabelEditText);
				
				SITE.registration.postalCodeChecker();
				SITE.util.adjustHeightOfSelect();
			} else {
				$thisForms.slideUp('slow', function() {
					$thisDisplay.show();
					$thisLink.parents(".personalInfo").removeClass('selected');
					$thisLink.removeClass('selected');
					$thisLink.html(SITE.dictionary['profile-form-edit']);
					
					var ariaLabelCancelText = $thisLink.attr('aria-label');
					$thisLink.attr("aria-label", ariaLabelCancelText.replace(SITE.dictionary['profile-form-cancel'] + " ", ""));					
				});
			}			
		});
		
		$("#smsOptIn").on("change", function(e){
			var check = $(this).is(":checked") ? "on" : "off";
			$(this).val(check);
			$("input[name=_smsOptIn]").val(check);
		});
	},

	wireChangePasswordButton: function() {
		$('#change-my-password-button').click(function(e){
			e.preventDefault();
			$('.personal-information-link').click();
			$('.password.personalInfo .editLink:not(.selected)').click();
			$('#newPassword').focus();
		});
	},

	wirePrivacySettingsTooltips: function() {
		$('.preference-item label .help-icon').hover(
			function(e) { 
				e.preventDefault();
				$(this).parent().siblings(".tooltip").fadeIn();
			},
			function(e) { 
				e.preventDefault(); 
				$(this).parent().siblings(".tooltip").fadeOut();
			}
		);
		$('.preference-item label .help-icon').on("click", function(e) {
			e.preventDefault();
			$(this).parent().siblings(".tooltip").fadeToggle();
		});
	},

	populateForumName : function() {
		var $forumName = $('.forumName .personalInfoDisplay'), username, $communityLink, communityHREF;
		
		if ($forumName.length || $forumName.html())
			return;

		if (ssobar && ssobar.user && ssobar.user.userInfo) {
			if (ssobar.user.userInfo.userNameEmpty)
				return;

			username = ssobar.user.userInfo.userName;
			$communityLink = $('#identities .communityLink');
			communityHREF = $communityLink.attr('href');
			communityHREF = communityHREF + username;

			$forumName.html(username);
			$communityLink.attr('href', communityHREF);
		}
	},
	
	buildRadialProgressBar : function() {
		var $proComp = $(".profile-completion-container"); 

		if($proComp && $proComp.length > 0) {
			var $actComp = $proComp.find(".account-completion-container");
			
			var degToPerc = 3.6;
			var perc = $actComp.find(".percentage").data("percentage") || 0;
			var rotation = (perc * degToPerc) / 2;
			
			$actComp.find(".fill, .mask.full").css("transform", "rotate(" + rotation + "deg)");
			//$actComp.find(".mask.full").css("transform", "rotate(" + rotation + "deg)");
			$actComp.find(".fill.fix").css("transform", "rotate(" + (rotation*2) + "deg)");
			
			var $compList = $proComp.find(".completion-list-container"); 
			
			if (perc != "100") {
				$actComp.hover(
					function() { $compList.show(); },
					function() { $compList.hide(); }
				);
				
				$actComp.click(function() { $compList.toggle(); })
			}
		}
	},
	
	gamerPreferenceHandler: function() {
		var $prefSelect = $(".preference-menu .preference-item select");

		$prefSelect.on("change", function() { SITE.profile.submitGamerPreference($(this)); })
	},

	submitGamerPreference: function($select) {
		var platform = $select.data("platform");
		var id = $select.data("preference-id");
		var setting = $select.val();

		$.ajax({
			url: SSO.utility.getApiUrl() + "/setGamerPreference/" + platform + "/" + id + "/" + setting,
			type: "POST",
			headers: SSO.csrf.getCSRFObj(),
			success: function(d) {
				console.log(d);
			}
		});
	},
	
	trimForumNameRandomString: function() {
		var forumNameString = $('input#forum-name').val();
		var forumNameRandomStringPos = forumNameString.indexOf("#");
		if(forumNameRandomStringPos > -1) {
			$('input#forum-name').val( forumNameString.slice(0,forumNameRandomStringPos) );
		}
	},
	
	setupClaimEmailVerificationHandler: function() {
		$(".claim-perk-link").click(function(e) {
			e.preventDefault();
			
			$.getJSON('ajax/claimEmailVerificationReward', function(data) {
				var $claim = $(".claim-perk-container .claim-perk")
				var $error = $(".claim-perk-container .claim-perk-error")
				var $success = $(".claim-perk-container .claim-perk-success")
				if(data.status == "error" && data.exceptionMessageList.length > 0) {
					var errorKey = data.exceptionMessageList[0];
					var errorMessage = SITE.dictionary[errorKey];
					
					$error.html(errorMessage);
				} else {
					$error.html("");
					$claim.hide();
					$success.show();
				}
			});
		})
	},

	setupResendEmailHandler: function() {
		var $emailCont = $(".resend-email-container");
		if($emailCont.length == 0) 
			return;
		
		var $eInitial = $emailCont.find(".resend-email.initial");
		var $eConfirmed = $emailCont.find(".resend-email.confirmed");
		var $eError = $emailCont.find(".resend-email.failure");
		
		var $emailButton = $emailCont.find(".resend-email-button");
		
		$eInitial.show();
		
		var resendVerificationEmail = function() {
			$.ajax({
				url : 'resendVerifyEmail',
				headers: SSO.csrf.getCSRFObj(),
				type : 'POST',
				dataType : 'json',
				data : $('#account-profile-resend-verify-email').serialize(),
				async : false,
				success : function(data) {
					if (data.status == 'success') {
						$emailCont.find(".resend-email").hide();
						$eConfirmed.show();
					} else {
						$emailCont.find(".resend-email").hide();
						$eError.show();
					}
				},
				error : function(data) {
					$emailCont.find(".resend-email").hide();
					$eError.show();
				}
			});
			
			return null;
		};

		$emailButton.click(function(e) {
			e.preventDefault();
			resendVerificationEmail();
		});
		
	},
	
	authentication: {
		currentForm: null,
		updateProfileEndpoints: {
			"password": "profilePassword",
			"email": "profileEmail",
			"username": "profileForumName"
		},
		
		displayedClassByField: {
			"password": "password",
			"email": "email",
			"username": "forum-name"
		},
		
		passwordPaths: {
			"password": "currentPassword",
			"email": "reenterPassword",
			"username": "reenterPassword"
		},
		
		createHiddenInput: function($input) {
			return $("<input>", {
				"name": $input.attr("name"),
				"type": "hidden",
				"value": $input.val()
			});
		},

		updateModal: function(field, value) {
			var $aModalCont = $(".authentication-modal-container");
			var $baseForm = $(".authentication-required[data-field=" + field + "]");
			var $inputs = $baseForm.find("input");
			var origin = $aModalCont.parent().data("origin");
			
			$aModalCont.find(".additional-inputs").html("");
			$aModalCont.find(".password-entry input").attr("name", SITE.profile.authentication.passwordPaths[field]);

			$aModalCont.data("field", field);
			SITE.profile.authentication.currentForm = $baseForm;
			SITE.profile.authentication.buildModalHiddenInputs($aModalCont, $inputs);
			SITE.profile.authentication.buildTPALinks(field, value, origin);
			
			$aModalCont.find("form").attr("action", SITE.profile.authentication.getAuthenticationAction(field));
		},
		
		buildTPALinks: function(field, value, origin) {
			var $plats = $(".modal-network-select #console-login .network-select li")
            var baseUrl = SSO.utility.getApiUrl() + "/thirdPartyAuth/authorize/";
            var queryString = "?field=" + field + "&value=" + value;

            if(origin != null)
                queryString += "&origin=" + origin;

            for(var i = 0; i < $plats.length; i++) {
                var plat = $($plats[i]).data("platform");
                var linkUrl = baseUrl + plat + queryString;
                $($plats[i]).find("a").attr("onclick", "window.location = '" + linkUrl + "'");
            }
		},

		buildModalHiddenInputs: function($modCont, $inputs) {
			var $modalForm = $(".authentication-modal-container .profile-modal .modal-form");
			var $addInputs = $modalForm.find(".additional-inputs");


			for(var i = 0; i < $inputs.length; i++) {
				$addInputs.append(SITE.profile.authentication.createHiddenInput($($inputs[i])));
			}

		},
		
		getAuthenticationAction: function(field) {
			return SSO.utility.getApiUrl() + "/" + SITE.profile.authentication.updateProfileEndpoints[field];
		},

		wireAuthenticationModal: function() {
			var $modalForm = $(".authentication-modal-container .profile-modal form")
			
			$(".authentication-trigger").click(function(e) {
				e.preventDefault();
				
				if($(this).parents(".personalInfoForms").find(".data-row").filter(".validationError").length > 0)
					return;
				
				var val = $(this).parents(".personalInfoForms").find("fieldset").find("input").val();

				SITE.profile.authentication.updateModal($(this).data("field"), val);
				$(".authentication-modal-container").show().addClass("active");
			});
			
			$(".authentication-trigger-mpi").click(function(e) {
				e.preventDefault();
				
				if($(this).parent().parent().find(".data-row").filter(".validationError").length > 0)
					return;
				
				var val = $(this).parent().parent().find(".data-row").find("input").val();
				
				if(val.length == 0) return;
				
				SITE.profile.authentication.updateModal($(this).data("field"), val);
				$(".authentication-modal-container").show().addClass("active");
			});

			$(".authentication-modal-container .close-modal, .authentication-modal-container").click(function(e) {
				e.preventDefault();
				$(".authentication-modal-container").removeClass('active');
			});
			
			$(".authentication-modal-container .profile-modal").click(function(e) {
				e.stopImmediatePropagation();
			});
			
			$(".authentication-modal-container .profile-modal form").submit(function(e) {
				e.preventDefault();
				$.ajax({
					headers: SSO.csrf.getCSRFObj(),
					url: $modalForm.attr("action"),
					type: "POST",
					dataType : 'json',
					data: $modalForm.serialize(),
					success: function(data) {
						if (data.status === 'error') {
							for ( var error in data.errors) {
								if (typeof error != 'undefined') {
									SITE.registration.highlightFieldIcon(error);
									SITE.registration.createErrorTooltip.call(this,
										data.errors[error], error);
								}
							}
						} else {
							var displayedClass = SITE.profile.authentication.displayedClassByField[$(".authentication-modal-container").data("field")];
							if(displayedClass == "email")
								$(".personalInfoDisplay ." + displayedClass).html($modalForm.find(".additional-inputs input[name='email']").val())
							else if(displayedClass == "forum-name")
								$(".personalInfoDisplay ." + displayedClass).html($modalForm.find(".additional-inputs input[name='userName']").val())
							
							$(".modal-form .data-row").removeClass("validationError").find("feedback-control").html("");
							
							$(".authentication-modal-container").removeClass('active');
							SITE.profile.authentication.currentForm.find(".editLink").click();
						}
						
						$(".authentication-modal-container").find(".data-row input").val("");
					}
				});
				return false;
			});
			
			//Prevent form submission with ENTER key press.  Only allow form submit via SAVE button for Auth Modal.
			$("#account-profile-section .profileInfo form").keypress(function(e) {  
				if (e.which == 13) {
					e.preventDefault();
				}
			});
		},
		
		cleanValidation: function(field) {
			$(".authentication-modal-container .personalInfoForms .data-row").find(".feedback-control.message").html("");
		},

		init: function() {
			this.wireAuthenticationModal();
		}
	},
	
	
	phoneNumberTermsDisplay: function() {
		$(window).load(function(){
		
			setTimeout(()=> {			
				//console.log("phoneNumberTermsDisplay");
				let phoneNumCountry = document.querySelector(".selected-flag .iti-flag");
				const observeConfig = { attributes: true };
				//console.log("phoneNumCountry=", phoneNumCountry);
				
				if(phoneNumCountry != null) {
					let initialCountry = phoneNumCountry.className;
					initialCountry = phoneNumCountry.className.replace("iti-flag ", "");
					
					//console.log("initialCountry=",initialCountry);
					if(initialCountry !== "us") {
						document.querySelector(".us-phone-terms").classList.remove("active-terms");
						document.querySelector(".us-sms-terms").classList.remove("active-terms");
						document.querySelector(".non-us-phone-terms").classList.add("active-terms");
						document.querySelector(".non-us-sms-terms").classList.add("active-terms");
					}
					
					const callback = (mutationList, observer) => {
						for (const mutation of mutationList) {
							if (mutation.type === "attributes") {
								let selectedCountry = phoneNumCountry.className;
								selectedCountry = phoneNumCountry.className.replace("iti-flag ", "");					     
								console.log("selectedCountry=",selectedCountry);
					     
								if(selectedCountry === "us") {
									document.querySelector(".non-us-phone-terms").classList.remove("active-terms");
									document.querySelector(".non-us-sms-terms").classList.remove("active-terms");
									document.querySelector(".us-phone-terms").classList.add("active-terms");
									document.querySelector(".us-sms-terms").classList.add("active-terms");
								} else {
									document.querySelector(".us-phone-terms").classList.remove("active-terms");
									document.querySelector(".us-sms-terms").classList.remove("active-terms");
									document.querySelector(".non-us-phone-terms").classList.add("active-terms");
									document.querySelector(".non-us-sms-terms").classList.add("active-terms");
								}
							}
						}
					};
					
					const observer = new MutationObserver(callback);
					observer.observe(phoneNumCountry, observeConfig);
				}
			
			}, 3000);
		
		})
	},

	init : function() {
		this.setupResendEmailHandler();
		this.setupClaimEmailVerificationHandler();
		this.wireSubnavLinks();
		this.wireChangeEmailLink();
		this.wireEditLinks();
		this.wireChangePasswordButton();
		this.wirePrivacySettingsTooltips();
		this.populateForumName();
		this.buildRadialProgressBar();
		this.gamerPreferenceHandler();
		this.trimForumNameRandomString();
		this.authentication.init();
		this.phoneNumberTermsDisplay();
	}
};

SITE.optOut = {
	checkSubscriptions : function() {
		if ($('[name="globalOptOut"]').is(':checked')) {
			$('.newsletters input').attr('disabled', true);
			$('.newsletters label').css('color', '#53565A');
		} else {
			$('.newsletters input').attr('disabled', false);
			$('.newsletters label').css('color', '#A6ACB5');
		}

		$.each($('.newsletters input[type="hidden"]'), function() {
			$(this).prev().is(':checked') ? $(this).val('on') : $(this).val(
					'off');
		});
	},

	returnSubscriptions : function() {
		var subscriptions = [];
		var subscriptionsInputs = $('.newsletters input').each(function() {
			$(this).val();
		});

		for ( var i = 0; i < subscriptionsInputs.length; i++) {
			var temp = $(subscriptionsInputs[i]).val();
			if ($(subscriptionsInputs[++i]).val() == 'on')
				subscriptions.push(temp);
		}

		return subscriptions;
	},

	setupButtons : function() {
		$('input').click(function() {
			SITE.optOut.checkSubscriptions();
		});

		$('form#opt-out button').click(
				function(event) {
					event.preventDefault();
					$.post("doOptOut", $("#opt-out").serialize(), function(d) {
						if (!$('[name="subscriptions"]').is(':checked')
								|| $('[name="globalOptOut"]').is(':checked')) {
							$('#note_unsub').fadeIn(400);
							$('#note_config').fadeOut(400);
						} else {
							$('#note_config').fadeIn(400);
							$('#note_unsub').fadeOut(400);
						}

						$('#note_update').fadeIn(500).delay(3000).fadeOut(500);						
					});
				});
	},

	init : function() {
		var isLoggedIn = SSO.utility.getCookie("ACT_SSO_COOKIE") && SSO.utility.getCookie("ACT_SSO_COOKIE").length;
		
		if ($('body div').hasClass('opt-out')) {
			if ($('[name="subscriptions"]').is(':checked'))
				$('#note_config').fadeIn(400);

			SITE.optOut.checkSubscriptions();
			SITE.optOut.setupButtons();
		}
		
		if ($("#opt-out.SSO-PAGE").length && !isLoggedIn) {
			$("#preferences-form .stay-up").hide();
			$("#preferences-form .log-in").show();
			
			$("[name=subscriptions]").each(function() {
				$(this).attr("disabled", "disabled");
			});
		}
	}
};

SITE.accountDeletion = {
	init: function() {
		$adc = $(".account-deletion-container");

		this.wireAccountDeletionModal($adc);
		this.wireDeletionHandlers($adc)
	},

	wireDeletionHandlers: function($adc) {
		$(".keep-account a").click(function(e) {
			e.preventDefault();

			$(".simplemodal-close").click();
		});
		
		$(".delete-account button.submit").click(function(e) {
			$(".account-deletion form").submit();
			$(".simplemodal-close").click();
		});
	},

	wireAccountDeletionModal: function($adc) {
		$adc.find(".account-deletion-link").click(function(e) {
			e.preventDefault();

			$adc.find(".account-deletion-modal").modal({
				overlayClose : true,
				minHeight : 260
			});

		});
	}
}

SITE.preferences = {
		api: {
			updateSubscriptions: function() {
				SITE.preferences.api.updateBrands(SITE.preferences.api.updatePrefs(SITE.preferences.api.defaultCallback));
			},

			updateBrands: function(callback) {
				$.ajax({
					url: SITE.core.apiUrl + "/updateBrandPrefs",
					data: JSON.stringify(SITE.preferences.buildPreferenceObject()),
					contentType: "application/json",
					async: true,
					type: "POST",
					headers: SSO.csrf.getCSRFObj(),
					complete: function(status) {			
						if(callback != null)
							callback();
					}
				});
			},

			updatePrefs: function(callback) {
                var queryDict = {}
                location.search.substr(1).split("&").forEach(function(item) {queryDict[item.split("=")[0]] = item.split("=")[1]})

                var data = $("form#preferences-form").serializeArray();
                data.push({name: "unoId", value: queryDict["user"]});

				$.ajax({
					url: SITE.core.apiUrl + "/updatePreferences",
					type: "POST",
					data: data,
					headers: SSO.csrf.getCSRFObj(),
					async: false,
					success: function(d) {
						$("#note_update").fadeIn(500).delay(3000).fadeOut(500);
					}, 
					complete: function() {
						if(callback != null)
							callback();
					}
				});
			},

			defaultCallback: function(callback) {
				if(status.responseJSON && status.responseJSON.success) {
					SITE.preferences.commitPrefChanges();
				} else{
					SITE.preferences.util.revertPrefChanges();
				}

				SITE.preferences.util.enableSubscriptionClicks();

				if(callback != null)
					callback();
			}
		},

		util: {
			toggleSubscription: function($subscription) {
				if($subscription.hasClass("checked")) {
					$subscription.removeClass("checked");
					$subscription.attr("aria-checked", "false");
					$subscription.find("input").attr("checked", false);
				} else {
					$subscription.addClass("checked");
					$subscription.attr("aria-checked", "true");
					$subscription.find("input").attr("checked", true);
				}
			},

			disableSubscriptionClicks: function() {
				$(".SSO-PAGE #account-preferences-section").css("pointer-events", "none");
				$("body").addClass("progress");
			},

			enableSubscriptionClicks: function() {
				$(".SSO-PAGE #account-preferences-section").css("pointer-events", "");
				$("body").removeClass("progress");
			},

			commitPrefChanges: function() {
				var $prefs = $(".brand-preference-container .preference");

				$prefs.each(function() {
					if($(this).find("input").is(":checked"))
						$(this).addClass("checked");
					else 
						$(this).removeClass("checked");
				})

				return true;
			},

			revertPrefChanges: function() {
				var $prefs = $(".brand-preference-container .preference");

				$prefs.each(function() {
					if($(this).hasClass("checked"))
						$(this).find("input").prop("checked", true);
					else 
						$(this).find("input").prop("checked", false);
				})

				return false
			},

		},

		brand: {
			init: function($form) {
				var $brands = $form.find(".brand-list .brand");

				SITE.preferences.brand.checkBrands($brands);
				SITE.preferences.brand.wireBrandLinks($brands, $form);
			},

			checkBrands: function($brands) {
				$brands.each(function() {
					if($(this).find("input").prop('checked')) {
						//TODO: purpose of "active"?
						$(this).addClass("checked active");
						$(this).attr("aria-checked", "true");
					}
				});
			},

			wireBrandLinks: function($brands, $form) {
				$brands.each(function() {
					var $brand = $(this);
					var $brandLink = $brand.find(".brand-link");
					
					$brandLink.click(function(e) {
						e.preventDefault();
						
						SITE.preferences.util.disableSubscriptionClicks();
						SITE.preferences.util.toggleSubscription($brand);
				
						SITE.preferences.brand.checkBrandForPreferences($brand);
						SITE.preferences.api.updatePrefs(SITE.preferences.api.defaultCallback);
						//SITE.preferences.api.updateSubscriptions();

						if($brand.hasClass("checked")) {
							$brands.removeClass("active");
							$brand.addClass("active");
						}
					})
				});
			},

			checkBrandForPreferences: function($brand) {
				var brandName = $brand.data("brand");
				var isChecked = $brand.hasClass("checked");

				var $prefsContainer = $(".brand-preference-container." + brandName);
				var $prefs = $prefsContainer.find(".preference");

				if($prefs.length > 0) {
					if(isChecked) {
						if($(".brand-list").find(".checked").length == 1)
							SITE.preferences.addPreferenceSettings(brandName);
						$prefsContainer.slideDown(500);
					} else {
						if($(".brand-list").find(".checked").length == 0)
							SITE.preferences.removePreferenceSettings(brandName);
						$prefsContainer.slideUp(500);
					}
				}
			},
		},

		pref: {
			init: function($form) {
				var $prefList = $form.find(".preferences-list");
				var brands = [];
				
				$.each($(".brand-list li"), function() {
					var brand = $(this).data("brand");
					if(brands.indexOf(brand) == -1)
						brands.push(brand);
				});

				SITE.preferences.buildSMSLinks();
				SITE.preferences.sortBrandPrefs($form);
				SITE.preferences.wirePreferenceLinks($prefList);
				
				for(var brand in brands)
					SITE.preferences.brand.checkBrandForPreferences($(".brand." + brands[brand]));	
			},
		},

		init: function() {
			var $form = $("#preferences-form");

			SITE.preferences.brand.init($form);
			SITE.preferences.pref.init($form);
			
			ssobar.onAuthentication(function(){
				if(!ssobar || !ssobar.user || !ssobar.user.isLoggedIn)
					$(".notification-class-block, .brand-preferences-container").hide();
			});
		},

		sortBrandPrefs: function($form) {
			var $prefLists = $form.find(".brand-preference-container");
			var sortVals = {
				news_and_community_updates: 1,
				in_game_events: 2,
				gameplay_help_and_tips: 3,
				esports: 4,
				sales_and_promotions: 5,
				last: 6
			};

			$prefLists.each(function() {
				var $prefs = $(this).find(".preference");
				var $prefList = [];

				$prefs.each(function() {
					$prefList.push($(this));
				});

				$prefList.sort(SITE.preferences.prefSort(sortVals));

				$(this).empty().append($prefList);
			});

		},

		prefSort: function(sortVals) {
			return function(a, b) {
				var aVal = sortVals[a.data("subscription-type")] || sortVals.last;
				var bVal = sortVals[b.data("subscription-type")] || sortVals.last;

				return ((aVal < bVal) ? -1 : ((aVal > bVal) ? 1 : 0));
			}
		},

		toggleBrandPreferences: function($prefs) {
			if($prefs.length > 0) {
				if(isChecked) {
					$prefs.each(function(i) {
						SITE.preferences.util.toggleSubscription($(this));
					});
				} else {
					SITE.preferences.removePreferenceSettings(brandName);
				}
			}
		},

		wirePreferenceLinks: function() {
			$(".brand-preference-container .preference").each(function(i) {
				
				var $pref = $(this).find(".preference-container input, .sms-preference-container input");
				
				$pref.on("change", function(e) {
					e.preventDefault();
					if(!$(this).parent().hasClass("nophone")){
						
						SITE.preferences.util.disableSubscriptionClicks();
		
						SITE.preferences.util.toggleSubscription($(this).parent());
						SITE.preferences.api.updateSubscriptions();
					} else {
						$(this).prop("checked", false);
						
						$(".personal-information-link").click();
						$(".phoneNumber.personalInfo .editLink:not(.selected)").click();	
					}
				});
				
				$(this).find(".preference-container, .sms-preference-container").on("keydown", preferenceCheckboxEventListener);
			});

		    function preferenceCheckboxEventListener (event) {
		        var key = event.keyCode;
			    var keys = {
			    	enter: 13,
			        space: 32
			    };
		        
		        switch (true) {
		            case (key == keys.enter):
		            case (key == keys.space):
		                event.preventDefault();
		                $(this).find("input").click();
		                break;
		        };
		    };
		},
		
		buildSMSLinks : function() {
			$(".brand-preference-container .sms-preference").each(function(){
				var smsName = $(this).attr("data-subscription-type");
				var prefName = smsName.split("_sms")[0];
				var $otherPref = $(".preference[data-subscription-type='"+prefName+"']");
				$otherPref.append($(this).html());

				if($("#country").val() !== "US" || $("#phone-number").val().length === 0) {
					var smsPref = $otherPref.find($(".sms-preference-container"));
					if (smsPref.length > 0) {
						smsPref.hide();
					}
				}				
				$(this).remove();
			});
		},

		buildPreferenceObject: function() {
			var prefs = {};
			$prefList = $(".preferences-list");
			$brands = $(".brand-preference-container");

			$brands.each(function() {
				var brandName = $(this).data("brand");
				var bpo = SITE.preferences.buildBrandPreferenceObject($(this));
				prefs[brandName] = bpo;
			});

			return prefs;
		},

		buildBrandPreferenceObject: function($brandPrefList) {
			var brandPrefObject = {};
			var isUS = $("#country").val()  == "US";
			var hasPhoneNumber =  $("#phone-number").val().length > 0;

			$brandPrefList.find(".preference").each(function() {
				var subType = $(this).data("subscription-type");
				var isPrefChecked= $(this).find(".preference-container").hasClass("checked");
				var isSmsChecked = $(this).find(".sms-preference-container").hasClass("checked");
				
				brandPrefObject[subType] = isPrefChecked;
				brandPrefObject[subType + "_sms"] = isSmsChecked;
				if(!isUS){
					$(this).find(".sms-preference-container").addClass("notUS").removeClass("checked").find("input").prop("checked", false);
					brandPrefObject[subType + "_sms"] = false;
				}else if(!hasPhoneNumber) {
					$(this).find(".sms-preference-container").addClass("nophone").removeClass("checked").find("input").prop("checked", false);
					brandPrefObject[subType + "_sms"] = false;
				}
			});

			return brandPrefObject;
		},

		modifyPreferenceSettings: function(brand, modifyFunction) {
			$brandPrefs = $(".brand-preference-container." + brand + " .brand-preference-list");
			if($brandPrefs.length > 0) {
				$brandPrefs.each(function(i) {
					modifyFunction($(this));
				})
			}
		},

		addPreferenceSettings: function(brand) {
			SITE.preferences.modifyPreferenceSettings(brand, SITE.preferences.addBrandPreferenceSettings);
		},

		removePreferenceSettings: function(brand) {
			SITE.preferences.modifyPreferenceSettings(brand, SITE.preferences.removeBrandPreferenceSettings);
		},

		addBrandPreferenceSettings: function($brandPrefs) {
			$brandPrefs.find(".preference").each(function() {
				$(this).find("input").prop("checked", true)
			});
		},

		removeBrandPreferenceSettings: function($brandPrefs) {
			$brandPrefs.find(".preference").each(function() {
				$(this).find("input").prop("checked", false)
			});
		},

		setGlobalOptOut: function(isGlobalOptOut) {
			if(isGlobalOptOut) {
				var $brands = $("#preferences-form").find(".brand-list .brand");
				$brands.each(function() {
					var brandName = $(this).data("brand");
					if($(this).hasClass("checked")) {
						SITE.preferences.util.toggleSubscription($(this));
						SITE.preferences.brand.checkBrandForPreferences($(this));
					}
				})

			}
		}
	};

SITE.loadingIndicator = {
	element : function() {
		if (!this._element) {
			var el = $('<div id="loading-indicator"/>');
			$('body').append(el);
			this._element = el;
		}
		return this._element;
	},
	show : function() {
		this.element().fadeIn('fast');
	},
	hide : function() {
		this.element().fadeOut('fast');
	},
	addTo : function(container) {
		this.element().appendTo(container);
	}
};

SITE.acceptCurrentTOS = function() {	
	$.ajax({
		url : SSO.utility.getApiUrl() + "/acceptCurrentTOS",
		headers: SSO.csrf.getCSRFObj(),
		type : 'POST',
		dataType : 'json',
		data : "accept",
		success : function(data) {
			if (data.status === 'error') {
				for ( var error in data.errors) {

				}
			} else {
				SITE.upgradeTOSRequest.close();
				
				if ($("#acceptCurrentTOS").hasClass('redirectPremium'))
					window.location = SITE.dictionary['tos-redirect-premium'];

				location.reload();
			}
		},
		error : function(response) {
			console.log(response);
		}
	});
};

// Display newToS modal


SITE.checkForTOSUpdate = function() {
	if ($('#needNewTOS').length) {
		$.get(SSO.utility.getApiUrl() + "/currentTosHTML", 
			function(d) { 
			    d = d.match(/<body>([\s\S]*)<\/body>/)[1];
			    $("#upgradeTOSRequest div").append(d);
			    SITE.upgradeTOSRequest = $('#upgradeTOSRequest').modal({
			    	overlayClose : false,
					close : false,

					minHeight : 700,
					minWidth : 800
			    });
			});
	}
};

SITE.linkAccount = {
	init: function() {
		this.wireAccountLinkingModals();
		this.wireOtherPlatform();
	},
	
	wireOtherPlatform: function() {
		$("#register-beachhead .no-network-link").attr("href", "./selectOtherPlatform");
	},

	wireAccountLinkingModals: function() {
		var $page = $("#register-beachhead");
		if(!$page.length) return;

		var $accountsCont = $page.find("#link-accounts")
		var $accounts = $accountsCont.children(".link");

		$accounts.click(function(e) {
			e.preventDefault();

			var $target = $(e.target);

			if ($target.closest("#link-addaccount-xbox").length) {
				$accountsCont.find("#register-beachhead-modal-accountlinking-xbox").modal({
					overlayClose : true,
					minHeight : 260
				});
			} else if ($target.closest("#link-addaccount-psn").length) {
				$accountsCont.find("#register-beachhead-modal-accountlinking-psn").modal({
					overlayClose : true,
					minHeight : 300,
				});
			} else if ($target.closest("#link-addaccount-nintendo").length) {
				$accountsCont.find("#register-beachhead-modal-accountlinking-nintendo").modal({
					overlayClose : true,
					minHeight : 300,
				});
			} else if ($target.closest("#link-addaccount-steam").length) {
				$accountsCont.find("#register-beachhead-modal-accountlinking-steam").modal({
					overlayClose : true,
					minHeight : 300,
				});
			} else if ($target.closest("#link-addaccount-battle").length) {
				$accountsCont.find("#register-beachhead-modal-accountlinking-battle").modal({
					overlayClose : true,
					minHeight : 300,
				});
			} else if ($target.closest("#link-addaccount-epic").length) {
				$accountsCont.find("#register-beachhead-modal-accountlinking-epic").modal({
					overlayClose : true,
					minHeight : 300,
				});
			}
		});
	}
};

SITE.commonResourceLocation = SSO.utility.getResourceUrl() + "/scripts";

head.load(
	SITE.commonResourceLocation + "/modernizr-1.7.min.js",
	SITE.commonResourceLocation + "/jQuery.cluetip.min.js",
	SITE.commonResourceLocation + "/jQuery.select.min.js",
	SITE.commonResourceLocation + "/jQuery.simpleModal.1.4.4.min.js",
	SITE.commonResourceLocation + "/jquery.mCustomScrollbar.min.js",
	SITE.commonResourceLocation + "/jquery.mousewheel-3.0.6.min.js"
);

SITE.redemption = {
		init: function() {
			entitlementsObject.promotionEntitlements = SITE.redemption.convertJavaMapToJSON(entitlementsObject.promotionEntitlements);
			SITE.redemption.buildDashboard();
		},
		
		convertJavaMapToJSON : function (map) {
			var convertedJSON = {};
			map = map.replace(/[\{\}]/g, "");
			if(!map) return map;
			
			map = map.split(", ");
			
			for(var i = 0; i < map.length; i++) {
				var temp = map[i].split("=");
				var key = temp[0].trim(),
					value = temp[1].trim();

				if(key.indexOf("double-xp") != -1) key = "double-xp";
				if(key.indexOf("rapid-supply") != -1) key = "rapid-supply";
				
				convertedJSON[key] = value;
			}

			return convertedJSON;
		},
		
		buildDashboard : function () {
			var entitlementsList = entitlementsObject.promotionEntitlements;
			var newEntitlement = entitlementsObject.entitlementValue;
			var completeList = entitlementsObject.completeList;

			$entitlementListContainer = SITE.redemption.buildList($("<ul>", {"class" : "entitlementList"}), completeList);
			
			var $unlockedMess = $("<h2>", {"class" : "unlockedMessage"}).html(entitlementsObject.unlockedMessage);
			var $unlockedContainer = $("<div>", {"class" : "unlockedContainer"}).html($unlockedMess).append($("<ul>", {"class" : "unlockedList"}));

			var $lockedMess = $("<h2>", {"class" : "lockedMessage"}).html(entitlementsObject.lockedMessage);
			var $lockedContainer = $("<div>", {"class" : "lockedContainer"}).html($lockedMess).append($("<ul>", {"class" : "lockedList"}));;

			var $listWrapper = $("<div>", {"class" : "listsWrapper"}).append($unlockedContainer).append($lockedContainer).append($entitlementListContainer);

			$("#redeemCodeSuccess").append($listWrapper);

			var newEntitlements = SITE.redemption.getNewEntitlements(entitlementsObject.entitlementValue);
			
			SITE.redemption.setEntitlementsTitle(newEntitlements);
			SITE.redemption.setRedeemedItems(newEntitlement, entitlementsList);
			
			SITE.redemption.determineAndSetMinutes("double-xp");
			SITE.redemption.determineAndSetMinutes("rapid-supply");
			
			$listWrapper.find(".entitlementItem").appendTo($(".unlockedList"));
			$listWrapper.find(".entitlementItem").not(".redeemed").appendTo($(".lockedList"));
			
			$(".entitlementList").remove();
		},

		getNewEntitlements : function ( entitlements ) {
			entitlements = entitlements.split(",");
			var uniqueEntitlements =  [];

			for(var i = 0; i < entitlements.length; i++) {
				var currItem = entitlements[i];
				if(uniqueEntitlements.length == 0 || uniqueEntitlements.indexOf(currItem) == -1)
					uniqueEntitlements.push(currItem);
			}

			return uniqueEntitlements;
		},

		setEntitlementsTitle : function (list) {
			var entitlementsString= "";

			if(list.length > 1) {
				for(var i = 0; i < list.length; i++) {
					if(entitlementsString != "")
						entitlementsString = entitlementsString + " & ";
					entitlementsString = entitlementsString + entitlementsObject.completeList[list[i]]["name"];
				}
			} else {
				entitlementsString = entitlementsObject.completeList[list[0]]["name"];
			}

			$(".item-name").html(entitlementsString);
		},
		
		determineAndSetMinutes: function (item) {
			var newEntitlement = entitlementsObject.entitlementValue.match(new RegExp(item, "g")) || 0; 
			$("." + item + "-minutes").html(newEntitlement.length * 15);
			
			var totalMinutes = (((newEntitlement && newEntitlement.length) || 0) + (parseInt(entitlementsObject.promotionEntitlements[item]) || 0)) * 15;
			$(".entitlementItem ." + item + "-minutes").html(totalMinutes);
		},
		
		setRedeemedItems : function (justRedeemed, list) {
			for (var name in list) { 
				if(!list.hasOwnProperty(name) || !name) continue;
				$("." + name).addClass("redeemed");
			}
			if(justRedeemed && justRedeemed != "") {
				if(justRedeemed.indexOf(",") != -1) {
					var temp = justRedeemed.split(",");
					for(var i = 0; i < temp.length; i++) {
						$("." + temp[i]).addClass("redeemed new");
					}
				} else{
					$("." + justRedeemed).addClass("redeemed new");
				}
			}
		},
		
		buildList : function($container, list) {
			for(var name in list) {
				if(!list.hasOwnProperty(name) || !name) continue;
				$container.append(SITE.redemption.buildListItem(name, list[name]));
			}
			return $container;
		},
		
		buildListItem : function (item, itemObj) {
			var $itemName = $("<div>", {"class": "itemName"}).html(itemObj["name"]);
			var $itemDesc = $("<div>", {"class": "description"}).html(itemObj["description"]);
			var $itemContainer = $("<div>", {"class": "itemContainer"}).append($itemName).append($itemDesc);
			return $("<li>", {"class" : "entitlementItem " + item}).append($itemContainer);
		}
};

// By using head.ready() instead of document.ready(), we avoid some of the odd
// potential scheduling conditions that may arise
// and as a side-effect, we can tidy up SITE.core.init a little too.

head.ready("jquery.mousewheel-3.0.6.min.js", function() {

	SSO.utility.log("head.ready() fired in common.js");

	/*
	 * Update message in Link Consoles sidebar title
	 */
	$("ul#consoles li.link, ul#consoles li.unlink").mouseover(
			function() {
				var account = $(this).attr('rel'), message = ($(this).attr(
						'class') == "link") ? "LINK YOUR " : "UNLINK YOUR ";

				$("#account-profile.SSO-PAGE #link-consoles h5").html(
						message + "<em>" + account + "</em>");

			});

	$("ul#consoles li")
			.mouseout(
					function() {
						var standard = $(
								"#account-profile.SSO-PAGE #link-consoles h5")
								.attr('rel');

						$("#account-profile.SSO-PAGE #link-consoles h5").html(
								standard);
					});

	/*
	 * Returns user to Social Accounts Tab after they have linked their account
	 * URL will contain one of the following values #facebook, #twitter,
	 * #youtube
	 */
	var hash_tag = window.location.hash;
	if (hash_tag == "#facebook" || hash_tag == "#youtube"
			|| hash_tag == "#twitter") {
		$("#nav-gaming a").removeClass('active');
		$("#nav-social a").addClass('active');
		$("#social-accounts").removeClass('hide');
		$("#gaming-accounts").addClass('hide');
	}

	/*
	 * Help Tooltip functionality
	 */
	var tooltipLeftOffset = -155;

	var passwordPairs = [ [ 'input#password', 'input#retype-password' ],
			[ 'input#newPassword', 'input#retype-password' ],
			[ 'input#createNewPassword', 'input#retype-createNewPassword' ] ];
	var passwordLocation, retypePasswordLocation;

	for (i in passwordPairs) {
		passwordLocation = $(passwordPairs[i][0]);
		retypePasswordLocation = $(passwordPairs[i][1]);
		if (passwordLocation.length > 0) {			
			passwordLocation.cluetip({
				local : true,
				hidelocal : false,
/*				positionBy : 'fixed',
				leftOffset : tooltipLeftOffset,	*/
				positionBy : 'fixed',
				topOffset : 180,
				leftOffset : 10,
				onShow : function(e) {
					e.css('margin-top', e.height() * -1);
					$('#cluetip div.cluetip-arrow').remove();
					$('#tooltip-passwordrequirements p, #tooltip-passwordrequirements em')
						.css('text-align', 'center');					
				}
				
			});

			(function(passwordLocation, retypePasswordLocation) {
				passwordLocation.change(function() {
					retypePasswordLocation.val('');
				});
			})(passwordLocation, retypePasswordLocation);
		}
	}

	$('input#email-address').change(function() {
		$('input#retype-email-address').val('');
	});
  	
	$('input#forum-name').cluetip({
		width : 140,
		local : true,
		hidelocal : false,
		positionBy : 'fixed',
		topOffset : 90,
		leftOffset : 10,
		onShow : function(e) {
			e.css('margin-top', e.height() * -1);
			$('#cluetip div.cluetip-arrow').remove();
			$('#tooltip-forumname p').css('text-align', 'center');
			$('.ui-cluetip-content').css('padding', '0 4px 5px');
		},
		onHide : function(e) {
			$('.ui-cluetip-content').css('padding', '0 4px 5px 10px');
		}
	});
	
	$('input#heroesId').cluetip({
		width: 140,
		local: true,
		hidelocal: false,
		positionBy: 'fixed',
		topOffset: 90,
		leftOffset: 10,
		onShow: function(e) {
			e.css('margin-top', e.height() * -1);
			$('#cluetip div.cluetip-arrow').remove();
			$('#tooltip-heroesid p').css('text-align', 'center');
			$('.ui-cluetip-content').css('padding', '0 4px 5px');
		},
		onHide : function(e) {
			$('.ui-cluetip-content').css('padding', '0 4px 5px 10px');
		}
	});
	
	(function () {
		var tooltipInputs = ["div.tooltip-pass", "div.tooltip-fname", "div.tooltip-heroesid"];

		tooltipInputs.forEach(function(value) {
			var that = value;

			$("input[rel=" + '"' + that + '"' + "]").focus(function() {
				//Accessibility feature: Force cluetip display when tabbing 
				$(this).trigger("mouseover");
				
				//For mobile:
				$($(that)[0]).slideDown(); 
			});

			$("input[rel=" + '"' + that + '"' + "]").blur(function() {
				//Accessibility feature: Force cluetip hide when tabbing 
				$(this).trigger("mouseout");

				//For mobile:
				$($(that)[0]).slideUp();
			});
			
		});
	})();
	
	// only for ingame registration
	(function() {
		var tooltipInputs = [".tooltip-fname", ".tooltip-pass"];
		
		tooltipInputs.forEach(function(value) {
			var that=value;
			
			if($("body .ingame").length)
				$(".ingame input[rel='div.tooltip-pass'], .ingame input[rel='div.tooltip-fname']").unbind("blur").unbind("focus").unbind("hover");
			
			$(that).click( function(){
				$($(".ingame div.tooltip" + that)[0]).slideDown();
			});
			
			$(that + " .close").click( function(e) {
				e.stopPropagation();
				$(this).parent().slideUp();
			})
			
		})
	})();
	
	// Elite Registration FAQ
	// Hide (collapse) the toggle containers
	// on load
	$('#why-link dd').hide();

	// Switch the "Open" and "Close" state
	// per click
	$('#why-link dt').click(function() {
		if(!$(this).hasClass("active"))
			$(this).addClass('active');
		else 
			$(this).removeClass('active');
	});
	
	// Slide up and down on click
	$('#why-link dt').click(function() {
		$(this).next('#why-link dd').slideToggle('fast');
	}).first().trigger('click');

	$('.open-email-verification-box').click(function() {
		var tabIndx = $('.open-email-verification-box').index($(this));

		$('.open-email-verification-box').eq(tabIndx).hide();
		$('.email-verification-box').eq(tabIndx).slideDown('slow');
	});

	$('.close-email-verification-box').click(function() {
		var tabIndx = $('.close-email-verification-box').index($(this));

		$('.email-verification-box').eq(tabIndx).slideUp('slow');
		$('.open-email-verification-box').eq(tabIndx).show();
	});

	$('.SSO-PAGE select').customStyle();
	$('.SSO-PAGE select, .SSO-MODAL select').change(function() {
		SITE.util.adjustHeightOfSelect();
	});
	
	if(SITE.util.hasQuery("privilegeFirstParty")) {
		isFPPOnly = SITE.util.getQueryValue("privilegeFirstParty");
		if(isFPPOnly) {
			$("body").addClass("privilege-first-party");
			//update login/register links to have same query
			ssobar.onReady(function() {
				$(".sso-login-button, .mobile-menu-login a").attr("href", $(".sso-login-button").attr("href") + "?privilegeFirstParty=true");
				$(".sso-register-button, .mobile-menu-register a").attr("href", $(".sso-register-button").attr("href") + "?privilegeFirstParty=true");
			});
			
			$("#login-need-account").attr("href", $("#login-need-account").attr("href") + "?privilegeFirstParty=true");
			$(".backtologin a").attr("href", $(".backtologin a").attr("href") + "?privilegeFirstParty=true");
		}
	}

	var isAlexaLogin = SITE.util.getQueryValue("alexaLogin");
	if(isAlexaLogin == 'true') {
		$("#console-login").find(".battle, .mobile").hide(); //add mobile?
		$(".network-select.console-login").show();
		
		$("#login #frmLogin").attr("action", 
				$("#frmLogin").attr("action") 
					+ (SITE.util.hasQueryString($("#frmLogin").attr("action")) ? "&" : "?") + "alexaLogin=true");
		$("#register-email #register-full").attr("action", 
				$("#register-email #register-full").attr("action") 
					+ (SITE.util.hasQueryString($("#register-email #register-full").attr("action")) ? "&" : "?") + "alexaLogin=true");
		$("#login #login-need-account").attr("href", 
				$("#login-need-account").attr("href") 
					+ (SITE.util.hasQueryString($("#login-need-account").attr("href")) ? "&" : "?") + "alexaLogin=true");
		
	}

	$("#console-login").show();
	$(".network-select.console-login").show();
	$(".cod-login-step1").show();
	$("#login-info .chooseLogin").show();

	SITE.core.init();

	// Make sure profile page gets wired up

	if ($('#account-profile').length) {
		SITE.profile.init();
	}
	
	if ($('#register.missingInformation').length) {
		SITE.profile.authentication.init();
	}

	// Wire ToS check, if needed

	SITE.checkForTOSUpdate();

	//remove once checkbox is put in place
	$("#acceptCurrentTOS").on('click', SITE.acceptCurrentTOS);

	// Display security question modal if necessary

	if ($('#needSecurityQuestion').length && $('#account-profile').length && !$('#needNewTOS').length) {
		$('#securityQuestionRequiredModal').modal({
			overlayClose : true,
			minHeight : 325
		});
	}
	
	// Logic for newsletter disabling

	if ($("#Newsletter").length) {
		SITE.newsLetterUnticked = true;
		$("#Newsletter").click(function() {
			SITE.newsLetterUnticked = !SITE.newsLetterUnticked;
		});
	}

	// Logic for Facebook delinking
	// TODO: PORT-486

	if (("#facebookAccountUnlink").length) {
		$("#facebookAccountUnlink").click(function(e) {
			e.preventDefault();
			$("#createPasswordModal").show();
		});
	}
	
	// CRM button setup
	
	var isLoggedIn = SSO.utility.getCookie("ACT_SSO_COOKIE") && SSO.utility.getCookie("ACT_SSO_COOKIE").length;
	
	$('#globalOptOut:checkbox').change(function () {
	   if($(this).attr("checked")) 
	   {
		   //$('[name="subscriptions"]').removeAttr('checked');
		   $('[name="subscriptions"]').attr('disabled', 'true');
	   } else {
		   if(isLoggedIn)
			   $('[name="subscriptions"]').removeAttr('disabled');
	   }
	});
	
	//PORT-1787 Fix for advancing without having  a Security Question selected  
	$('#placeholder-securityQuestionRequired').keypress(function(e){
	    if ( e.which == 13 && 
	     $('#placeholder-securityQuestionRequired button.submit').hasClass('disabled')) 
	      // Enter key = keycode 13 and button is disabled
	    {
	       e.preventDefault();
	    }
	});

	SITE.linkAccount.init();
	SITE.accountDeletion.init();

	// TODO move this to an appropriate setup function 
	(function() {
		var form = $("#preferences-form");
		form.find(".submit").click(function(e) {
			e.preventDefault();

            var queryDict = {}
            location.search.substr(1).split("&").forEach(function(item) {queryDict[item.split("=")[0]] = item.split("=")[1]})

            var data = form.serializeArray();
            data.push({name: "unoId", value: queryDict["user"]});

			$.ajax({
				type : 'POST',
				headers: SSO.csrf.getCSRFObj(),
				data: data,
				async: false,
				url: SITE.core.apiUrl + "/updatePreferences",
				success: function(d) {
					$("#note_update").fadeIn(500).delay(3000).fadeOut(500);

					var isGlobalOptOut = $(".opt-out").find("input[id='globalOptOut']").prop("checked");
					var isSmsSelected = $(".opt-out").find("input[id='smsOptOut']").prop("checked");
					var isEmailSelected = $(".opt-out").find("input[id='emailOptOut']").prop("checked");
					SITE.preferences.setGlobalOptOut(isGlobalOptOut || isSmsSelected || isEmailSelected);
                    // TODO waiting a definition about SMS channel subscriptions
				}
			});
		});

		if(form.length > 0){
			SITE.preferences.init();
		}
		if (location.pathname.match('ghosts-monster') || location.pathname.match('ghosts-monster-eu')) {
			if (location.pathname.match('linkAccount') &&  window.self === window.top ) { // Monster promotion workaround to remove a body class to indicate if the file is not loaded in iframe
				$("body").removeClass("account-linking-page");
			} 
			
			var loginLink = $('#login-need-account');
			if(loginLink.length > 0) {
				loginLink.attr('target', '_blank'); 
				var $loginLabel = $('.login-page section h3'); if ($loginLabel) { $loginLabel.text('Redeem Your Code');}
			}	
			
			if (window.self != window.top) { // in iframe 
				$("html").addClass("iframe");
				var xblLinkAnchor = $('#xblLinkAnchor');
				if (xblLinkAnchor != null) {
					xblLinkAnchor.attr('target', '_blank');
				}
				var psnLinkAchor = $('#psnLinkAnchor');
				if (psnLinkAchor != null) {
					psnLinkAchor.attr('target', '_blank');
				}
				var steamLinkAchor = $('#steamLinkAnchor');
				if (steamLinkAchor != null) {
					steamLinkAchor.attr('target', '_blank');
				}
			}
		
		}
		
	})();

	SITE.sms.init();
	SITE.banner.init();
	SITE.tfa.init();
	SITE.oauth.init();
	
	//		For Mixed Clans pages only:
	
	(function() {
		if($("#mixedClans").length) {
		
			var hiddenInfo = mixedClans.hiddenInfo;
			
			var selectionHandler = function () {
				var platforms = $(".platform-wrapper");	
			
				for(var i = 0; i < platforms.length; i++) {
					var hasNoUsername = !mixedClans.hiddenInfo[$(platforms[i]).attr("data") + "Username"].length;
					if(hasNoUsername)
						$(platforms[i]).addClass("cannot-select");
					
					if($(platforms[i]).hasClass("empty") || $(platforms[i]).hasClass("cannot-select")) continue;
					
					$(platforms[i]).find(".select-box").click( function(e) {
						e.preventDefault();
						$("#mixedClans").find(".selected").removeClass("selected");
						$(this).parents(".platform-wrapper").addClass("selected");
					});
				}
				
				var pgacct = hiddenInfo.chosenNetwork || SSO.utility.getCookie('pgacct') || "";
				var $pgacct = $("." + pgacct);
				
				if(pgacct.length && !$pgacct.hasClass("cannot-select"))
					$pgacct.addClass('selected');
				
				if((mixedClans.hiddenInfo.isOwner == "false") && (hiddenInfo.chosenNetwork == "")) {
					$(".selected").removeClass("selected");
					$(".platform-wraper-container .button-container").addClass("cannot-select");
				}
			};
			
			var setEmptyPlayerLists = function () {
				$(".platform-wrapper").each( function () {
					var playersNotFound = $(this).find("li").hasClass("empty");
					if(playersNotFound) 
						$(this).addClass("empty");
				});
			};
			
			var sendChoiceHandler = function () {
				$("#mixedClans .button-container .continue").click(function(e) {
					e.preventDefault();
					if(!$(".selected").length || $(".selected").hasClass("empty") || $(".selected").hasClass("cannot-select")) return;
										
					$.ajax({
						url: "chooseClanPlatform",
						headers: SSO.csrf.getCSRFObj(),
						data: {
							"teamId": hiddenInfo.teamId,
							"selection": $(".selected").attr("data")
						}
					}).success(function() {
						console.log("sendChoice: success");
						$(".mixed-clans-modal-container").show();
					}).fail(function() {
						console.log("sendChoice: failure");
					}).complete(function() {
						console.log("sendChoice: sending selection complete");
					});
			});
				
			};
			
			var modalHandler = function () {
				$(".mixed-clans-modal-container").click(
					function(){ $(".mixed-clans-modal-container").hide(); }).children().click(
						function(){return false;}).find(".masthead-image").click(
							function(){ window.location=$(this).attr("href"); });
			};
			
			$(".player-list").mCustomScrollbar();
			setEmptyPlayerLists();
			selectionHandler();
			sendChoiceHandler();
			modalHandler();
			
			if(!!$(".not-clan-leader").length) $(".platform-wrapper").addClass("cannot-select");
		}
	})();
});

var entitlementsObject = entitlementsObject || "";

if(entitlementsObject && entitlementsObject.unlockedMessage != "") 
	SITE.redemption.init();

SITE.consoleFirst = {
	init : function () {
		var intent;
		if ($("#console-first").length) {
			intent = "register";
			this.buildAccountLinks(intent);
		} else if ($(".network-select.console-login")) {
			if($("#sign-up #console-login").hasClass("network-select-container")) {
				intent = "signup";
			} else if ($("#register-beachhead")) {
				intent = "signup";
			} else {
				intent = "login";
			}
			this.buildAccountLinks(intent);
		}
		
	},

	buildAccountLinks : function (intent) {
		networkTypes = [];
		$(".network-select").find("li").each(function(){ networkTypes.push($(this).attr("class"));});
		
		var baseEndPoint = "/thirdPartyAuth";
		if(intent == "signup")
			baseEndPoint = "/signup/firstParty"

		for(var i = 0; i < networkTypes.length; i++) {
			var returnURL = encodeURI(SSO.utility.getApiUrl() + baseEndPoint + "/resolve/" + networkTypes[i]);
			var currUrl = SSO.utility.getApiUrl() + baseEndPoint + "/init/" + networkTypes[i] 
				+ "?intent=" + intent + "&returnURL=" + returnURL;
			
			if(ssobar && ssobar.locale != "") {
				currUrl += "&mkt=" + ssobar.locale
			}
			
			var link = $(".network-select").find("." + networkTypes[i]).find("a");
			var linkHref = $(link[link.length-1]).attr("href");
			if(linkHref.length == 0){
				link.attr("href", currUrl);
				
				/* START Google Tag Manager - first party login buttons */
				var $firstPartyLoginLink = $(link[link.length-1]);
				$firstPartyLoginLink.click(function(e) {
					var platform = $(this).parent().attr("class");
					var label = "";
					switch (platform) {
						case "psn":
							label = "ps";
							break;
						case "xbl":
							label = "xbox";
							break;
						case "battle":
							label = "battlenet";
							break;
						case "steam":
							label = "steam";
							break;
						case "nintendo":
							label = "nintendo";
							break;
						default:
							label = "unknown";
					}
					
		            dataLayer.push({
		                event: "interaction",
		                category: "interaction",
		                action: "sign in",
		                label: label
		            });
				});
				/* END Google Tag Manager - first party login buttons */				
			}
		}
	}
};

SITE.consoleFirst.init();

SITE.blackops3beta = {
		init : function () {
			if($("#redeemCodeForm").find("#region").length > 0) {
				this.blackops3betaHandlers();
			}
		},
		
		blackops3betaHandlers : function () {
			$("#redeemCodeForm button").click( function(e) {
				if($("#region").val() == "") {
					e.preventDefault();
					return false;
				}
				
				return true;
			});
		}
};

SITE.blackops3beta.init();

SITE.codingame = {
		init: function () {
			if($(".registrationComplete-modal.ingame").length > 0) {
				this.displayFPText();
			}
		},
		displayFPText: function () {
			var platform = SSO.utility.getCookie("platform");
			$(".registrationComplete-modal.ingame").addClass(platform);
		}
};

SITE.codingame.init();

SITE.fuelupforbattle = {
	init: function () {
		if($(".close-link").length) {
			this.setCloseLink();
		}
	},
	
	setCloseLink: function () {
		var closeLink = decodeURIComponent(SSO.utility.urlParameters['redirectUrl']);
		
		if(closeLink == "undefined")
			 closeLink = "http://www.fuelupforbattle.com";
		
		if(closeLink && closeLink.length > 0)
			$(".close-link").attr("href", closeLink);
	}
};

SITE.fuelupforbattle.init();


SITE.fuelupforbattleca = {
    maxMinutes: 60 * 60,

    init: function () {
		ssobar.onReady(SITE.fuelupforbattleca.removeLangQuery); 
			
    	
        var ent = { 
            eName: "",
            eValue: "",
            totalMinutes: 0,
            hasCallingCard: false,
            hasCamo: false
        };

        if(typeof entitlements != "undefined" && entitlements != "") {
            this.parseEntitlements(ent, entitlements);
        } else if(typeof entitlementsObject != "undefined" && entitlementsObject != "") {
            this.parseEntitlements(ent, entitlementsObject.promotionEntitlements);
            
            if(entitlementsObject.entitlementValue && entitlementsObject.entitlementValue.length > 0) {
            	$(".unlock-text .minutes-unlocked").html(entitlementsObject.entitlementValue);
            }
        }

        if ($(".time-container").length > 0)
        	this.setProgress(ent.totalMinutes, this.maxMinutes);
    },
    
    removeLangQuery: function () {
    	var localeLinks = $(".sso-locale-list-container").find("li a");
        var removeLang = new RegExp("[&]?lang=\\w{5}");
        var removeAmp = new RegExp("[?&]&");

        $(localeLinks).each(function() {
        	var href = $(this).attr("href");
    		
        	href = href.replace(removeLang, "");
        	href = href.replace(removeAmp, "");
        	
        	$(this).attr("href", href);
        });
    },

    parseEntitlements: function (entCon, entitlements) {
        //Begin some ugly string parsing, ask Kurt to see if I can't get it in some readable JSON format
        var textList = {hasCallingCard: "calling-card", totalMinutes: "totalMinutes", hasCamo: "camo"};

        $.each(textList, function (key, value) {
          var re = new RegExp("(" + value + ")=([\\w\\d]*)[,}]");
          var results = entitlements.match(re);
          if(results && results[1] == value)
          entCon[key] = results[2];
        });
    },

    setProgress: function (totalMinutes, maxMinutes) {
        var transform_styles = ['-webkit-transform', '-ms-transform', 'transform'];

        var rotation = (totalMinutes/maxMinutes) * 180;
        var fillFixRotation = rotation * 2;

        for(i in transform_styles) {
            $(".fill, .mask.half").css(transform_styles[i], 'rotate(' + rotation + 'deg)');
            $(".fill.fix").css(transform_styles[i], 'rotate(' + fillFixRotation + 'deg)');
        }

        this.setTime(totalMinutes);
    },

    setTime: function (totalMinutes) {
        if(totalMinutes > 0) {
          var hours = Math.floor(totalMinutes / 60);
          var minutes = Math.floor(totalMinutes % 60);

          if(hours < 10) hours = "0" + hours;
          if(minutes < 10) minutes = "0" + minutes;

          $(".time-container").find(".hours .number").html(hours);
          $(".time-container").find(".minutes .number").html(minutes);
        } else {
          $(".time-container").find(".hours .number").html("00");
          $(".time-container").find(".minutes .number").html("00");
        }
    }
};


if(location.pathname.match("fuelupforbattle-ca")) 
    SITE.fuelupforbattleca.init();

SITE.bo3monstereu = {
	t : 0,
	days : 0,
	hours : 0,
	minutes : 0,
	seconds : 0,
	enddate : Date.parse("November 6 2015"),
	
	init: function(){
		if($(".launch-countdown").length > 0){
			this.startCountdown();
		}
		
		if(typeof(entitlements) != "undefined" && entitlements != ""){
			console.log(entitlements);
			var time = this.parseEntitlements(entitlements);
			$(".zombie-minutes-number").html(time.minutes);
			$(".zombie-hours-number").html(time.hours);
		}
		else if(typeof(entitlementsObject) != "undefined" && entitlementsObject != ""){
			console.log(entitlementsObject);
			var newMinutes = parseInt(entitlementsObject.entitlementValue);
			$(".new-minutes-number").html(newMinutes);
			
			var time = this.parseEntitlements(entitlementsObject.promotionEntitlements);
			
			$(".zombie-minutes-number").html(time.minutes);
			$(".zombie-hours-number").html(time.hours);
		}
	},
	parseEntitlements :  function(ents){
		var time = ents.substr(ents.indexOf("totalMinutes"));
		time = time.substring(time.search(new RegExp("[:=]"))+1, time.search(new RegExp("[,}]")));

		var mins = parseInt(time);
		var hours = 0;
		if(mins >= 60){
			hours = Math.floor(mins / 60);
			mins -= hours*60;
		}
		return {"minutes": mins, "hours": hours};
	},
	startCountdown: function(){
		var z = this;
		z.updateClock();
		 var countdown = setInterval(function(){
			z.updateClock();
            if(z.t <= 0){
				clearInterval(countdown);
            }
        }, 1000);
	},
	updateClock : function(){
		this.t = this.enddate - Date.parse(new Date())
		var t = this.t;
        if( t > 0){
            this.seconds = Math.floor( (t/1000) % 60 );
            this.minutes = Math.floor( (t/1000/60) % 60 );
            this.hours = Math.floor( (t/(1000*60*60)) % 24 );
            this.days = Math.floor( t/(1000*60*60*24) );
        }
        this.setTime();
	},
	setTime : function(){
		var d = this.days < 10 ? "0"+this.days : ""+this.days,
            h = this.hours < 10 ? "0"+this.hours : ""+this.hours,
            m = this.minutes < 10 ? "0"+this.minutes : ""+this.minutes,
            s = this.seconds < 10 ? "0"+this.seconds : ""+this.seconds;
		$(".days-number").html(d);
        $(".hours-number").html(h);
        $(".minutes-number").html(m);
        $(".seconds-number").html(s);
	}
}

if(location.pathname.match("bo3-monster-eu"))
	SITE.bo3monstereu.init();

SITE.ghlwiiu = {
	init: function () {
		$("#frmRedeemCode").find("input").prop("disabled", true).end()
			.find("button").prop("disabled", true);
		
		ssobar.onAuthentication(this.verifyNintendoLinked);
	},

	verifyNintendoLinked: function () {
		var hasAccount = ssobar.verifyAccountLinked("nintendo");
		
		if(hasAccount) {
			$("#frmRedeemCode").removeClass("disabled")
				.find("input").prop("disabled", false).end()
				.find("button").prop("disabled", false);
		} else {
			$("#frmRedeemCode").addClass("disabled");
		}
	}
};

if(location.pathname.match("ghl-wiiu"))
	SITE.ghlwiiu.init();

SITE.bo3team = {
		init: function () {
			this.addHandlers();
		},
		
		addHandlers: function () {
			//create team
			$(".create form").submit(function(e) {
				e.preventDefault();
				var teamName = $(this).find("input").val();
				var leagueName = $(this).find("select").val();
				
				if(teamName.length && leagueName.length)
					SITE.bo3team.createTeam(teamName, leagueName);
			});
			
			//join team 
			$(".join form").submit(function(e) {
				e.preventDefault();
				var teamCode = $(this).find("#join-code").val();
				
				SITE.bo3team.addToTeam(teamCode);
			});
			
			$(".delete .action-button").click(function(e){
				e.preventDefault();
				var teamName = $(".team-name").text();
				var psnId = $($(this).parent()[0]).attr("data-id");
				
				
				if(SITE.bo3team.canDelete($(this)))
					SITE.bo3team.removeFromTeam(teamName, psnId);
			});
			
			$(".delete-team").click( function(e) {
				e.preventDefault();
				var teamName = $(".team-name").text();
				
				SITE.bo3team.deleteTeam(teamName);
			});
			
			
		},
		
		canDelete: function (button) {
			var canDelete = false;
			
			if($(button).parent(".enabled").length)
				canDelete = true;
			
			return canDelete;
		},
		
		readStatus: function (data) {
			if(data.responseJSON && data.responseJSON.success == false) {
				if(data.responseJSON.errorMessage)
					$(".error-messaging").text(SITE.dictionary[data.responseJSON.errorCode]);
				return;
			}
			
			window.location.reload(true);
			
		},
		
		generalAJAX: function (method, url, success) {
			$.ajax({
				method: method,
				headers: SSO.csrf.getCSRFObj(),
				contentType: "application/json",
				url: url,
				complete: success
			});
		},
		
		createTeam: function (teamName, leagueName) {
			SITE.bo3team.generalAJAX("POST", "createTeam/" + teamName + "/" + leagueName , this.readStatus );
		},
		
		addToTeam: function (joinCode) {
			SITE.bo3team.generalAJAX("POST", "addToTeam/" + joinCode, this.readStatus );
		},
		
		removeFromTeam: function (teamName, psnId) {
			SITE.bo3team.generalAJAX("POST", "removeFromTeam/" + teamName + "?psnId=" + psnId, this.readStatus );
		},
		
		deleteTeam: function (teamName) {
			SITE.bo3team.generalAJAX("POST", "deleteTeam/" + teamName, this.readStatus );
		}
};

if($("body.teams-page").length)
	SITE.bo3team.init();

if($("body .2016-redeem")) {
	if(entitlementsObject && entitlementsObject.entitlementValue.match("COD Points"))
		$(".2016-redeem.points").show();
	else
		$(".2016-redeem.no-points").show();
}

if($(".cod-points.iw-beta").length > 0 && entitlementsObject && entitlementsObject.entitlementValue.match("COD Points")) {
	$(".cod-points.iw-beta").show();
}

if(location.pathname.match("2016-xp") && $("#redeemCodeSuccess").length > 0) {
	var tier = entitlementsObject.entitlementName;
	
	if(tier.indexOf("1") >= 0) {
		$("#redeemCodeSuccess .tier1-success").show();
	} else if(tier.indexOf("2") >= 0) {
		$("#redeemCodeSuccess .tier2-success").show();
	} else if(tier.indexOf("3") >= 0) {
		$("#redeemCodeSuccess .tier3-success").show();
	}
}

if(location.pathname.match("2016-xp-game") && $("#redeemCodeSuccess").length > 0) {
	var tier = entitlementsObject.entitlementValue;
	
	if(tier.indexOf("digital_legacy") >= 0) {
		$("#redeemCodeSuccess .tier2-success").show();
	} else if(tier.indexOf("digital_deluxe") >= 0) {
		$("#redeemCodeSuccess .tier1-success").show();
	}
}

if(location.pathname.match("2016-retailer") && $(".2016-retailer-redeemed").length > 0) {
	//console.log("2016-REDEEM");
	$(".2016-retailer-redeemed > div").hide();
	var tier = entitlementsObject.entitlementName;
	var resource = SSO.utility.getResourceUrl();
	if(resource.indexOf("common") >= 0) {
		resource = resource.replace("common", "2016-retailer");
	}
	resource += "/images/";
	
	if(tier.indexOf("retailer_cc") >= 0) {
		$(".2016-retailer-redeemed .callingcards").show();
		$(".2016-retailer-redeemed .callingcards .reward-img").attr("src", resource+"reward-playercard.jpg");
	} else if (tier.indexOf("bullethawk") >= 0) {
		$(".2016-retailer-redeemed .bullethawk").show();
		$(".2016-retailer-redeemed .bullethawk .reward-img").attr("src", resource+"reward-bullethawk.jpg");
	} else if (tier.indexOf("hellstorm") >= 0) {
		$(".2016-retailer-redeemed .hellstorm").show();
		$(".2016-retailer-redeemed .hellstorm .reward-img").attr("src", resource+"reward-hellstorm.jpg");
	}
}

if(SITE.util.hasQuery("errorCode") || SITE.util.hasQuery("error_code")) {	
	var errorCode = SITE.util.getQueryValue("errorCode");
	errorCode = (!errorCode) ? SITE.util.getQueryValue("error_code") : errorCode;
	
	if(errorCode == 219100) {
		$(".account-linking-error-container").show();
		$(".account-linking-error-container .psn").show();
	} else if (errorCode == 219200) {
		$(".account-linking-error-container").show();
		$(".account-linking-error-container .xbl").show();
	} else if (errorCode == 190000) {
		$(".account-linking-error-container").show();
		$(".account-linking-error-container .generic").show();
		
		$(".generic a.close-overlay").click(function(e){
			e.preventDefault();
			$(".account-linking-error-container").hide();
		})
	}
}

if(SITE.util.hasQuery("psnRelinkNeeded")) {
	var relinkNeeded = SITE.util.getQueryValue("psnRelinkNeeded");

	if(relinkNeeded)
		$(".psn-relink-needed").show();

	$(".psn-relink-needed .close").click(function(e) {
		e.preventDefault();
		$(".psn-relink-needed").hide();
	})
}

SITE.mobilegame = {
	init: function() {
		SITE.mobilegame.checkForMobileGameView();
		
		if($("#register.mobile-game").length > 0) {
			SITE.mobilegame.setPlayerId();
			
			if($(".force-modal-redirect").length > 0)
				SITE.mobilegame.initModal();
			
			ssobar.onReady(SITE.mobilegame.userLoggedInAtRegistration)
		}
		
		if(SITE.util.hasQuery("forceMobileGame") && SITE.util.hasQuery("redirectUrl"))
			SITE.mobilegame.updateLoginLink();
	},
	
	initModal: function() {
		$(".mobile-game-modal-cont").modal({close: false});
	},
	
	updateLoginLink: function() {
		$("#login-need-account").attr("href", decodeURIComponent(SITE.util.getQueryValue("redirectUrl")))
	},

	checkForMobileGameView: function() {
		if(SITE.util.getQueryValue("forceMobileGame") == 'true')
			$("html").addClass("force-mobile-game-view");
		
		if(SITE.util.getQueryValue("forceModalRedirect") == 'true')
			$("html").addClass("force-modal-redirect");
	},
	
	userLoggedInAtRegistration: function() {
		if(ssobar.user.isLoggedIn == true && ssobar.config.siteId != "cod-mobile" && ssobar.config.siteId != "codm" && ssobar.config.siteId != "wzm") {
			//disable + hide extra email stuff
			$("#email-address").attr("disabled", "disabled");
			$("label[for=email-address]").hide();
			
			$("#password-data-row").hide();
		}
	},
	
	setPlayerId: function() {
		if(SITE.util.hasQuery("playerId")) {
			var pi = SITE.util.getQueryValue("playerId");
			
			if($("#register.mobile-game").length)
				$("#register-full").find("input#playerId").val(pi);
		}
	}
};

SITE.authTokenManager = {	
	init: function() {
		if($("#auth-token-manager").length) {
			SITE.authTokenManager.initHandlers();
			SITE.authTokenManager.loadTokens();
		}
	},

	initHandlers() {
		SITE.authTokenManager.setupUpgradeRequestButton();
		SITE.authTokenManager.setupUpgradeCancelButton();
		SITE.authTokenManager.setupUpgradeSendButton();
	},

	//TODO: remove alerts and replace with messaging, delayed, then refresh?
	setupRevokeButton: function() {
		var $button = $(".token-pane").find(".revoke-button");

		$button.click(function(e) {
			e.preventDefault();
			var $this = $(this);
			var token = $this.data("token");

			$.ajax({
					headers: SSO.csrf.getCSRFObj(),
					datatype : "json",
					url : "/cod/authTokens/revoke/" + token,
				})
				.done(function(d) {
					alert("Revoked!");
					$this.parents("li").first().remove();
				})
				.fail(function(e) {
					alert("Error! " + e);
				});
		});
	},

	setupUpgradeRequestButton: function() {
		$(".upgrade-request-button").click(function(e) {
			e.preventDefault();
			$(".access-profile-grant-request").show();
		});
	},

	setupUpgradeCancelButton: function() {
		$(".access-profile-grant-request .cancel-button").click(function(e) {
			e.preventDefault();
			$(".access-profile-grant-request").hide();
		});
	},

	setupUpgradeSendButton: function() {
		$(".tos-check-cont input").on("change", function(){
			$(".tos-check-cont").removeClass("error");
		})
		
		$(".access-profile-grant-request .send-button").click(function(e) {
			e.preventDefault();
			
			if(!$(".tos-check-cont input").prop("checked")) {
				$(".tos-check-cont").addClass("error");
				return;
			}
			
			var requesterName = $(".requester-name-input").val();
			var organization = $(".organization-input").val();
			var requestedProfile = $(".requested-profile-input").val();
			var description = $(".description-input").val();
			
			var obj = { requesterName, organization, description, requestedProfile };
			
			var data = {
				headers: SSO.csrf.getCSRFObj(),
				type: "POST",
				url: "/cod/authTokens/accessProfileUpgradeRequest",
				data: JSON.stringify(obj),
				contentType: "application/json"
			};
			
			//TODO remove alert? Migrate to messaging?
			$.ajax(data)
				.done(function(d) {
					alert("Request received");
					window.location.reload();
				})
				.fail(function(e) {
					alert(e);
				});
		});
	},

	loadTokens: function() {
		var $tl = $(".token-list");

		$.getJSON("/cod/authTokens/list")
			.done(function(d) {
				$tl.html("");
				ssobar.onReady(function() {
					$tl.append(SITE.authTokenManager.renderTokenMarkup(d));
				});
				SITE.authTokenManager.setupRevokeButton();
			}).fail(function(e) {
				$tl.html("");
				$tl.append(
					$("<li>").append(
						$("<p>").text("There was an error loading your tokens; you may need to re-login")));
			});
	},

	renderTokenMarkup: function(data) {
		var tokens = data.authTokens || [];
		var elems = [];

		tokens.forEach(
			function(token) { 
				elems.push(SITE.authTokenManager.renderTokenFromTemplate(token)); 
			}
		);

		return elems;
	},

	renderTokenFromTemplate: function(token) {
		var $li = $("<li>");
		var $div = $("<div class='token-fields'>");
		
		$div.append($("<p>").html('<span class="label-text">Domain:</span> ' + token.domain));
		$div.append($("<p>").html('<span class="label-text">Token:</span> ' + token.authToken));
		$div.append($("<p>").html('<span class="label-text">Expires:</span> ' + new Date(token.expiry)));
		$div.append($("<p>").html('<span class="label-text">Access profiles:</span> ' + token.accessProfiles.join(", ")));
		$div.append($("<p>").html('<span class="label-text">Raw JSON:</span> ')
				.append($("<span>").text(JSON.stringify(token))));
		
		$li.append($div).append($("<a>Revoke</a>").addClass("revoke-button").data("token", token.authToken));

		return $li;
	}
}

SITE.anonymousOptOut = {
	init: function() {
		if($(".anonymous-opt-out form").length > 0)
			SITE.anonymousOptOut.setupIntentHandler();
	},
	
	setupIntentHandler: function() {
		var $aooForm = $(".anonymous-opt-out #anonOptOutIntentForm");
		
		$aooForm.find("button").click(function(e) {
			e.preventDefault();
			var state = $aooForm.data("state");
			var code = $aooForm.data("code");
			var url = $aooForm.attr("action") + "?";
			
			var intents = SITE.anonymousOptOut.getIntent($aooForm);
			
			url = url + (intents.length > 0 ? "pref=" + intents + "&" : "");
			url = url + "state=" + state + "&";
			url = url + "code=" + code;
			
			window.location = url;
		})
	},
	
	getIntent: function($form) {
		var intents = [];
		$.each($form.find("input:checked"), function() {
			intents.push($(this).attr("name"));
		})
		
		return intents;
	}
}

SITE.cdl = {
	init: function() {
		if($("#favTeam-data-row").length) {
			SITE.cdl.favoriteTeamSort();
			SITE.cdl.multiSelectHandlers();
			SITE.cdl.multiSelectFieldInit();
		}
	},
	
	favoriteTeamSort: function() {
		var $teamList = $(".multi-select-list ul");
		$teamList.html($teamList.find("li").sort(
				function(a, b) {
					return $(a).text() < $(b).text() ? -1 : 1;
				}));
		
	},

	multiSelectHandlers: function() {
		var $teams = $(".multi-select-list li");
		var maxSelectionsAllowed = 1000;
		
		$teams.click(function() {
			var count = $(".multi-select-counter .count").text() == "" ? 0 : $(".multi-select-counter .count").text();
			
			if($(this).hasClass("selected")) {
				$(this).removeClass("selected");
			} else if(!$(this).hasClass("selected") && count < maxSelectionsAllowed) {
				$(this).addClass("selected");
			}

			SITE.cdl.updateMultiSelectFieldData();
			SITE.cdl.updateSelectionCount();
			
			var newCount = $(".multi-select-counter .count").text() == "" ? 0 : $(".multi-select-counter .count").text();
			
			if(newCount > 0) {
				$(".multi-select-counter .label-default").hide();
				$(".multi-select-counter .label-selected").show();
				$(".multi-select-counter .count").show();
			} else {
				$(".multi-select-counter .label-default").show();
				$(".multi-select-counter .label-selected").hide();
				$(".multi-select-counter .count").hide();
			}
		})
	},

	updateSelectionCount: function() {
		var count = 0;
		$(".multi-select-list li").each(function(index, elem) {
			$(elem).hasClass("selected") ? count++ : "";
		});
	},

	updateMultiSelectFieldData: function(item) {
		var count = 0;
		var $counter = $(".multi-select-counter .count");
		var $msf = $("#favorite-team");
		var teamIds = "";

		$(".multi-select-list li").each(function(index, elem) {
			if($(elem).hasClass("selected")) {
				teamIds += (teamIds.length == 0) ? "" : ";";
				teamIds += $(elem).data("teamid")
				
				count++
			}
		})

		$msf.val(teamIds);
		$counter.text(count);
	},
	
	multiSelectFieldInit: function() {
		var $multiSelect = $(".multi-select-counter");
		var $teamsList = $(".multi-select-list");
		$multiSelect.click(function(e) {
			$teamsList.toggle();
		});
		
        document.onclick = function(e) {
            if(!$teamsList.find($(e.target)).length && !$multiSelect.find($(e.target)).length &&
               !$teamsList.is($(e.target)) && !$multiSelect.is($(e.target)) &&
                $teamsList.css("display") === "block") {
            	$teamsList.hide();
            }
        };		
	}
};

SITE.temp141 = {
	init: function() {
		if($("#login").length) {
			SITE.temp141.render141Header();
		}
	},
	
	//FOR VIP-CARD REDEMPTION: TEMPORARILY REPLACE COD HEADER and LOGO WITH 141 WELCOME TITLE
	render141Header: function() {
		var $url = window.location.href;
		if($url.includes("vip-card")) {
			$("#login > article > section > h3").html("WELCOME TO THE 141");
			$("#login > article > section > h3").css("font-size", "40px");
		}
	}
};

SITE.banner = {
	init: function() {
	    SITE.banner.loadUpdatedPrivacyPolicy();
	},

	loadUpdatedPrivacyPolicy: function() {
	    if(typeof SSO.utility.getCookie("atvi-privacy-policy-updated") == 'undefined') {
	        var $banner = $(".atvi-privacy-policy-module");
	        if($banner.length) {
	            $banner.addClass("show");
	            $banner.find(".close-modal").on("click", function() {
	                $banner.removeClass("show");
	                SSO.utility.setCookie('atvi-privacy-policy-updated', true, {expireDate: (3600 * 24 * 365)});
	            });
	        }
	    }
	}
}

SITE.tfa = {
	init: function() {
		if($("section.tfa-init").length && $(".two-factor-authentication-modal-container").length == 0)
			SITE.tfa.initializeTFA.init();
		if($(".tfa-form-container").length)
			SITE.tfa.loginTFA.init();
		if($(".setup-tfa").length)
			SITE.tfa.wireAnnouncementSecureSession();
		SITE.tfa.wireModalLinks();
	},
	
	util: {
		generateTFAInitializationUri: function(callback) {
			$.ajax({
				url: SSO.utility.getApiUrl() + "/init2FAEnrollment",
				headers: SSO.csrf.getCSRFObj(),
				type: "POST",
				success: callback
			});
		},
		
		generateQR: function(uri) {
			var $tfabody = $(".tfa-init-body #tfa-code");
			$tfabody.qrcode({
				width: 130, 
				height: 130,
				text: uri
			});
			
			return null;
		},
		
		submitTFAInitRequest: function(password, code, callback) {
			$.ajax({
				url: SSO.utility.getApiUrl() + "/complete2FAEnrollment",
				data: JSON.stringify({
					"password": password,
					"code": code
				}),
				contentType: "application/json",
				headers: SSO.csrf.getCSRFObj(),
				type: "POST",
				success: callback
			});
		},
		
		getSecret: function(url) {
			
			var secret = decodeURIComponent(url).match(/secret=(.*?)&/);
			if(secret.length > 1)
				return secret[1];
			
			return "";
		},
	},
	
	loginTFA: {
		init: function() {
			SITE.tfa.loginTFA.handlers();
			if(SITE.util.getQueryValue("codeInvalid"))
				SITE.tfa.loginTFA.showError();
			if(SITE.util.getQueryValue("timeout"))
				SITE.tfa.loginTFA.setupSubmitTimeout();
		},
		
		handlers: function() {
			$(".tfa-form-container .support-link").off("click").on("click", function(e) {
				e.preventDefault();
				$(".tfa-form-container").fadeOut(500, function() {
					$(".backup-form-container").fadeIn(500);
				});				
			});
			
			$(".backup-form-container .backup-code-cancel-link").off("click").on("click", function(e) {
				e.preventDefault();
				$(".backup-form-container").fadeOut(500, function() {
					$(".tfa-form-container").fadeIn(500);
				});
			});
		},
		
		showError: function() {
			if($(".tfa-form-container").length) {
				$(".tfa-form-container #code").addClass("tfa-field-error");
				$(".tfa-form-container #code-error").addClass("active");
			}
			if($(".backup-form-container").length) {
				$(".backup-form-container #code").addClass("tfa-field-error");
				$(".backup-form-container #backup-code-error").addClass("active");
			}
		},
		
		setupSubmitTimeout: function() {
			var $tfa = $(".tfa-form-container");
			var $submit = $tfa.find("button");
			var timeout = $submit.data("timeout") || 0;
			if(timeout && timeout > 0) {
				$submit.prop("disabled", true);
				$submit.addClass("disabled");
				var currTime = Date.now();
				var unlockTime = currTime + (timeout * 1000);
				var timer = setInterval(function() {
					currTime = Date.now();
					if(currTime >= unlockTime) {
						$submit.removeClass("disabled");
						$submit.prop("disabled", false);
						clearInterval(timer);
					}
				}, 1000)
			}
				
		}
	
	},
	
	initializeTFA: {
		init: function() {
			 SITE.tfa.util.generateTFAInitializationUri(SITE.tfa.initializeTFA.updateInitializationPage);
			 SITE.tfa.initializeTFA.handlers();
			 SITE.tfa.initSessionCountdown();
		},
		
		updateInitializationPage: function(uri) {
			if(!uri)
				return; // error
			
			var secret = SITE.tfa.util.getSecret(uri);
			$(".tfa-init").find(".manual-code").html(secret);
			SITE.tfa.util.generateQR(uri);
				
		},
		
		submitTFAInitSuccess: function(data) {
			if(data && data.status == "valid")
				SITE.tfa.initializeTFA.showSuccess(data);
			else
				SITE.tfa.initializeTFA.showError();
		},
		
		populateBackupCodes: function(codes) {
			var $success = $(".tfa-success");
			var $codeCont = $success.find(".backup-code-list");
			
			for(var i = 0; i < codes.length; i++) {
				$codeCont.append($("<li>", {
					class: "code",
					text: codes[i]
				}));
			}
		},
		
		showSuccess: function(data) {
			var is2FAInitPage = $("#init2falanding-page").length;
			
			if(data.backupCodes) {
				SITE.tfa.initializeTFA.populateBackupCodes(data.backupCodes);
			}
			
			if(!is2FAInitPage) {
				$(".simplemodal-close").click();
				
				$(".two-factor-authentication-modal-container .tfa-success").modal({
					appendTo: ".privacy-security-settings-container",
					minHeight: "450px"
				});
				
				$(".close-2fa-modal").off("click").on("click", function(e) {
					e.preventDefault();
					$(".simplemodal-close").click();
					window.location.reload();
				});
			} else {
				$(".tfa-init").hide();
				$(".tfa-success").show();
				
				$(".close-2fa-modal").off("click").on("click", function(e) {
					e.preventDefault();
					window.location.reload();
				})
			}
			
		},
		
		showError: function() {
			//highlight fields and request trying again making sure to update the OTP;			
			if($(".tfa-init").length) {
				$(".tfa-init #password").addClass("tfa-field-error");
				$(".tfa-init #code").addClass("tfa-field-error");
				$(".tfa-init #code-error").addClass("active");
			}
			
			if($(".tfa-disable").length) {
				$(".tfa-disable #password").addClass("tfa-field-error");
				$(".tfa-disable #code").addClass("tfa-field-error");
				$(".tfa-disable #code-error").addClass("active");
			}
		},
		
		handlers: function() {
			$(".tfa-init").find(".tfa-activate-button").off("click").on("click", function(e) {
				e.preventDefault();
				var password = $(".tfa-init #password").val();
				var code = $(".tfa-init #code").val();
				
				SITE.tfa.util.submitTFAInitRequest(password, code, SITE.tfa.initializeTFA.submitTFAInitSuccess);
			});
			
			$(".tfa-init").find(".step-desc-container-toggle").off("click");
			
			$(".tfa-init").find(".step-desc-container-toggle").on("click", function(e) {
				e.preventDefault();
				$(".tfa-init .step-desc-container").slideToggle("400");
				$(".tfa-init .step-desc-container-toggle").toggleClass("expanded");
			});
			
			$(".tfa-init").find(".step-indicator-num").off("click");
			
			$(".tfa-init").find(".step-indicator-num").on("click", function(e) {
				e.preventDefault();
				$(".tfa-init").find(".step-indicator-num").removeClass("on");
				
				var thisStepNum = $(this).data("step-num");
				$(".tfa-init").find(".step-indicator-num." + thisStepNum).addClass("on");
				$(".tfa-init").find(".tfa-init-steps > li").addClass("mobile-off").removeClass("mobile-on");
				$(".tfa-init").find(".tfa-init-steps ." + thisStepNum).addClass("mobile-on").removeClass("mobile-off");
				
				if(thisStepNum === "step-1" || thisStepNum === "step-2") {
					$(".tfa-next-button").addClass("mobile-on").removeClass("mobile-off");
					$(".tfa-activate-button").addClass("mobile-off").removeClass("mobile-on");
					if(thisStepNum === "step-1") {
						$(".step-container").attr("data-step", 1);
					} else {
						$(".step-container").attr("data-step", 2);
					}
				} else if (thisStepNum === "step-3") {
					$(".tfa-next-button").addClass("mobile-off").removeClass("mobile-on");
					$(".tfa-activate-button").addClass("mobile-on").removeClass("mobile-off");
					$(".step-container").attr("data-step", 3);
				}
			});
			
			$(".tfa-init").find(".tfa-next-button").off("click");
			
			$(".tfa-init").find(".tfa-next-button").on("click", function(e) {
				e.preventDefault();
				var currentStep = $(".tfa-init").find(".steps-indicator-line .step-indicator-num.on").data("step-num");
				if(currentStep === "step-1") {
					$(".steps-indicator-line .step-indicator-num.step-2").click();
				} else if (currentStep === "step-2") {
					$(".steps-indicator-line .step-indicator-num.step-3").click();
				}
			});
			
			$(".tfa-success").find(".show-codes, .hide-codes").off("click").on("click", function(e) {
				e.preventDefault();
				$(".tfa-success .show-codes").toggleClass("visible");
				$(".tfa-success .hide-codes").toggleClass("visible");
				$(".tfa-success .backup-codes").toggle();
			});
		}
	},
	
	disableTFA: {
		init: function() {
			SITE.tfa.disableTFA.handlers();
		},
		
		callback: function(data) {
			if(data)
				SITE.tfa.disableTFA.showSuccess();
			else
				SITE.tfa.disableTFA.showError();
		},
		
		showSuccess: function() {
			window.location.reload();
		},
		
		showError: function() {
			
		},
		
		handlers: function() {
			$(".tfa-disable-container .cancel-button").off("click").on("click", function(e) {
				e.preventDefault();
				$(".simplemodal-close").click();
			});
			
			$(".tfa-disable-container .tfa-disable-button").off("click").on("click", function(e) {
				e.preventDefault();
				
				var $password = $(".tfa-disable-body #password");
				var $code = $(".tfa-disable-body #code");

				$.ajax({
					url: SSO.utility.getApiUrl() + "/reset2FAEnrollment",
					data: JSON.stringify({
						"password": $password.val(),
						"code": $code.val()
					}),
					contentType: "application/json",
					headers: SSO.csrf.getCSRFObj(),
					type: "POST",
					success: SITE.tfa.disableTFA.callback
				});
			});
		}
	},
	
	wireModalLinks: function() {
		$(".enable-authenticator-button").click(function(e) {
			e.preventDefault();
			$(".two-factor-authentication-disabled").attr("data-modal-active", true);
			
			if(!SITE.secureSession.isEstablished()) {
				SITE.secureSession.init();
				return;
			}
			
			SITE.tfa.initializeTFA.init();			
			var $focusedOriginEl = $(':focus');
			
			$(".two-factor-authentication-modal-container .tfa-init").modal({
				appendTo: ".privacy-security-settings-container",
				overlayClose: true,
				minHeight: "450px",
				onClose: function () {
					$focusedOriginEl.focus();
					$(".two-factor-authentication-disabled").attr("data-modal-active", false);
					$.modal.close();
				}
			});
		});
		
		$(".disable-authenticator-button").click(function(e) {
			e.preventDefault();
			$(".two-factor-authentication-enabled").attr("data-modal-active", true);
			
			SITE.tfa.disableTFA.init();
			var $focusedOriginEl = $(':focus');
			$(".two-factor-authentication-modal-container .tfa-disable").modal({
				appendTo: ".privacy-security-settings-container",
				overlayClose: true,
				minHeight: "450px",
				onClose: function () {
					$focusedOriginEl.focus();
					$(".two-factor-authentication-enabled").attr("data-modal-active", false);
					$.modal.close();
				}
			});
		});
		
		$(".close-2fa-modal").click(function() {
			$(".simplemodal-close").click();
		});
		
		SITE.tfa.wireEnable2FAModalDeepLink();
	},
	
	
	submit2FAEnrollmentCode: function() {
		//get code from form
		//submit code
		//success function
		$(".enabled-2fa-container").parent().siblings(".simplemodal-close").click();
		$(".enabled-2fa-success-container").modal({
			minHeight: "450px"
		});
	},
	
	wireAnnouncementSecureSession: function() {
		$(".setup-tfa").click(function(e) {
			if(!SITE.secureSession.isEstablished()) {
				e.preventDefault();
				SITE.secureSession.init();
				return;
			}
		})
	},

	wireEnable2FAModalDeepLink: function() {
		var hasEnable2FA = SITE.util.hasQuery("enable2FA");
		if(hasEnable2FA) {
			if (SITE.util.getQueryValue("enable2FA") == 1){
				$(window).load(function () {
					$(".enable-authenticator-button").click();
				});
			}
		}
	},
		
	initSessionCountdown: function() {
		var $timeContainer = $(".tfa-init");
		var timeStart = $timeContainer.data("time");
		var sessionDuration = 1800000;  //30 minute session
		var timeEndMs = timeStart + sessionDuration;
		
		
		var i = setInterval(function() {
			var timeNowMs = Date.now();
			var timeRemainingMs = timeEndMs - timeNowMs;
			var timeLeftFormatted = new Date(timeRemainingMs).toISOString().slice(14, -5);
			
			if (timeRemainingMs > 0) {
				$timeContainer.find("#secure-session-countdown").html(timeLeftFormatted);
			} else {
				$timeContainer.find(".tfa-init-countdown").hide();
				$timeContainer.find(".tfa-init-countdown-expired").show();
				clearInterval(i);
				
				var baseUrl = SSO.utility.getApiUrl();
				var profilePrivacySecurityTabUrl = baseUrl + "/2FASettings?enable2FA=1";
				window.location.href = profilePrivacySecurityTabUrl;
			}		
		}, 1000);
	}
}

SITE.oauth = {
	init: function() {	
		if($("#frmOauthConsent").length) {
			SITE.oauth.wireCheckbox();
			ssobar.onReady(SITE.oauth.wireCancelLink);
		}
	},
	
	wireCheckbox: function() {		
		$("#consentGranted").on("click", function(e) {
			if($("#consentGranted").is(":checked")) {
				$("#frmOauthConsent input[type=submit]").attr("disabled", false);				
			} else {
				$("#frmOauthConsent input[type=submit]").attr("disabled", true);	
			}
		});
	},
	
	wireCancelLink: function() {
		var baseUrl = SSO.utility.getApiUrl();
		var url = baseUrl + "/oauth/logout";
		
		if($(".oauth_gamebattles").length) {
			if(baseUrl.includes("s.activision") || baseUrl.includes("profile.callofduty")) {
				$("#frmOauthConsent a.cancel").attr("href", "https://accounts.majorleaguegaming.com/link/atvi/complete?error_code=252000");
			} else {
				$("#frmOauthConsent a.cancel").attr("href", "https://accounts.mlgstaging.com/link/atvi/complete?error_code=252000");
			}
		} else {
			$("#frmOauthConsent a.cancel").attr("href", url);
		}
	},
}

SITE.secureSession = {
		context: {
			$ssModal: $(".secure-session-modal-container")
		},
		
		isRequired: function($field) {
			return $field.parents(".personalInfo").hasClass("authentication-required") || $field.parents(".account-container").hasClass("authentication-required");
		},
		
		isEstablished: function() {
			return $.find(".secure-session-established").length > 0;
		},
		
		init: function() {
			SITE.secureSession.initModal();
			SITE.secureSession.wireSendEmail();
			SITE.secureSession.wireVerificationCode();
		},
		
		wireSendEmail: function() {
			var $ssModal = SITE.secureSession.context.$ssModal;
			var $submit = $ssModal.find(".init button.submit"); 
			
			$submit.click(function (e) {
				e.preventDefault();
				SITE.secureSession.sendEmail();
				$submit.prop("disabled", true);
			});
			
			var $error = $ssModal.find(".error button");
			
			$error.click(function (e) {
				e.preventDefault();
				SITE.secureSession.sendEmail();
				$error.prop("disabled", true);
			});
			
		},
		
		initModal: function() {
			var $ssModal = SITE.secureSession.context.$ssModal;
			$ssModal.modal({
				overlayClose: true,
				minHeight: "450px",
				onShow: function () {
					$("#simplemodal-container").addClass("ss-modal");
				},
				onClose: function () {
					$ssModal.hide();
					$ssModal.find(".modal").hide();
					$ssModal.find(".init, .entry, .error").hide();
					$.modal.close();
				}
			});
			$ssModal.show();
			$ssModal.find(".modal").show();
			$ssModal.find(".init").show();
		},
		
		wireVerificationCode: function() {
			var $ssModal = SITE.secureSession.context.$ssModal;
			var $code = $ssModal.find("input");
			var $submit = $ssModal.find(".entry button.submit");
			
			$submit.click(function(e) {
				e.preventDefault();
				SITE.secureSession.sendCode($code.val());
				$submit.prop("disabled", true);
			})
		},
		
		sendEmail: function() {
			$.ajax({
				url: SITE.core.apiUrl + "/sendSecureSessionEmail",
				headers: SSO.csrf.getCSRFObj(),
				type: "POST",
				success: SITE.secureSession.emailSuccess,
				error: SITE.secureSession.emailError
				
			})
		},
		
		emailSuccess: function(d) {
			var $ssModal = SITE.secureSession.context.$ssModal;
			
			if(d.status == "invalid") {
				SITE.secureSession.emailError();
				return;
			}
			$ssModal.find(".init").hide();
			$ssModal.find(".entry").show();
			$ssModal.find("button").prop("disabled", false);
		},
		
		emailError: function() {
			var $ssModal = SITE.secureSession.context.$ssModal;
			$ssModal.find(".entry").hide();
			$ssModal.find(".init").hide();
			$ssModal.find(".error").show();
			//display error message
			$ssModal.find("button").prop("disabled", false);
		},
		
		sendCode: function(code) {
			$.ajax({
				url: SITE.core.apiUrl + "/startSecureSession",
				headers: SSO.csrf.getCSRFObj(),
				type: "POST",
				dataType: "json",
				data: {
					"code" : code
				},
				success: SITE.secureSession.codeSuccess,
				error: SITE.secureSession.codeError
				
			})
		},
		
		codeSuccess: function() {
			var $ssModal = SITE.secureSession.context.$ssModal;
			var baseUrl = SSO.utility.getApiUrl();
			if($(".two-factor-authentication-disabled").data("modal-active") === true || $(".two-factor-authentication-enabled").data("modal-active") === true) {
				window.location.href = baseUrl + "/2FASettings?enable2FA=1";
			} else if ($("#announcement2fa-page").length) {
				//window.location.href = baseUrl + "/init2FALanding";
				window.location.href = baseUrl + "/2FASettings?enable2FA=1";
			} else {
				window.location.reload(true);
			}
		},
		
		codeError: function() {
			var $ssModal = SITE.secureSession.context.$ssModal;
			$ssModal.find(".entry").hide();
			$ssModal.find(".error").show();
			//display error message
			$ssModal.find("button").prop("disabled", false);
		}
}

SITE.recaptchaSizing = {		
	init: function() {
		$(window).load(function(){
			if($('iframe[title="recaptcha challenge"]').length) {
				$('iframe[title="recaptcha challenge"]').parent().parent().addClass("recaptcha-container");
			}
		});
	}		
}

SITE.promoCheck = {		
	init: function() {
		var hasPromo = SITE.util.hasQuery("promo");
		if(hasPromo) {
			if(SITE.util.getQueryValue("promo") === "141" || SITE.util.getQueryValue("promo") === "jpt" || SITE.util.getQueryValue("promo") === "cer") {
				//console.log("PROMO=" + SITE.util.getQueryValue('promo'));
				$("body").addClass("promo-" + SITE.util.getQueryValue('promo'));
			} else {
				//console.log("PROMO=unknown");
			}
		}
	}		
}

SITE.oneTrust = {		
	init: function() {
		var isLoggedIn = SSO.utility.getCookie("ACT_SSO_COOKIE") && SSO.utility.getCookie("ACT_SSO_COOKIE").length;
		
		if(isLoggedIn) {
			$.ajax({
			    url: SSO.utility.getApiUrl() + "/regulations/onetrust/auth",
			    headers: SSO.csrf.getCSRFObj(),
				datatype : "json",
				method: "POST",
				success : function(data) {
					console.log("OneTrustAuth success response: ", data);
					OneTrust = {
						dataSubjectParams: {
							id: data.userId,
							isAnonymous: false,
							token : data.token
						}
					};
				}
			}).fail(function (data) { 
			    console.log("Failed: OneTrust /regulations/onetrust/auth:", data);
			}).done(function (data) { 

			});
		}
	}		
}
