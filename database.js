var db = null;

function setupDatabase(){
	db = openDatabase("catechismDatabase", '1.0', 'Catechism', 129 * 4,  clearAndResetData);
}

function clearAndResetData() {
	bb.pushScreen('setUp.html', -1, {screenType: "setUp"});
	localStorage.setItem("currentLordsDay", 1);
	localStorage.setItem("fontSize", 24);
	 db.transaction(function (tx) {
	 	tx.executeSql("DROP TABLE IF EXISTS lords_days");
		$('body').append("<script type=\"text/javascript\" src=\"onfirstload.js\"></script>");
		tx.executeSql("CREATE TABLE IF NOT EXISTS lords_days (questionID int unique, question text, answer text, lordsDay int)");
		$.each(jsonObj.lords_days, function(i) {
	   		tx.executeSql("INSERT INTO lords_days (questionID, question, answer, lordsDay) VALUES (?, ?, ?, ?)", [jsonObj.lords_days[i].question_id, jsonObj.lords_days[i].question, jsonObj.lords_days[i].answer, jsonObj.lords_days[i].lords_day]);
		});
		getQuestionsAndAnswers(1);
	});
}

function getQuestionsAndAnswers(id) {
	var htmlCode = "";
	$("body").addClass("wait");
	if (id > 52){id = "52";}
	db.transaction(function (tx) {
		tx.executeSql("SELECT * FROM lords_days WHERE lordsDay = ?", [id], function (ax, results) {
			if (results.rows.length == 0) {
				htmlCode += "<div class=\"error-finding-lords-day\"><b>Lord's Days are numbered 1-52. Try your search again.</b></div>";
				toggleDiv(0, "number-buttons");
			} else {
				htmlCode += "<div class=\"lords-day-heading\">Lord&#146;s Day "+ id +"</div><div class = \"lords-day-body\">";
				for (var i = 0; i < results.rows.length; i++) {
					htmlCode += "<b>"+results.rows.item(i).questionID+". Q. "+results.rows.item(i).question+"?</b><br />"+"A. "+results.rows.item(i).answer+".<br /><br />";
				}
				htmlCode += "<div class=\"blank-space\"></div></div>";
				localStorage.setItem("currentLordsDay", id);
				bb.pushScreen('lordsDay.htm', id, {htmlCode: htmlCode, screenType: "lordsDay"});
			}
		});
	});
}

function getSpecificQuestion(question_id){
	if (question_id > 129){
		question_id = "129";
	}
	db.transaction(function (tx) {
		tx.executeSql("SELECT * FROM lords_days WHERE questionID = ?", [question_id], function (ax, results) {
			getQuestionsAndAnswers(results.rows.item(0).lordsDay);	
		});
	});
}

function searchCatechism (searchText) {
	//var queryString = "SELECT * FROM lords_days WHERE answer LIKE '%"+searchText+"%'";
	var searchResults = "";
	var queryLikeExpr = "'%"; 
	var searchWords = searchText.split(" ");
	var wordCount = searchWords.length;
	for (var i = 0; i < wordCount; i++) {
		if (searchWords[i] != " ") {
			queryLikeExpr += searchWords[i] + "%";
		}
		if (i == (wordCount-1)) {
			queryLikeExpr += "'";
		}
	}
	var queryString = "SELECT * FROM lords_days WHERE answer LIKE "+queryLikeExpr+" OR question LIKE "+queryLikeExpr;
	db.transaction(function (tx) {
		tx.executeSql(queryString, null, function (ax, results) {
			if (results.rows.length != 0) {
				for (var i = 0; i < results.rows.length; i++) {
					searchResults += "<div class = \"lords-day-body\"><b>"+results.rows.item(i).questionID+". Q. "+results.rows.item(i).question+"?</b><br />"+"A. "+results.rows.item(i).answer+".<br /><div id=\"goto-ld-button\" data-lords-day-number=\""+results.rows.item(i).lordsDay+"\" data-bb-type=\"button\">Go to Lords Day</div><br /><br /></div>";
				}
				searchResults += "<div class=\"blank-space\"></div></div>";
				bb.pushScreen('lordsDay.htm', -1, {htmlCode: searchResults, screenType: "searchResults"});
			}
		});
	});
}