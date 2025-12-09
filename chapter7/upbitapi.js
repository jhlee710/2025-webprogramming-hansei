fetch('http://api.upbit.com/v1/market/all')
    .then(response => response.json())
    .then(data => {
        console.log('업비트에서 제공하는 마켓 정보 개수 : ${data.length}');
        for (let i = 0; i < data.length; i++) {
            console.log('${data[i].korean_name}');
        }
    });