// before porting to actual playbook do the following
// -  change e.startY < 10 since browser bar wont be there
var textCursor = "<div class=\"blink\">|</div>"

window.addEventListener("load", onAppLoad, false);
window.onorientationchange = deviceOrientation;

function onAppLoad(){
	if (localStorage.getItem("currentLordsDay") == null) {
		localStorage.setItem("currentLordsDay", '1');
	}
	if (localStorage.getItem("fontSize") == null){
		localStorage.setItem("fontSize", 24);
	}
	if (localStorage.getItem("margin") == null){
		localStorage.setItem("margin", 10);
	}
	if (localStorage.getItem("catechismVersion") == null){
		localStorage.setItem("catechismVersion", "new");
	}
	startDatabase();
	if (localStorage.getItem("appVersion") == null /*|| localStorage.getItem("appVersion") == "v#"*/) {
		localStorage.setItem("appVersion", '1.0');
		clearAndResetDatabase();
	}

	bb.init(
		{
			onscreenready : onScreenReady,
			ondomready : onDomReady,
			listsDark: false,
			coloredTitleBar: false,
			controlsDark: false,
			highlightColor: '#00A8DF'
		}
	);

	deviceOrientation();

	$('#header').wipetouch({
		tapToClick: false, // if user taps the screen, triggers a click event
		wipeUp: onHeaderSwipeUp,
		moveY: 30,
	});
	blackberry.app.event.onSwipeDown(onBezelSwipeDown);
	if ((typeof window.blackberry !== "undefined") && (typeof blackberry.app !== "undefined")) {
		blackberry.app.event.onSwipeDown(onBezelSwipeDown);
		//blackberry.event.addEventListener("swipedown", onBezelSwipeDown);
	}

	$("body").css("font-size", localStorage.getItem("fontSize")+"px");
	getQuestionsAndAnswers(localStorage.getItem("currentLordsDay"));

	$(".choose-ld-number").on("click", function(e){
		onInputFieldSelect(e);
	});
	$(".choose-qa-number").on("click", function(e){
		onInputFieldSelect(e);
	});
	$(".number-buttons div").on("click", function(e){
		onNumberButtonPress(e);
	});
}

// changes widths of divs based on device orientation
function deviceOrientation() {
    var orientation = window.orientation;
    if (orientation == 0 || orientation == 180){
    	// normal orientation
    	$(".choose-ld-number").css("left", "475px");
    	$(".choose-qa-number").css("left", "605px");
    } else {
    	// sideways orientation
    	$(".choose-ld-number").css("left", "265px");
    	$(".choose-qa-number").css("left", "392px");
    }
}

function onScreenReady(element, id, params) {
	$element = $(element);
	switch (params.screenType) {
		case "lordsDay":
			var $insertHtml = $element.find(".insert-html");
			var margin = localStorage.getItem("margin");
			$insertHtml.html(params.htmlCode);
			$insertHtml.css({"margin-right":margin+"px", "margin-left":margin+"px"});
		case "searchResults":
			var $insertHtml = $element.find(".insert-html");
			var margin = localStorage.getItem("margin");
			$insertHtml.html(params.htmlCode);
			$insertHtml.css({"margin-right":margin+"px", "margin-left":margin+"px"});
		case "options":
			$element.find("#font-size").attr("value", localStorage.getItem("fontSize"));
			$element.find(".font-text").text("Font Size ("+localStorage.getItem("fontSize")+"px):");
			$element.find("#margin").attr("value", localStorage.getItem("margin"));
			$element.find(".margin-text").text("Margin ("+localStorage.getItem("margin")+"px):");
			if (localStorage.getItem("catechismVersion") == "new"){
				$element.find("#cat-new").attr("selected", "true");
			} else {
				$element.find("#cat-old").attr("selected", "true");
			}
		case "searchQuery":
			if (params.isFailedSearch == true){
				$element.find("#search-ld-button").after("<p style=\"font-size:24px\"><b>Search returned nothing.</b></p>");
			}
	}
}

function onDomReady(element, id, params) {
	var children = $("body").children();
	if (children.length == 4) {
		$(children[2]).remove();
	}
	if (params != null){
		if (params.screenType == "lordsDay" || params.screenType == "searchResults") {
			var $screen = $(element).find('#lords-day-screen');
			$screen.children().css("top","75px");
			$screen.find(".insert-html").show();
			element.getElementById('lords-day-screen').refresh();
			$screen.wipetouch({
				tapToClick: true, // if user taps the screen, triggers a click event
				wipeLeft: goLeft,
				wipeRight: goRight,
				allowDiagonal: true,
			});
			$("body").removeClass("wait");
		}
	}
}

function onInputFieldSelect(e) {
	toggleDiv(100, "number-buttons", e);
}

function onHeaderSwipeUp() {
	$('#header').height('0px');
	$('#lords-day-screen').children().css("top","0px");
	document.getElementById('lords-day-screen').refresh();
}

