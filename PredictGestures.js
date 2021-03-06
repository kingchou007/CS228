var testingSampleIndex = 0;
const knnClassifier = ml5.KNNClassifier();

var trainingCompleted = false;


var numSamples;
var numFeatures;
var Features;
var currentFeatures;
var currentLabel;
var predictedLabel;
var controllerOptions = {};
var oneFrameOfData = nj.zeros([5, 4, 6]);
var previousNumHands = 0;
var currentNumHands = 0;
var moreThanOneHand;
//var numSamples = 100;
var currentSample = 0;
var predictedClassLabels = nj.zeros(2);
var n = 0;
var m = 0;
var d = 0;
var programState = 0;
var digitToShow = 0;
var timeSinceLastDigitChange = new Date();

function SignIn(){
    username = document.getElementById('username').value;
    var list = document.getElementById('users');
    if(IsNewUser(username, list)){
        CreateNewUser(username,list)
        CreateSignInItem(username,list)
    } else { //Returing User
        //ID tag for the list item user’s number of sign in attempts
        var ID = String(username) + "_signins";
        //Will return such an item.
        var listItem = document.getElementById(ID);
        listItem.innerHTML = parseInt (listItem.innerHTML) + 1;
    }
    console.log(list.innerHTML);
    return false;

}

function IsNewUser(username, list) {
    var usernameFound = false;
    var users = list.children;
    for (var i = 0; i < users.length; i++) {
        if (username == users[i].innerHTML){
            usernameFound = true;
        }
    }
    return usernameFound == false;
}

function CreateNewUser(username,list){
    //Creating an html list item
    var item = document.createElement('li');
    item.id = String(username) + "_name";
    item.innerHTML = String(username);
    list.appendChild(item);
}
function CreateSignInItem(username,list){
    //Creating a 2nd list item (keep track of signins)
    var item2 = document.createElement('li');
    item2.id = String(username) + "_signins";
    item2.innerHTML = 1;
    list.appendChild(item2);
}


function Test(){
    var currentTestingSample = oneFrameOfData.pick(null, null, null, 0);
    CenterDataX()
    CenterDataY()
    CenterDataZ()
    currentTestingSample = currentTestingSample.reshape(120).tolist();
    knnClassifier.classify(currentTestingSample, GotResults);
}

function GotResults(err, result){
    var c = result.label;
    predictedClassLabels.set(parseInt(result.label));
    n += 1;
    m = (((n-1)*m) + (c == digitToShow))/n;
    console.log(n + " " + m + " " + c);
}

function CenterDataX(){
    var xValues = oneFrameOfData.slice([],[],[0,6,3])
    var currentMean = xValues.mean()
    return currentMean

}

function CenterDataY(){
    var yValues = oneFrameOfData.slice([],[],[1,6,3])
    var currentMean = yValues.mean()
    return currentMean


}

function CenterDataZ(){
    var zValues = oneFrameOfData.slice([],[],[2,6,3])
    var currentMean = zValues.mean()
    //console.log(currentMean)
    return currentMean


}



function HandleFrame(frame){
    clear();

    //one hand over the device
    if(frame.hands.length >= 1){
        // first element in the hands
        var hand = frame.hands[0];
        var interactionBox = frame.interactionBox;
        HandleHand(hand,interactionBox);
    }
}

function HandleHand(hand,interactionBox){
    //fingers element
    var fingers = hand.fingers;
    //iterrate each finger
    for(var n = 3; 0 <=n; --n){
        for(var i=0; i <fingers.length; i++){
            HandleFinger(fingers[i],n,i,interactionBox)
        }
    }
}

function HandleFinger(finger,n,fingerIndex,interactionBox){

    HandleBone(finger.bones[n],n,fingerIndex,interactionBox);
}


