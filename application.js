// before porting to actual playbook do the following
// -  change e.startY < 10 since browser bar wont be there
var displayedLordsDay = 1;
var textCursor = "<div class=\"blink\">|</div>"

window.addEventListener("load", onAppLoad, false);

function onAppLoad(){
	setupDatabase();
	bb.init(
		{
			onscreenready : onScreenReady,
			ondomready : onDomReady,
			actionBarDark: true,
			listsDark: false,
			coloredTitleBar: false,
			controlsDark: false,
		}
	);

	$('#header').wipetouch({
		tapToClick: false, // if user taps the screen, triggers a click event
		wipeUp: onHeaderSwipeUp,
		moveY: 30,
	});

	if ((typeof window.blackberry !== "undefined") && (typeof blackberry.app !== "undefined")) {
		blackberry.app.event.onSwipeDown(onBezelSwipeDown);
	}

	getQuestionsAndAnswers(displayedLordsDay);
	$(".choose-ld-number").on("click", function(e){
		onInputFieldSelect(e);
	});
	$(".search-button").on("click", function(e){
		onSearchButton(e);
	});
	$(".choose-qa-number").on("click", function(e){
		onInputFieldSelect(e);
	});
	$(".number-buttons div").on("click", function(e){
		onNumberButtonPress(e);
	});
}

function onScreenReady(element, id, params) {
	if (params.screenType == "lordsDay" || params.screenType == "searchResults") {
		$(element).find(".insert-html").html(params.htmlCode);
	}
	// if (params.screenType == "searchResults") {
	// 	$(element).find(".bb-pb-button-container").each(function(){
	// 		this.addClass("goto-ld-button");
	// 	});
	// }
}

function onDomReady(element, id, params) {
	if (params != null){
		if (params.screenType == "lordsDay" || params.screenType == "searchResults") {
			var $screen = $(element).find('#lords-day-screen');
			$screen.children().css("top","75px");
			$screen.find(".insert-html").show();
			element.getElementById('lords-day-screen').refresh();
			$($screen).wipetouch({
				tapToClick: true, // if user taps the screen, triggers a click event
				wipeLeft: onSwipeLeft,
				wipeRight: onSwipeRight,
				allowDiagonal: true,
			});
			$("body").removeClass("wait");
		}
		if (params.screenType == "searchQuery") {
			$("#search-ld-button").on("click", searchCatechismButton);
		}
		if (params.screenType == "searchResults") {
			$(".bb-pb-button-container").one("click", onGoToLDButton);
		}
	}
}

function onGoToLDButton(e) {
	while (!$(e.target).hasClass("bb-pb-button-container")){
		e.target = $(e.target).parent();
	}
	displayedLordsDay = $(e.target).data("lords-day-number")
	getQuestionsAndAnswers(displayedLordsDay);
}

function onInputFieldSelect(e) {
	toggleDiv(200, "number-buttons", e);
}

function onHeaderSwipeUp() {
	$('#header').height('0px');
	$('#lords-day-screen').children().css("top","0px");
	document.getElementById('lords-day-screen').refresh();
}

function onSwipeLeft(e) {
	goRight(); 
}

function onSwipeRight(e) {
	goLeft();
}

function onBezelSwipeDown() {
	if ($('#header').height() == 0) {
		$('#header').height('75px');
		$('#lords-day-screen').children().css("top","75px");
		document.getElementById('lords-day-screen').refresh();
	}
}


function goRight() {
	if (displayedLordsDay != 52 && !$("body").hasClass("wait")) {
		displayedLordsDay++;
		getQuestionsAndAnswers(displayedLordsDay);
	}
}

function goLeft() {
	if (displayedLordsDay != 1 && !$("body").hasClass("wait")) {
		displayedLordsDay--;
		getQuestionsAndAnswers(displayedLordsDay);
	}
}

function onSearchButton(e) {
	bb.pushScreen('search.htm', -1, {screenType: "searchQuery"});
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
	onNumberPadClose();
}

function onNumberButtonPress(e){
	if (e.target.className == "backspace-button"){
		onBackSpace(e);
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

function onBackSpace(e) {
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
			} else {
				$divToToggle.addClass("ld").css('height', '45px');//.slideToggle(time, "linear");
			}
		} else {
			$(".choose-ld-number").text('');
			$(".choose-qa-number").html(textCursor);
			if ($divToToggle.hasClass("ld")){
				$divToToggle.removeClass("ld").addClass("qa");
			} else {
				$divToToggle.addClass("qa").css('height', '45px');//.slideToggle(time, "linear");
			}
		}
	} else {
		$divToToggle.css('height', '75px');//.slideToggle(time, "linear");
	}
}

function onNumberPadClose() {
	$(".number-buttons").removeClass("qa ld").css('height', '0');
	$(".choose-ld-number").text('');
	$(".choose-qa-number").text('');
}
