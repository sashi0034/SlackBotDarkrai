'use strict';
const http = require('http');

function clweather(api, lat, lon, callback){
  const req = 'http://api.openweathermap.org/data/2.5/weather?lat='+lat+'&lon='+lon+'&appid='+ api;


  http.get(req, res => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            body = body.concat(chunk);
        });
        res.on('end', () => {
            console.log("天気データを取得できました");
            let res1 = JSON.parse(body);
            
            let l="お天気データを取得できました\n";
            l+=`> 天気: ${res1["weather"][0]["main"]}\n`;
            l+=`> 説明: ${res1["weather"][0]["description"]}\n`;
            l+=`> 平均気温: ${res1["main"]["temp"]-273.15}℃\n`;
            l+=`> 体感気温: ${res1["main"]["feels_like"]-273.15}℃\n`;
            l+=`> 最低気温: ${res1["main"]["temp_min"]-273.15}℃\n`;
            l+=`> 最高気温: ${res1["main"]["temp_max"]-273.15}℃\n`;
            l+=`> 気圧: ${res1["main"]["pressure"]}hPa\n`;
            l+=`> 湿度: ${res1["main"]["pressure"]}％\n`;
            l+=`> 風速: ${res1["wind"]["speed"]}m/s\n`;
            l+=`> 風向: ${res1["wind"]["deg"]}度\n`;
            l+=`> 雲量: ${res1["clouds"]["all"]}\n`;
            l+=`> cod: ${res1["cod"]}ppm\n`;
            l+=`> 地名: ${res1["name"]}\n`;
            
            console.log(res1);
            
            callback(l);
        });
    })
        .on('error', e => {
            console.error(e.message);
        });

}

module.exports = {
  clweather
}