function HandleBone(bone,type,fingerIndex,interactionBox){
    var bone_start = bone.prevJoint;
    var bone_end = bone.nextJoint;

    var normalizedPrevJoint = interactionBox.normalizePoint(bone.prevJoint,true);
    var normalizedNextJoint = interactionBox.normalizePoint(bone.nextJoint,true);

    var x_start = normalizedPrevJoint[0];
    var x_end =  normalizedNextJoint[0];

    var y_start = normalizedPrevJoint[1];
    var y_end = normalizedNextJoint[1];

    var z_start = normalizedPrevJoint[2];
    var z_end = normalizedNextJoint[2];


    oneFrameOfData.set(fingerIndex,type,0,x_start);
    oneFrameOfData.set(fingerIndex,type,1,y_start);
    oneFrameOfData.set(fingerIndex,type,2,z_start);
    oneFrameOfData.set(fingerIndex,type,3,x_end);
    oneFrameOfData.set(fingerIndex,type,4,y_end);
    oneFrameOfData.set(fingerIndex,type,5,z_end);


    // Test()

    var canvasXStart = (window.innerWidth * x_start) * 0.5;
    var canvasXEnd = (window.innerWidth * x_end) * 0.5;
    var canvasYStart = (window.innerHeight * (1-y_start)) * 0.5;
    var canvasYEnd =  (window.innerHeight * (1-y_end)) * 0.5;

    //line and line weight
    var green = m * 450;
    var red = (1 - m) * 450;
    if (type == 0) {
        stroke(red, green, 0);
        strokeWeight(12*3);
        line(canvasXStart,canvasYStart,canvasXEnd,canvasYEnd);
    } else if (type == 1) {
        stroke(red, green, 0);
        strokeWeight(8*3);
        line(canvasXStart,canvasYStart,canvasXEnd,canvasYEnd);
    } else if (type == 2) {
        stroke(red, green, 0);
        strokeWeight(5*3);
        line(canvasXStart,canvasYStart,canvasXEnd,canvasYEnd);
    } else {
        stroke(red, green, 0);
        strokeWeight(2*3);
        line(canvasXStart,canvasYStart,canvasXEnd,canvasYEnd);
    }
}

function DetermineState(frame){
    if(frame.hands.length  == 0){
        programState = 0
    }
    else{
        HandleFrame(frame)
        if(HandIsUncentered()){
            programState = 1
        }
        else{
            programState = 2
        }
    }
}

function HandIsUncentered(){

    if(HandIsTooFarToTheLeft() || HandIsTooFarToTheRight() || HandIsTooFarToHigh() || HandIsTooFarToLow() || HandIsTooFar() || HandIsTooClose() ){
        return true;
    }
    else{
        return false;
    }
}


function HandIsTooFarToTheLeft(){
    if(CenterDataX() < 0.25 ){
        image(arrowRight,window.innerWidth/2,0,window.innerWidth/2,window.innerHeight/2);
        return true;
    }
    else{
        return false;
    }
}

function HandIsTooFarToTheRight(){
    if(CenterDataX() > 0.75 ){
        image(arrowLeft, window.innerWidth/2,0,window.innerWidth/2,window.innerHeight/2);
        return true;
    }
    else{
        return false;
    }
}

function HandIsTooFarToHigh(){
    if(CenterDataY() < 0.25 ){
        image(arrowUp, window.innerWidth/2,0,window.innerWidth/2,window.innerHeight/2);
        return true;
    }
    else{
        return false;
    }
}

function HandIsTooFarToLow(){
    if(CenterDataY() > 0.75 ){
        image(arrowDown, window.innerWidth/2,0,window.innerWidth/2,window.innerHeight/2);
        return true;
    }
    else{
        return false;
    }
}

function HandIsTooClose(){
    if(CenterDataZ() < 0.25 ){
        image(arrowTowards,window.innerWidth/2,0,window.innerWidth/2,window.innerHeight/2);
        return true;
    }
    else{
        return false;
    }
}

function HandIsTooFar(){
    if(CenterDataZ() > 0.75 ){
        image(arrowAway, window.innerWidth/2,0,window.innerWidth/2,window.innerHeight/2);
        return true;
    }
    else{
        return false;
    }
}