function onBezelSwipeDown() {
	if ($('#header').height() == 0) {
		$('#header').height('75px');
		$('#lords-day-screen').children().css("top","75px");
		document.getElementById('lords-day-screen').refresh();
	}
}

function goRight() {
	var displayedLordsDay = parseInt(localStorage.getItem("currentLordsDay"));
	if (displayedLordsDay != 52 && !$("body").hasClass("wait")) {
		getQuestionsAndAnswers(displayedLordsDay+1);
	}
}

function goLeft() {
	var displayedLordsDay = parseInt(localStorage.getItem("currentLordsDay"));
	if (displayedLordsDay != 1 && !$("body").hasClass("wait")) {
		getQuestionsAndAnswers(displayedLordsDay-1);
	}
}

function ldButton() {
	 closeNumberPad();
	getQuestionsAndAnswers(localStorage.getItem("currentLordsDay"));
}

function searchButton() {
	 closeNumberPad();
	if (!$("body").hasClass("wait")) {
		$(".current-tab").removeClass("current-tab");
		$(".search-button").addClass("current-tab");
		bb.pushScreen('search.htm', -1, {screenType: "searchQuery", isFailedSearch: false});
	}
}

function optionsButton () {
	 closeNumberPad();
	if (!$("body").hasClass("wait")) {
		$(".current-tab").removeClass("current-tab");
		$(".options-button").addClass("current-tab");
		bb.pushScreen('options.htm', -1, {screenType: "options"});
	}
}

function searchCatechismButton() {
	var searchText = $('input#search-query').val();
	if (searchText != "") {
		$('#searching-indicator').show();
		searchCatechism(searchText);
	}
}

function goToLordsDay(e){
	inputText = $(".choose-ld-number").text();
	inputText = inputText.slice(0, -1);
	if (inputText != ''){
		getQuestionsAndAnswers(inputText);
		$(".choose-ld-number").text('');
	} else {
		inputText = $(".choose-qa-number").text();
		inputText = inputText.slice(0, -1);
		if (inputText != ''){
			getSpecificQuestion(inputText);
			$(".choose-qa-number").text('');
		}
	}
	closeNumberPad();
}

function onNumberButtonPress(e){
	if (e.target.className == "backspace-button"){
		backSpace(e);
	} else if (e.target.className == "go-button"){
		goToLordsDay(e);
	} else {
		var charToAdd = $(e.target).text();
		if($(e.target).parent().parent().hasClass("ld")){
			var input = $(".choose-ld-number").text();
			if (input.length < 3){
				input = input.slice(0, -1);
				input += charToAdd;
				$(".choose-ld-number").html(input+textCursor);
			}
		} else {
			var input = $(".choose-qa-number").text();
			if (input.length < 4){
				input = input.slice(0, -1);
				input += charToAdd;
				$(".choose-qa-number").html(input+textCursor);
			}
		}
	}
}

function backSpace(e) {
	if($(e.target).parent().parent().hasClass("ld")){
		var input = $(".choose-ld-number").text();
		input = input.slice(0, -2);
		$(".choose-ld-number").html(input+textCursor);
	} else {
		var input = $(".choose-qa-number").text();
		input = input.slice(0, -2);
		$(".choose-qa-number").html(input+textCursor);
	}
}

function toggleDiv(time, className, e){
	var $divToToggle = $("."+className);
	if (e != null){
		if (e.target.className == "choose-ld-number"){
			$(".choose-ld-number").html(textCursor);
			$(".choose-qa-number").text('');
			if ($divToToggle.hasClass("qa")){
				$divToToggle.removeClass("qa").addClass("ld");
			} else if ($divToToggle.hasClass("ld")){
				closeNumberPad();
			} else {
				$divToToggle.addClass("ld").css('height', '45px').slideToggle(time, "linear");
			}
		} else {
			$(".choose-ld-number").text('');
			$(".choose-qa-number").html(textCursor);
			if ($divToToggle.hasClass("ld")){
				$divToToggle.removeClass("ld").addClass("qa");
			} else if ($divToToggle.hasClass("qa")){
				closeNumberPad();
			} else {
				$divToToggle.addClass("qa").css('height', '45px').slideToggle(time, "linear");
			}
		}
	} else {
		$divToToggle.css('height', '75px').slideToggle(time, "linear");
	}
}

function closeNumberPad() {
	if ($('.number-buttons').css('display') != 'none') {
		$(".number-buttons").removeClass("qa ld").slideToggle(10, "linear");
		$(".choose-ld-number").text('');
		$(".choose-qa-number").text('');
	}
}

function changeFontSize(value){
	localStorage.setItem("fontSize", value);
	$(".font-text").text("Font Size ("+value+"px):");
	$("body").css("font-size", value+"px");
}

function changeMargin(value) {
	localStorage.setItem("margin", value);
	$(".margin-text").text("Margin ("+value+"px):");
}

function changeCatVersion(value) {
	localStorage.setItem("catechismVersion", value);
	clearAndResetDatabase();
}