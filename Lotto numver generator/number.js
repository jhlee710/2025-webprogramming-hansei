function getRandomIntInclusive(1, 45) {
  const min = Math.ceil(1);
  const max = Math.floor(45);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

let randomValue = Math.floor(Math.random() * 45) + 1;
console.log('1~45', randomValue)

// 1~45까지의 수 중 랜덤하게 6개 추출
// 방법 1
// 1. 랜덤하게 1부터 45까지의 수 중 1하나를 생성
// 2. 생성된 수를 배열에 추가, 단 배열에 이미 존재하면 다시 
// 3. 총 6개의 수가 배열에 추가되면, 1~2번 반복동작 종료
let lottoNumbers = [];

while (lottoNumbers.length < 6) {
    let randNum = Math.floor(Math.random() * 45) + 1;
    if(!lottoNumbers.includes(randNum)) {

    }
}

// 방법 2
// 1. 배열에 1부터 45까지의 수를 추가
// 2. 배열에서 숫자 1개씩 추출
// 3. 2번을 총 6번 수행
let lottoNumbers = [];
for (let i = 0; i < 6; i++) {
    let index = Math.floor(Math.random() * lottoNumbers) + 1;
    let select
}