function HandleState0(frame) {
    TrainKNNIfNotDoneYet()
    DrawImageToHelpUserPutTheirHandOverTheDevice()
}

function HandleState1(frame) {
    //test
}

function HandleState2(frame) {
    HandleFrame(frame);
    DrawLowerRightPanel();
    DetermineWhetherToSwitchDigits()
    Test()
}

function DrawLowerRightPanel(){
    if (digitToShow == 0) {
        image(n0, window.innerWidth/2, window.innerHeight/2, 200, 200);
    } else if(digitToShow == 1){
        image(n1, window.innerWidth/2, window.innerHeight/2, 200, 200);
    } else if (digitToShow == 2){
        image(n2, window.innerWidth/2, window.innerHeight/2, 200, 200);
    } else if (digitToShow == 3){
        image(n3, window.innerWidth/2, window.innerHeight/2, 200, 200);
    } else if (digitToShow == 4){
        image(n4, window.innerWidth/2, window.innerHeight/2, 200, 200);
    } else if (digitToShow == 5){
        image(n5, window.innerWidth/2, window.innerHeight/2, 200, 200);
    } else if (digitToShow == 6){
        image(n6, window.innerWidth/2, window.innerHeight/2, 200, 200);
    } else if (digitToShow == 7){
        image(n7, window.innerWidth/2, window.innerHeight/2, 200, 200);
    } else if (digitToShow == 8){
        image(n8, window.innerWidth/2, window.innerHeight/2, 200, 200);
    } else if(digitToShow == 9) {
        image(n9 , window.innerWidth / 2 , window.innerHeight / 2 , 200 , 200);
    }
}

function DetermineWhetherToSwitchDigits() {
    if (TimeToSwitchDigits()) {
        SwitchDigits();
    }
}

function TimeToSwitchDigits() {
    var currentTime = new Date();
    var timeInBetweenInMilliseconds = currentTime - timeSinceLastDigitChange;
    var timeInBetweenInSeconds = timeInBetweenInMilliseconds / 1000;
    console.log(timeInBetweenInSeconds);
    if (timeInBetweenInSeconds > 7 && m > 0.3) {
        image(right, 0,window.innerHeight/2, window.innerWidth/2, window.innerHeight/2);
        timeSinceLastDigitChange = new Date();
        return true;
    } else {
        return false;
        // image(wrong,0,window.innerHeight/2, window.innerWidth/2, window.innerHeight/2);
    }
}

function SwitchDigits() {
    n=0;
    if(digitToShow == 0){
        digitToShow = 1;
    } else if (digitToShow == 1){
        digitToShow = 2;
    }
    else if (digitToShow == 2){
        digitToShow = 3;
    }
    else if (digitToShow == 3){
        digitToShow = 4;
    }
    else if (digitToShow == 4){
        digitToShow = 5;
    }
    else if (digitToShow == 5){
        digitToShow = 6;
    }
    else if (digitToShow == 6){
        digitToShow = 7;
    }
    else if (digitToShow == 7){
        digitToShow = 8;
    }
    else if (digitToShow == 8){
        digitToShow = 9;
    }
    else if (digitToShow == 9){
        digitToShow = 0;
    }

}

function DrawImageToHelpUserPutTheirHandOverTheDevice(){
    image(img, 10, 10, window.innerWidth/2, window.innerHeight/2);
}

function TrainKNNIfNotDoneYet() {
    if(trainingCompleted == false){
        Train();
        trainingCompleted = true;
    }
}

Leap.loop(controllerOptions, function(frame){
    clear();
    DetermineState(frame);
    if(programState == 0){
        HandleState0(frame)
    }
    else if (programState == 1){
        HandleState1(frame)
    }
    else{
        HandleState2(frame)
    }
})

