var db = null;

function startDatabase(){
	db = openDatabase("catechismDatabase", '1.0', 'Catechism', 129 * 4,  clearAndResetDatabase);
}

function clearAndResetDatabase() {
	bb.pushScreen('setUp.htm', -1, {screenType: "setUp"});
	var version = localStorage.getItem("catechismVersion");
	 db.transaction(function (tx) {
	 	tx.executeSql("DROP TABLE IF EXISTS lords_days");
		$('body').append("<script type=\"text/javascript\" src=\"js/"+version+"_catechism.js\"></script>");
		tx.executeSql("CREATE TABLE IF NOT EXISTS lords_days (questionID int unique, question text, answer text, lordsDay int)");
		$.each(jsonObj.lords_days, function(i) {
	   		tx.executeSql("INSERT INTO lords_days (questionID, question, answer, lordsDay) VALUES (?, ?, ?, ?)", [jsonObj.lords_days[i].q_id, jsonObj.lords_days[i].q, jsonObj.lords_days[i].a, jsonObj.lords_days[i].ld]);
		});
		getQuestionsAndAnswers(localStorage.getItem("currentLordsDay"));
	});
}

function getQuestionsAndAnswers(id) {
	var htmlCode = "";
	$("body").addClass("wait");
	if (id > 52 || id == 0){id = "52";}
	db.transaction(function (tx) {
		tx.executeSql("SELECT * FROM lords_days WHERE lordsDay = ?", [id], function (ax, results) {
			if (results.rows.length != 0) {
				htmlCode += "<div class=\"lords-day-heading\">Lord&#146;s Day "+ id +"</div><div class = \"lords-day-body\">";
				for (var i = 0; i < results.rows.length; i++) {
					htmlCode += "<b>"+results.rows.item(i).questionID+". Q. "+results.rows.item(i).question+"?</b><br />"+"A. "+results.rows.item(i).answer+".<br /><br />";
				}
				htmlCode += "<div class=\"blank-space\"></div></div>";
				localStorage.setItem("currentLordsDay", id);
				$(".current-tab").removeClass("current-tab");
				$(".ld-button").addClass("current-tab");
				bb.pushScreen('lordsDay.htm', id, {htmlCode: htmlCode, screenType: "lordsDay"});
			}
		});
	});
}

function getSpecificQuestion(question_id){
	if (question_id > 129 || question_id == 0){
		question_id = "129";
	}
	db.transaction(function (tx) {
		tx.executeSql("SELECT * FROM lords_days WHERE questionID = ?", [question_id], function (ax, results) {
			getQuestionsAndAnswers(results.rows.item(0).lordsDay);	
		});
	});
}

function searchCatechism (searchText) {
	// Separate the query text into words and create query and regex strings
	var searchResults = "";
	var queryLikeExpr = "'%";
	var regex = "("; 
	var searchWords = searchText.split(" ");
	var wordCount = searchWords.length;
	var matchCount = 0;
	for (var i = 0; i < wordCount; i++) {
		if (searchWords[i] != " ") {
			queryLikeExpr += searchWords[i] + "%";
			regex += searchWords[i] + "[ ,;:.]+";
		}
		if (i == (wordCount-1)) {
			queryLikeExpr += "'";
			regex += ")";
		}
	}
	//Create query string
	var queryString = "SELECT * FROM lords_days WHERE answer LIKE "+queryLikeExpr+" OR question LIKE "+queryLikeExpr;

	db.transaction(function (tx) {
		tx.executeSql(queryString, null, function (ax, results) {
			if (results.rows.length != 0) {
				for (var i = 0; i < results.rows.length; i++) {
					var re = new RegExp(regex, "i");
					// check if result contains search string in the order of user input without other words inbetween
					if (re.test(results.rows.item(i).answer) == true || re.test(results.rows.item(i).question) == true) {
						var lordsDayQuestion = highlightSearchText(results.rows.item(i).question.split(re), re, matchCount);
						matchCount = lordsDayQuestion[1];
						var lordsDayAnswer = highlightSearchText(results.rows.item(i).answer.split(re), re, matchCount);
						matchCount = lordsDayAnswer[1];
						searchResults += "<div class = \"lords-day-body\"><b>"+results.rows.item(i).questionID+". Q. "+lordsDayQuestion[0]+"?</b><br />"+"A. "+lordsDayAnswer[0]+".<br /><div id=\"goto-ld-button\" data-bb-type=\"button\" onclick=\"getQuestionsAndAnswers("+results.rows.item(i).lordsDay+")\">Go to Lords Day</div><br /><br /></div>";
					}
				}
				if (matchCount == 0) {
					bb.pushScreen('search.htm', -1, {screenType: "searchQuery", isFailedSearch: true});
				} else {
					var appendText = (matchCount == 1) ? "<center><span class=\"matches-found\" >Found "+matchCount+" match.</span></center>" : "<center><span class=\"matches-found\" >Found "+matchCount+" matches.</span></center>";
					searchResults = appendText+searchResults+"<div class=\"blank-space\"></div></div>";
					bb.pushScreen('lordsDay.htm', -1, {htmlCode: searchResults, screenType: "searchResults"});
				}
			} else {
				bb.pushScreen('search.htm', -1, {screenType: "searchQuery", isFailedSearch: true});
			}
		});
	});
}

function highlightSearchText(textArray, regex, matchCount) {
	var textWithHighlight = "";
	for (var i = 0; i < textArray.length; i++){
		if (regex.test(textArray[i]) == true) {
			textArray[i] = "<b class=\"matched-text\">"+textArray[i]+"</b>";
			matchCount++;
		}
		textWithHighlight += textArray[i];
	}
	return [textWithHighlight, matchCount];
}