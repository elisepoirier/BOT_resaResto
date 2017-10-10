var restify = require('restify');
var botbuilder = require('botbuilder');

// setup restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3987, function(){
	console.log('%s bot started at %s', server.name, server.url);
});


// create chat connector
var connector = new botbuilder.ChatConnector({
	appId: process.env.APP_ID,
	appPassword: process.env.APP_SECRET
});


// listening for user inputs
server.post('/api/messages', connector.listen());



var bot = new botbuilder.UniversalBot(connector, [
    function (session) {
        session.beginDialog('saveUser', session.userData.profile);
    },
    function (session, results) {
        session.userData.profile = results.response; // Save user profile.
		session.send(`Bonjour ${session.userData.profile.name} ${session.userData.profile.lastName}!`);
		session.beginDialog('resaResto', session.userData.profile);
    }
]);

bot.dialog('saveUser', [
    function (session, args, next) {
        session.dialogData.profile = args || {}; // Set the profile or create the object.
        if (!session.dialogData.profile.name) {
            botbuilder.Prompts.text(session, "Quel est ton prénom?");
        } else {
            next(); // Skip if we already have this info.
        }
    },
    function (session, results, next) {
        if (results.response) {
            // Save user's name if we asked for it.
            session.dialogData.profile.name = results.response;
        }
        if (!session.dialogData.profile.lastName) {
            botbuilder.Prompts.text(session, "Quel est ton nom?");
        } else {
            next(); // Skip if we already have this info.
        }
    },
    function (session, results) {
        if (results.response) {
            // Save company name if we asked for it.
            session.dialogData.profile.lastName = results.response;
        }
        session.endDialogWithResult({ response: session.dialogData.profile });
    }
]);

bot.dialog('resaResto', [
    function (session) {
        session.send("Vous pouvre procéder à la reservation de votre dinner.");
        botbuilder.Prompts.time(session, "Quel est la date de la réservation ? (ex: June 6th at 5pm)");
    },
    function (session, results) {
        session.dialogData.reservationDate = botbuilder.EntityRecognizer.resolveTime([results.response]);
        botbuilder.Prompts.text(session, "Pour combien de personnes ?");
    },
    function (session, results) {
        session.dialogData.partySize = results.response;
        botbuilder.Prompts.text(session, "A quel nom est la réservation ?");
    },
    function (session, results) {
        session.dialogData.reservationName = results.response;

        // Process request and display reservation details
        session.send(`Reservation confirmée.<br/>Date: ${session.dialogData.reservationDate} <br/>Nombre de personne: ${session.dialogData.partySize} <br/>A nom de: ${session.dialogData.reservationName}`);
        session.endDialog();
	},
	function(session, results){
        if(results.response){
            session.dialogData.room = results.response;
            var msg = `Thank you. Your order will be delivered to room #${session.dialogData.room}`;
            session.endConversation(msg);
        }
    }
])
.endConversationAction(
    "endOrderDinner", "Ok, aurevoir",
    {
        matches: /^cancel$|^goodbye$|^annuler$|^stop$/i,
        confirmPrompt: "This will cancel your order. Are you sure?"
    }
);;



