//signup.js

var SU = SU || {};

if (!window.console)
	console = {
		log : function() {
		}
	};

SU = {
	config : {
		steps : [ 
			[ "dob", "country" ],												// Step 0
			[ "email", "reenteremail" ], 										// Step 1
			[ "username", "firstname", "lastname" ],							// Step 2
			[ "phoneNumber", "enableSms" ], // optional (US)					// Step 3
			[ "password", "subscriptions", "privacyPolicy", "g-recaptcha" ],	// Step 4
			[ "account-linking" ] // account-linking							// Step 5
		],

		context : {
			elem : "",
			form : "",
			step : ""
		},

		store : {}
	},

	utils : {
		checkLoggedIn : function($elem) {
			//Redirect to Profile page if already logged in.
			var isLoggedIn = SSO.utility.getCookie("ACT_SSO_COOKIE") && SSO.utility.getCookie("ACT_SSO_COOKIE").length;
			if (isLoggedIn && $elem.length) {
				window.location.href = SSO.utility.getApiUrl() + "/profile";
			}
		},
		
		setStep : function(step) {
			return (!step) ? 0 : step;
		},

		setContext : function($elem, step) {
			SU.config.context = {
				elem : $elem,
				form : $elem.find("form"),
				step : SU.utils.setStep(step)
			};
		},

		updateStep : function(step) {
			var $sectionCont = $("#sign-up");
			var $stepCont = SU.config.context.elem.find("div.steps");
			var $formCont = SU.config.context.elem.find("#signup-full");
			var $carouselCont = SU.config.context.elem
					.find(".carousel-container");

			$sectionCont.attr("data-current-step", step);
			$stepCont.attr("data-current-step", step);

			$stepCont.find(".step, .title, .description").removeClass("active");
			$stepCont.find("li, .title, .description").filter(function() {
				return $(this).data("step") == step
			}).addClass("active");

			$formCont.attr("data-stepnumber", step);

			$carouselCont.removeClass("active");
			$carouselCont.filter(function() {
				return $(this).data("step") == step
			}).addClass("active");

			SU.config.context.step = SU.utils.setStep(step);
		},

		getFieldsForStep : function(step) {
			return SU.config.steps[step];
		},

		getUrlParameter : function(param) {
			var pageURL = window.location.search.substring(1);
			var urlVariables = pageURL.split('&');
			var parameterName;

			for (var i = 0; i < urlVariables.length; i++) {
				parameterName = urlVariables[i].split('=');

				if (parameterName[0] === param) {
					return parameterName[1] === undefined ? true
							: decodeURIComponent(parameterName[1]);
				}
			}
		},

		buildSignUpDataObj : function($form) {
			var data = {};
			var currStep = SU.config.context.step;

			$form.serializeArray().map(function(field) {
				if (SU.utils.isFieldInCurrentStep(field, currStep)) {
					var key = field["name"];
					data[key] = field["value"];
				}
			});
			
			if ($form.data("skippedLinking") == "true")
				data["skippedLinking"] = true;

			if ($form.data("skippedPhoneNumber") == "true")
            	data["skippedPhoneNumber"] = true;

			// set pp && sub as "true"||"false" when on password step
			if (typeof data["password"] != "undefined") {
				if (typeof data["privacyPolicy"] == "undefined")
					data["privacyPolicy"] = "false";
				if (typeof data["subscriptions"] == "undefined")
					data["subscriptions"] = "";
			}

			// set sms as "true"||"false" when on the phone number step
			if (typeof data["phoneNumber"] != "undefined"
					&& typeof data["enableSms"] == "undefined")
				data["enableSms"] = "false";

			data["stepNumber"] = currStep;

			return data;
		},

		isFieldInCurrentStep : function(field, currStep) {
			return (SU.utils.locateStepForField(field.name) <= currStep);
		},

		locateStepForField : function(field) {
			var steps = SU.config.steps;
			for (var step = 0; step < steps.length; step++) {
				if (steps[step].includes(field))
					return step;
				if (field == "day" || field == "month" || field == "year")
					if (steps[step].includes("dob"))
						return step;
			}

			return -1;
		},

		findEarliestErrorStep : function(d) {
			var earliestStep = SU.config.context.step;
			if (d.signUpForm && d.signUpForm.stepNumber)
				earliestStep = d.signUpForm.stepNumber;

			for (var i = 0; i < d.errors.length; i++) {
				var error = d.errors[i];
				errorStep = SU.utils.locateStepForField(error.field);

				if (errorStep == -1)
					continue;

				if (errorStep < earliestStep)
					earliestStep = errorStep;
			}

			if (typeof earliestStep == "undefined")
				earliestStep = 0;

			return earliestStep;
		},

		setErrors : function(errors) {
			for (var i = 0; i < errors.length; i++) {
				var $dr = $("." + errors[i].field + ".data-row");
				$dr.addClass("invalid");
				$dr.find(".validation-message-cont .validation-message").html(
						errors[i].message);

				$dr.find("")
			}

		}

	},

	// ["email"],
	// ["username", "firstname", "lastname"],
	// ["dob", "country"],
	// ["password", "newsletter", "terms"],
	// ["account-linking"], //account-linking
	// ["phone", "sms"] //optional (US-only)

	validation : {
		validateField: function(field, value) {
			var validationFunction = SU.validation.validationFunctions[field];
			
			if(typeof validationFunction != "function")
				return;

			/** response: {"isValid": {{true||false}}, "field": {{field}}, "message": {{message}} } **/
			var response = validationFunction(value);

			if(typeof response == "undefined")
				return;
			
			if(response.isValid) {
				if (field === "email") {
					var confirmEmail = SU.validation.validationFunctions.helpers.getEmailVal("reenteremail");
					SU.validation.setFieldValid(response);
					if (confirmEmail.length > 0) {
						SU.validation.setFieldValid({ field: "reenteremail" });
					}
				}
				SU.validation.setFieldValid(response);
			} else {
				SU.validation.setFieldInvalid(response);
			}
		},
		
		setFieldValid: function(response)  {
			var $form = SU.config.context.elem;
			var $dr = $form.find(".data-row." + response.field);
			$dr.removeClass("invalid").addClass("valid");
			$dr.find(".validation-message").html("");
		},

		setFieldInvalid: function(response) {
			var $form = SU.config.context.elem;
			var $dr = $form.find(".data-row." + response.field);
			$dr.removeClass("valid").addClass("invalid");
			$dr.find(".validation-message").html(response.message);
		},
		
		validationFunctions: {
			email: function(value) {
				var confirmEmail = SU.validation.validationFunctions.helpers.getEmailVal("reenteremail");
				var response;

				if (confirmEmail && confirmEmail.length > 0) {
					response = SU.validation.validationFunctions.helpers.buildResponse(
						value === confirmEmail,
						"reenteremail",
						[SITE.dictionary["validation-messages-reenter-email"]]
					);

					if (!response.isValid) {
						return response;
					}
				}

				response = SU.validation.validationFunctions.helpers.buildResponse(
					!!value.match(SU.validation.validationFunctions.helpers.emailRegex),
					"email",
					[SITE.dictionary["validation-messages-enter-valid-email"]]
				);

				//checkIfTaken
				if(response.isValid)
					SU.validation.precheck.emailValid(value, SU.validation.validationFunctions.helpers.ajaxSuccessFunction);

				return response;
			},

			reenteremail: function(retypedEmail) {
				var originalEmail = SU.validation.validationFunctions.helpers.getEmailVal("email");

				return SU.validation.validationFunctions.helpers.buildResponse(
					retypedEmail === originalEmail,
					"reenteremail",
					[SITE.dictionary["validation-messages-reenter-email"]]
				);
			},

			username: function(value) {
				SU.validation.precheck.username(value, SU.validation.validationFunctions.helpers.ajaxSuccessFunction);
			},

			firstname: function(value) {
				SU.validation.validationFunctions.helpers.ajaxSuccessFunction(
						SU.validation.validationFunctions.helpers.validateName("firstname", value));
			},

			lastname: function(value) {
				SU.validation.validationFunctions.helpers.ajaxSuccessFunction(
						SU.validation.validationFunctions.helpers.validateName("lastname", value));
			},

			dob: function() {
				SU.validation.validationFunctions.helpers.ajaxSuccessFunction(
						SU.validation.validationFunctions.helpers.validateDOB());
			},
			
			day: function() { SU.validation.validationFunctions.dob(); },
			month: function() { SU.validation.validationFunctions.dob(); },
			year: function() { SU.validation.validationFunctions.dob(); },

			country: function(value) {
				SU.validation.validationFunctions.helpers.ajaxSuccessFunction(
						SU.validation.validationFunctions.helpers.buildResponse(
								!!value,
								"country",
								[SITE.dictionary['validation-messages-select-country']]));
			},

			password: function(value) {
				SU.validation.precheck.password(value, SU.validation.validationFunctions.helpers.ajaxSuccessFunction);
			},

			privacyPolicy: function(value) {
				SU.validation.validationFunctions.helpers.ajaxSuccessFunction(
						SU.validation.validationFunctions.helpers.buildResponse(
								!!value,
								"privacyPolicy",
								[SITE.dictionary['validation-messages-tos-checked']]));
			},

			phoneNumber: function(value) {
				var response = SU.validation.validationFunctions.helpers.buildResponse(
						$("#phoneNumberDisplay").intlTelInput("isValidNumber"),
						"phoneNumber",
						[SITE.dictionary["validation-messages-valid-phone-number"]]
					);

				if(response.isValid)
					SU.validation.precheck.phone(value, SU.validation.validationFunctions.helpers.ajaxSuccessFunction);

				return response;
			},
			
			helpers: {
				emailRegex: /^[^@]+@[^\.@]+\.[^@\.](.*[^@\.])?$/,

				ajaxSuccessFunction: function(response) {
					if(response.isValid) {
						SU.validation.setFieldValid(response);
					} else {
						SU.validation.setFieldInvalid(response);
					}
					
				},
				
				buildResponse: function(isValid, field, message) {
					if(isValid) 
						return {
							"isValid": true,
							"field": field
						};

					return {
						"isValid": isValid,
						"field": field,
						"message": message.length > 0 ? message[0] : ""
					};
				},
				
				validateDOB: function() {
					var $dobCont = SU.config.context.elem.find(".dob");
					
					var day = $dobCont.find("#day").val();
					var month = $dobCont.find("#month").val();
					var year = $dobCont.find("#year").val();
					
					if (month && day && year) {
						year = parseInt(year);
						month = parseInt(month - 1);
						day = parseInt(day);
						date = new Date(year, month, day);
						return SU.validation.validationFunctions.helpers.buildResponse(date.getFullYear() == year
								&& date.getMonth() == month && date.getDate() == day,
								"dob", [SITE.dictionary['validation-messages-enter-date']]);
					}
					
					return SU.validation.validationFunctions.helpers.buildResponse(false, "dob", [SITE.dictionary['validation-messages-enter-date']]);
				},
				
				validateName: function(field, value) {
					if (value.length > 64)
						return SU.validation.validationFunctions.helpers.buildResponse(false, field, [SITE.dictionary['validation-messages-nametoolong']]);
						
					if (value.length < 2)
						return SU.validation.validationFunctions.helpers.buildResponse(false, field, [SITE.dictionary['validation-messages-nametooshort']]);
						
					return SU.validation.validationFunctions.helpers.buildResponse(
							/^([a-zA-Z\u0A00-\u0A7F\\.' -]*)$/i.test(value) && 
							/^([a-zA-Z\u0A00-\u0A7F]+(([\\.']?[ ]?|[-])[a-zA-Z\u0A00-\u0A7F]+)*[\\.]?)$/i
									.test(value),
							field,
							[SITE.dictionary['validation-messages-enter-nameonly']]);
				},
				getEmailVal: function(id) {
					var $form = SU.config.context.elem;
					var $field = $form.find("#" + id);

					return $field.val();
				}
			}
		},

		precheck : {
			precheckList : [ "email", "password", "username", "phone" ],

			isValidResponseObject : function(data) {
				var isValid = false;

				if (typeof data != "undefined")
					if (typeof data.status != "undefined")
						if (data.status == "valid")
							isValid = true;

				return isValid;
			},
			
			buildResponseObject: function(data, field) {
				if(!SU.validation.precheck.isValidResponseObject(data)) {
					return {
						"isValid": false,
						"field": field,
						"message": data.exceptionMessageList || ["unknownError"]
					};
				} else {
					return {
						"isValid": true,
						"field": field
					}
				}
						
			},

			email : function(email, success) {
				this.emailFormat(email, this.emailValid(email, success));
			},

			emailValid : function(email, success) {
				$.ajax({
					url : SSO.utility.getApiUrl() + "/signup/checkEmail",
					headers : SSO.csrf.getCSRFObj(),
					datatype : "json",
					method : "POST",
					data : {
						"email" : email
					},
					success : function(data) {
						success(SU.validation.precheck.buildResponseObject(data, "email"));
					}
				});
			},

			emailFormat : function(email, success) {
				$.ajax({
					url : SSO.utility.getApiUrl() + "/signup/checkEmailFormat",
					headers : SSO.csrf.getCSRFObj(),
					datatype : "json",
					method : "POST",
					data : {
						"email" : email
					},
					success : function(data) {
						success(SU.validation.precheck.buildResponseObject(data, "email"));
					}
				});
			},

			username : function(username, success) {
				$.ajax({
					url : SSO.utility.getApiUrl() + "/signup/checkUsername",
					headers : SSO.csrf.getCSRFObj(),
					datatype : "json",
					method : "POST",
					data : {
						"username" : username
					},
					success : function(data) {
						success(SU.validation.precheck.buildResponseObject(data, "username"));
					}
				});
			},
			
			password : function(password, success) {
				$.ajax({
					url : SSO.utility.getApiUrl() + "/signup/checkPassword",
					headers : SSO.csrf.getCSRFObj(),
					datatype : "json",
					method : "POST",
					data : {
						"password" : password
					},
					success : function(data) {
						success(SU.validation.precheck.buildResponseObject(data, "password"));
					}
				});
			},
			phone : function(phone, success) {
				$.ajax({
					url : SSO.utility.getApiUrl() + "/signup/checkMobilePhoneNumber",
					headers : SSO.csrf.getCSRFObj(),
					datatype : "json",
					method : "POST",
					data : {
						"number" : phone
					},
					success : function(data) {
						success(SU.validation.precheck.buildResponseObject(data, "phoneNumber"));
					}
				});
			}
		},

		isValid : function(step) {
			step = step || 0;
			var steps = SU.config.steps;
			
			var validationPassed = true;
			var errors = [];

			if(steps[step].includes("privacyPolicy")) {
				if(!$(".data-row.privacyPolicy input").is(":checked")){
					validationPassed = false;
					$(".data-row.privacyPolicy").addClass("invalid");
				}
			}
			
			if(steps[step].includes("g-recaptcha")) {
				if($(".data-row.g-recaptcha").length) {
					if(!grecaptcha.getResponse()) {
						validationPassed = false;
						$(".data-row.g-recaptcha").addClass("invalid");
					}
				}
			}
			
			for(var i = 0; i <= step; i++) {
				var fields = steps[i];
				
				fields.map(function(field) {
					var $dr = $(".data-row." + field);
					
					if($dr.hasClass("required")) {
						if($dr.find("input, select").val() == "") {
							$dr.addClass("invalid");
						}
					}
					if ($(".data-row." + field).hasClass("invalid"))
						validationPassed = false;
				})
			}

			return validationPassed;
		}
	},

	render : {
		hideForm : function() {
			$("#sign-up").removeClass("active");
		},
		showForm : function() {
			$("#sign-up").addClass("active");
		},

		showFields : function(fields) {
			if (typeof fields == "undefined")
				return;

			for (var i = 0; i < fields.length; i++)
				SU.render.showField(fields[i]);
		},

		showField : function(field) {
			SU.config.context.form.find(".data-row." + field)
					.addClass("active");
		},

		hideAllFields : function() {
			SU.config.context.form.find(".data-row").removeClass("active");
		},

		hideField : function(field) {
			SU.config.context.form.find(".data-row." + field).removeClass(
					"active");
		}
	},

	steps : {
		back : function() {
			var currStep = SU.config.context.step;
			var step = (typeof currStep == "undefined" || currStep == 0) ? 0
					: (currStep - 1)

			if($("#signup-full #country").val() !== "US" && currStep === 4){
			     step = step - 1;
			}

			// reset form
			SU.steps.buildStep(step);
		},

		next : function(skipValidation, successFn) {

			var url = SSO.utility.getApiUrl() + "/signup/next";

			$(".g-recaptcha").removeClass("invalid");
			
			$("#next-button").prop("disabled", true);

			if (SU.validation.isValid(SU.config.context.step) || skipValidation) {
				$.ajax({
					headers : SSO.csrf.getCSRFObj(),
					datatype : "json",
					method : "POST",
					contentType : "application/json",
					data : JSON.stringify(SU.utils.buildSignUpDataObj($("#signup-full"))),
					url : url,
					success : function(d) {
						if(typeof successFn != "undefined") successFn();
						
						if (d.errors && d.errors.length) {
							// reset form step to first occurance of an error
							var earliestStep = SU.utils.findEarliestErrorStep(d);
	
							SU.utils.setErrors(d.errors);
	
							SU.steps.buildStep(earliestStep);
	
						} else if (d.signUpForm) {
							if(d.forceRedirect == true) {
								window.location.reload();
							}

							if (d.registered && d.signUpForm.umbrellaAccessToken !== "") {
								window.location.href = SSO.utility.getApiUrl() + "/profile";
								return;
							}
							
							var step = d.signUpForm.stepNumber;
                            console.log("1 NEXT STEP: ", step);
							if (step > SU.config.steps.length)
								step = SU.config.steps.length + 1;

							SU.steps.buildStep(step);
							SU.gtm.fireVirtualPageView();
						} else {
							// ERROR
						}
					},
					error : function(d) {
						// Uh oh, call failed, set general error state
					},
					complete : function(d) {
						$("#next-button").prop("disabled", false);
					}
				})
			} else {
				$("#next-button").prop("disabled", false);
			}

			// TEMP - disable custom browser back button behavior
			// history.pushState({ state: 'COD Signup Step '+step }, 'title',
			// '?p='+step );
		},

		finalize : function(skipValidation, successFn) {

            var url = SSO.utility.getApiUrl() + "/signup/finalize";

            $(".g-recaptcha").removeClass("invalid");

            $("#signup-full .no-network-link").prop("disabled", true);

            if (SU.validation.isValid(SU.config.context.step) || skipValidation) {
                $.ajax({
                    headers : SSO.csrf.getCSRFObj(),
                    datatype : "json",
                    method : "POST",
                    contentType : "application/json",
                    data : JSON.stringify(SU.utils.buildSignUpDataObj($("#signup-full"))),
                    url : url,
                    success : function(d, textStatus, jqXHR) {
                        if(typeof successFn != "undefined") successFn();

                        if (d.errors && d.errors.length) {
                              // reset form step to first occurance of an error
                              var earliestStep = SU.utils.findEarliestErrorStep(d);

                              SU.utils.setErrors(d.errors);

                              SU.steps.buildStep(earliestStep);

                        } else if (d.signUpForm) {
                               if(d.forceRedirect == true) {
                                     window.location.reload();
                               }

                               var step = d.signUpForm.stepNumber;
                               console.log("2 NEXT STEP: ", step);
                               if (step > SU.config.steps.length)
                                     step = SU.config.steps.length + 1;

                               SU.steps.buildStep(step);
                               SU.gtm.fireVirtualPageView();
                        } else {
                                  // ERROR
                        }
                    },
                    error : function(d) {
                        // Uh oh, call failed, set general error state
                    },
                    complete : function(d) {
                        $("#signup-full .no-network-link").prop("disabled", false);
                    }
                })
            } else {
                $("#signup-full .no-network-link").prop("disabled", false);
            }

            // TEMP - disable custom browser back button behavior
            // history.pushState({ state: 'COD Signup Step '+step }, 'title',
            // '?p='+step );
        },

		buildStep : function(step) {
			var prevStep = SU.config.context.step || 0;
			step = (typeof step == "undefined") ? 0 : step;

			if(step > 5) {
				$(".button-container #next-button").hide();
				$(".button-container #finalize-button").show();
			} else if(step < 5) {
				$(".button-container #next-button").show();
				$(".button-container #finalize-button").hide();
			}
			
			SU.steps.animateStep(prevStep, step, SU.steps.animationSuccess);
			SU.render.showForm();
		},

		animationSuccess : function(step) {
			SU.render.hideAllFields();
			SU.utils.updateStep(step);
			SU.render.showFields(SU.config.steps[step]);
		},

		animateStep : function(prevStep, step, success) {
			var $ac = $(".animate-container");

			// handle going backwards in flow:
			if (prevStep > step) {
				$ac.addClass("out-right");
				$(".out-right").on("transitionend", function(e) {
					if ($(e.target).is(this)) {
						$(this).off("transitionend");
						success(step);
						SU.steps.animateNextStep(prevStep, step);
					}
				})
			}

			// handle going forwards in flow:
			else if (step > prevStep) {
				$ac.addClass("out-left");
				$(".out-left").on("transitionend", function(e) {
					if ($(e.target).is(this)) {
						$(this).off("transitionend");
						success(step);
						SU.steps.animateNextStep(prevStep, step);
					}
				})
			}

			else
				success(step);
		},

		animateNextStep : function(prevStep, step) {
			var $ac = $(".animate-container");

			// handle going next in flow:
			if (prevStep < step) {
				$ac.addClass("pos-right in-right").removeClass("out-right out-left");

				$('.in-right').on("transitionend", function(e) {
					if (e.originalEvent.propertyName == "opacity")
						return;

					if ($(e.target).is($(".animate-container.in-right"))) {
						$ac.removeClass("out-right out-left in-right in-left pos-left pos-right");
						$(this).off("transitionend");
					}
				})
			}

			// handle going backwards in flow:
			else if (step < prevStep) {
				$ac.addClass("pos-left in-left").removeClass(
						"out-right out-left");

				$('.in-left').on("transitionend", function(e) {
					if (e.originalEvent.propertyName == "opacity")
						return;

					if ($(e.target).is($(".animate-container.in-left"))) {
						$ac.removeClass("out-right out-left in-right in-left pos-left pos-right");
						$(this).off("transitionend");
					}
				})
			}
		},

		setHandlers : function() {
			var $stepButtons = $("#sign-up .actions");

			$stepButtons.find("#back-button").click(function(e) {
				e.preventDefault();
				SU.steps.back();

				// TEMP - disable custom browser back button behavior
				// history.back();
			});

			$stepButtons.find("#next-button").click(function(e) {
				e.preventDefault();
				SU.steps.next();
			});
			
			$("#sign-up .skip").click(function(e) {
				e.preventDefault()
				var skipPhoneNumber = true;

				$("#signup-full").data("skippedPhoneNumber", "true");
				SU.steps.next(skipPhoneNumber);
			});
			
			$stepButtons.find("#finalize-button").click(function(e) {
				e.preventDefault()
				$("#signup-full").attr("action", SSO.utility.getApiUrl() + "/signup/finalize");
				
				$("#signup-full").submit();
			});

			$("#signup-full .no-network-link").click(function(e) {
				e.preventDefault();
				var skipValidation = true;
				
				$("#signup-full").data("skippedLinking", "true");
                SU.steps.finalize(skipValidation);
			});
			
			$("#sign-up .data-row input, #sign-up.data-row select").on("keypress", function(e) {
				if(e.which == 13) {
					e.preventDefault();
					$stepButtons.find("#next-button").click();
				}
			})
		},

		setBrowserBackButton : function() {
			window.onpopstate = function(event) {
				SU.steps.back();
			};
		},
		
		buildInputStore: function ($form) {
			var $inputFields = $form.find("input");
			var $selectFields = $form.find("select");
			var store = SU.config.store;

			$inputFields.add($selectFields).each(function() {
				var field = $(this).attr("id");
				
				if($(this).is(":checkbox"))
					store[field] = $(this).is(":checked");
				else
					store[field] = $(this).val();
			});
			
			SU.steps.pollAgainstInputStore($form);
		},
		
		pollAgainstInputStore: function($form) {
			var store = SU.config.store;
			setInterval(function() {
				for(var field in store) {
					if (store.hasOwnProperty(field)) {
						var $field = $form.find("#" + field);
						
						if(field == "phoneNumber") $field.val($("#phoneNumberDisplay").intlTelInput("getNumber"));
						
						var val;
						if($field.is(":checkbox"))
							val = $field.is(":checked");
						else
							val = $field.val();
						
						if(store[field] != val) {
							store[field] = val;
							SU.validation.validateField(field, val);
						}
					}
				}
			}, 500)
		},

		init : function() {
			var initializedStep = $("#signup-full").data("stepnumber") || 0;
			SU.config.context.step = initializedStep;
			SU.steps.setHandlers();
			SU.steps.buildInputStore(SU.config.context.elem);
			SU.steps.buildStep(initializedStep);
			// TEMP - disable custom browser back button behavior
			// SU.steps.setBrowserBackButton();
		}
	},

	handlers : {

		initCarouselButtons : function() {
			// Carousel - NEXT Button
			$(".carousel-container .carousel-button.next")
				.click(function() {
						var thisButton = $(this);
						var thisSlideNum = $(".carousel-container .carousel-slide.active").attr("data-slide-num");
						var nextSlideNum = Number(thisSlideNum) + 1;
						nextSlideNum = 
							(nextSlideNum > $(".carousel-container .carousel-slide").length) 
								? 1
								: nextSlideNum;
						var slidesContainer = $(".carousel-container");

						SU.handlers.goToCarouselSlide(slidesContainer,
								thisSlideNum, nextSlideNum);
					});

			// Carousel - PREV Button
			$(".carousel-container .carousel-button.prev")
				.click(function() {
					var thisButton = $(this);
					var thisSlideNum = $(
							".carousel-container .carousel-slide.active")
							.attr("data-slide-num");
					var prevSlideNum = Number(thisSlideNum) - 1;
					prevSlideNum = (prevSlideNum < 1) ? $(".carousel-container .carousel-slide").length
							: prevSlideNum;
					var slidesContainer = $(".carousel-container");

					SU.handlers.goToCarouselSlide(slidesContainer,
							thisSlideNum, prevSlideNum);
				});
		},

		initCarouselNavigation : function() {
			// CAROUSEL Navigation
			$(".carousel-container .carousel-nav-button").click(
				function() {
					var thisButton = $(this);
					var targetSlideNum = thisButton.attr("data-slide-num");
					var currentSlideNum = $(".carousel-container .carousel-slide.active").attr("data-slide-num");
					var slidesContainer = $(".carousel-container");

					SU.handlers.goToCarouselSlide(slidesContainer, currentSlideNum, targetSlideNum);
				});
		},

		goToCarouselSlide : function(slidesContainer, currSlide, targetSlide) {

			if (currSlide !== targetSlide) {
				var slides = slidesContainer.find(".carousel-slide");
				slides.removeClass("active");
				slides.removeClass("before-active");

				for (i = 1; i < targetSlide; i++) {
					$(".carousel-slide[data-slide-num='" + i + "']").addClass("before-active");
				}

				$(".carousel-slide[data-slide-num='" + targetSlide + "']").addClass("active");

				$(".carousel-nav .carousel-nav-button").removeClass("on");
				$(".carousel-nav .carousel-nav-button[data-slide-num='" + targetSlide + "']").addClass("on");
			}

		},

		initStepDeepLinking : function() {
			var stepNum = SU.utils.getUrlParameter("p");
			// console.log("initStepDeepLinking p=", stepNum);
			if (stepNum) {
				// console.log("stepNum=", stepNum)

				// TEMP - Clear param from URL to disable deep linking;
				window.location = window.location.origin
						+ window.location.pathname;
			}

		},

		initPasswordHideShow : function() {
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
		},

		initTooltips : function() {
			$(".tooltip-icon").on("click", function(e) {
				e.preventDefault();

				$tc = $(this).siblings(".tooltip-content");
				$tc.fadeToggle("300");
			});
		},
		
		initPhoneNumberTermsDisplay: function() {
			$(window).load(function(){
				if($("#sign-up").length) {
					
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
					
				}
			})
		},

		init : function() {
			SU.handlers.initCarouselNavigation();
			SU.handlers.initCarouselButtons();
			SU.handlers.initStepDeepLinking();
			SU.handlers.initPasswordHideShow();
			SU.handlers.initTooltips();
			SU.handlers.initPhoneNumberTermsDisplay();
		}
	},

	gtm : {
		
		fireVirtualPageView : function() {
			var step = $("#signup-full").attr("data-stepnumber");
			
			gl.pushObj = {};
			genGL.buildLayerInfo();
			gl.pushObj.event = "pageView";
			gl.pushObj.step = (Number(step) + 1).toString();
			
			switch (gl.pushObj.step) {
				case "1":
					gl.pushObj.pageURL += "/enter-info";
					gl.pushObj.pageName += ":enter-info";
					gl.pushObj.name += ":enter-info";
					break;
				case "2":
					gl.pushObj.pageURL += "/birthday-country";
					gl.pushObj.pageName += ":birthday-country";
					gl.pushObj.name += ":birthday-country";
					break;
			    case "3":
                	gl.pushObj.pageURL += "/phone";
                	gl.pushObj.pageName += ":phone";
                	gl.pushObj.name += ":phone";
                	break;
				case "4":
					gl.pushObj.pageURL += "/create-a-password";
					gl.pushObj.pageName += ":create-a-password";
					gl.pushObj.name += ":create-a-password";
					break;
				case "5":
					gl.pushObj.pageURL += "/connected-accounts";
					gl.pushObj.pageName += ":connected-accounts";
					gl.pushObj.name += ":connected-accounts";
					break;
				default:
					break;
			}
			
			dataLayer.push(gl.pushObj);		
		}
	},

	init : function() {
		var $elem = $("#sign-up");
		
		SU.utils.checkLoggedIn($elem);
		SU.utils.setContext($elem);
		SU.steps.init();
		SU.render.showForm();
		SU.handlers.init();
		
		//reset to step 0 for page refresh
		SU.steps.buildStep(0);  
		
		//setup that phonestuff
		if($("#phoneNumberDisplay").length) {
			var preferred = ($("#phoneNumberDisplay").attr("data-preferred-countries") || "").trim().split(/\s*,\s*/);
			$("#phoneNumberDisplay").intlTelInput({
				utilsScript: "../resources/common/scripts/intlTelInput/utils.js",
				preferredCountries: preferred
			});
		}
		
		var emailQueryVal = SITE.util.getQueryValue("email");
		var currStep = SU.config.context.step;
		if(emailQueryVal && currStep == 1) {
			$("#email").val(emailQueryVal);
			SU.steps.next();
		} 
	}
}

$().ready(SU.init);