function Train(){
    trainingCompleted = true;
    for (var i = 0; i < train0.shape[3]; i++) {
        features0 = train0.pick(null,null,null,i);
        features0 = features0.reshape(120);
        knnClassifier.addExample(features0.tolist(), 0);
    }

    for (var i = 0; i < train0.shape[3]; i++) {
        features0w = train0Wills.pick(null,null,null,i);
        features0w = features0w.reshape(120);
        knnClassifier.addExample(features0w.tolist(), 0);
    }

    for (var i = 0; i < train1.shape[3]; i++) {
        features1 = train1.pick(null,null,null,i);
        features1 = features1.reshape(120);
        knnClassifier.addExample(features1.tolist(), 1);
    }

    for (var i = 0; i < train1.shape[3]; i++) {
        features1d = train12Davis.pick(null,null,null,i);
        features1d = features1d.reshape(120);
        knnClassifier.addExample(features1d.tolist(), 1);
    }

    for (var i = 0; i < train1.shape[3]; i++) {
        features1b = train1Bongard.pick(null,null,null,i);
        features1b = features1b.reshape(120);
        knnClassifier.addExample(features1b.tolist(), 1);
    }

    for (var i = 0; i < train2.shape[3]; i++) {
        features2 = train2.pick(null,null,null,i);
        features2 = features2.reshape(120);
        knnClassifier.addExample(features2.tolist(), 2);
    }

    for (var i = 0; i < train3.shape[3]; i++) {
        features3 = train3.pick(null,null,null,i);
        features3 = features3.reshape(120);
        knnClassifier.addExample(features3.tolist(), 3);
    }

    for (var i = 0; i < train4.shape[3]; i++) {
        features4 = train4.pick(null,null,null,i);
        features4 = features4.reshape(120);
        knnClassifier.addExample(features4.tolist(), 4);
    }


    for (var i = 0; i < train4.shape[3]; i++) {
        features4b = train4Bongard.pick(null,null,null,i);
        features4b = features4b.reshape(120);
        knnClassifier.addExample(features4b.tolist(), 4);
    }

    for (var i = 0; i < train5.shape[3]; i++) {
        features5 = train5.pick(null, null, null, i);
        features5 = features5.reshape(120);
        knnClassifier.addExample(features5.tolist(), 5);
    }

    for (var i = 0; i < train5.shape[3]; i++) {
        features5b = train5Bongard.pick(null, null, null, i);
        features5b = features5b.reshape(120);
        knnClassifier.addExample(features5b.tolist(), 5);
    }

    for (var i = 0; i < train6.shape[3]; i++) {
        features6 = train6.pick(null,null,null,i);
        features6 = features6.reshape(120);
        knnClassifier.addExample(features6.tolist(), 6);
    }

    for (var i = 0; i < train7.shape[3]; i++) {
        features7 = train7.pick(null,null,null,i);
        features7 = features7.reshape(120);
        knnClassifier.addExample(features7.tolist(), 7);
    }

    for (var i = 0; i < train7.shape[3]; i++) {
        feature7v = train7Vega.pick(null,null,null,i);
        feature7v = feature7v.reshape(120);
        knnClassifier.addExample(feature7v.tolist(), 7);
    }

    for (var i = 0; i < train7.shape[3]; i++) {
        feature7f = train7Fisher.pick(null,null,null,i);
        feature7f = feature7f.reshape(120);
        knnClassifier.addExample(feature7f.tolist(), 7);
    }

    for (var i = 0; i < train7.shape[3]; i++) {
        feature7m = train7Manian.pick(null,null,null,i);
        feature7m = feature7m.reshape(120);
        knnClassifier.addExample(feature7m.tolist(), 7);
    }

    for (var i = 0; i < train8.shape[3]; i++) {
        features8 = train8.pick(null,null,null,i);
        features8 = features8.reshape(120);
        knnClassifier.addExample(features8.tolist(), 8);
    }

    for (var i = 0; i < train9.shape[3]; i++) {
        features9= train9.pick(null,null,null,i);
        features9 = features9.reshape(120);
        knnClassifier.addExample(features9.tolist(), 9);
    }
}










