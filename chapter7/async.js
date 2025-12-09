//console.log(1);
//console.log(2);
//console.log(3);

function worker() {
    let promise = new Promise(function (resolve, reject) {
        for (let i = 0; i < 10000000; i++) {
            sum += i;
        }
        resolve(sum);
    })
}
worker().then(result => console.log(result));
//console.log(4);
//console.log(5);

//    let sum = 0;
//    for (let i = 0; i < 10000000; i++) {
//        sum += i;
//   }
//    console.log(sum);
//}
//let sum = 0;
//for (let i = 0; i < 10000000; i++) {
//    sum += i;
//}
///console.log(sum);

//function asyncworker(callback) {
//    setTimeout(function() {
//        callback();
//    }, 3000);
//}

//function sayHello() {
//    console.log("Hello!");
//}

///setTimeout(sayHello, 5000);
//let intervalHandle = setInterval(sayHello, 1000);
//setTimeout(function() {
//    console.log("Stopping...");
//    clearInterval(intervalHandle);
//}, 7000);

function asyncworker() {
    return new Promise(function(resolve, reject) {
        setTimeout(function () {
            console.log(2);
            resolve();
        }, 3000);
    })
}
//let asyncworker = new Promise (function (resolve, reject) {
//    setTimeout(function() {
//        resolve;
//    }, 3000);
//});

async function main() {
    console.log(1);
    await asyncworker();
    console.log(3);
}

//asyncworker
//.then( function() {
//    console.log("Async work complete!");
//    console.log(6);
//});

/*
function add(a,b) {
    return a+b;
}

let add = (a,b) => {
    return a+b;
}

let add = (a,b) => a+b;

add(function() {

}, () => {});
*/