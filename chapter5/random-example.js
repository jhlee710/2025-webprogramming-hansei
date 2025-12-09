let randomValue = Math.random();
let floorValue = Math.floor(randomValue);
let roundValue = Math.round(randomValue);
let ceilValue = Math.ceil(randomValue);
console.log('random', randomValue);
console.log('floor', floorValue);
console.log('round', roundValue);
console.log('ceil', ceilValue);

//11부터 10까지의 랜덤 정수
//floor 0~9
Math.floor(Math.random() * 10) + 1;
console.log(Math.random() * 10) + 1;
//floor 1-20
let randValue = Math.floor(Math.random() * 20) + 1;
console.log('1~20', randValue)

function getRandomInt(max) {
  return Math.floor(Math.random() * max) + 1;
}