let person = {
    name: "J1",
    age: 23,
    hobbies: ['football', 'basketball', 'volleyball'],
    tall: 180,
    gender: '',
    height: 180,
    sayHello: function() {
        console.log('안녕하세요, 저는 $(this.name)입니다');
    }
}

let dog = {
    name: '',
    age: 3,
    breed: '',
    bark: funciton() {
        console.log('멍멍!');
    }
}


console.log(person.name)
console.log(person.sayHello());
console.log(dog.bark());

let personDog = {...person, ...dog};
