var express = require("express");
var app = express();
var bodyParser = require("body-parser");
app.use(express.static("public"));
app.set("port", process.env.PORT || 80);
var jsonfile = require("jsonfile");
app.use(bodyParser.json());
var tunnel = require("tunnel");
var request = require("request"),
  cheerio = require("cheerio"),
  fs = require("fs"),
  path = require("path"),
  res_arr = [],
  ind = 0,
  count_posts = 1;
let random = null;
min = 1000; //в продакшн 5000
max = 6000; //не меньше 50000
var proxyArr = [];
let server = app.listen(app.get("port"), function () {
  //identification
  console.log(
    "Сервер запущен на  http://localhost:" +
      app.get("port") +
      "  Ctrl-C to terminate"
  );
  let filename = "proxyList.txt";
  fs.readFile(filename, "utf8", function (err, data) {
    if (err) throw err;
    console.log("OK: " + filename);
    proxyArr = data.split("\n");
  });
});
app.post("/ResArr/", function (req, res) {
  iLoveDash();
  // news_base_url=req.body.Name;
  news_base_url = req.body.Name + "&view=gallery"; //учесть что вид бывает галерея и нет
  restrict = req.body.Restrict; //взяла условие из запроса
  badrestrict = req.body.BadRestrict;
  let restricts = restrict.split("%");
  let badrestricts = badrestrict.split("%");
  let suited = false;
  console.log(news_base_url);
  //let short_url = news_base_url.replace('https://www.avito.ru', '');
  let options = {
    headers: {
      "User-Agent": tunnel.httpOverHttp({
        proxy: {
          host: "182.71.102.215",
          port: 3128,
          headers: "add's headers for request",
        },
      }),
    },
    url: news_base_url,
  };
  //options.proxy=options.proxy.substring(0, options.proxy.length - 2);
  console.log(options);
  get_page_content(options, 0);

  function get_page_content(options, i) {
    request(options, function (error, response, body) {
      //console.log(body);
      if (!error) {
        //console.log(body);
        var $ = cheerio.load(body),     //скаченый боди
          newses = $(".item");
        if (newses.length == 0) {
          console.log("Ничего не найдено либо выдали бан");
        }
        newses.each(function () {       //по каждому идему
          var self = $(this),
            cont = self.find(".item__line"); //находим объявление
          var title;
          var price;
          var temp = false;
          var end = false;
          /*cont.find('span').each(function () {
                        if ($(this)[0].children[0])
                            if($(this)[0].children[0].data!=="В избранное" && $(this)[0].children[0].data!== '') { //находим название товара
                                //console.log($(this)[0].children[0].data);
                                // console.log("_______________________________")
                                    title+=$(this)[0].children[0].data;
                                    end=true;
                            }

                    });*/
          //console.log("desc " + cont.find('.description')[0]);
          self.find(".description").each(function () {                 //цикл по всем превью объявлений на странице
            title = $(this).find(".snippet-link")[0].children[0].data; //название текущего объявление
            if (!badrestricts.some(function(br) { //если минус-слов нет в названии
              return title.indexOf(br) >= 0 //если найдено минус слово возвращает истину
            })) {
              let link = "https://www.avito.ru" + this.find("a").attr("href"); //ищем ссылку на текующее обьявление
              let post = get_post_content(link, id);      //post.content это описание
              if (!badrestricts.some(function(br) { //если минус-слов нет в описании
                return post.content.indexOf(br) >= 0 //если найдено минус-слово возвращает истину
              }))
              {
                if (restricts.some(function (r) { //если плюс-слово найдено
                  return title.indexOf(r) >= 0 //если найдено плюс-слово возвращает истину
                })) {  res_arr.push(this); }//добавляем в итоговый массив
                {
                  if (restricts.some(function (r) { //если плюс-слов есть в описании
                    return post.content.indexOf(r) >= 0 //если найдено плюс-слово возвращает истину
                  })) {
                    res_arr.push(this);//добавляем в итоговый массив
                  }
                }
              }
            }
            });






            if ($(this).find(".snippet-link")[0].children[0].data)
            //console.log('зашли в описание')
                  //ищем тайтл
            price = $(this).find(".snippet-price")[0].children[0].data;     //ищем прайс
            //console.log(title + " " + price);
            if (title && price) {
              // console.log(title +" "+ price);
              end = true;
            }
            //console.log($(this)[0].data);
            /*    if ($(this)[0].children[0])
                                if($(this)[0].children[0].data!==''  && $(this)[0].children[0].data!==' ') { //находим название товара
                                    //console.log($(this)[0].children[0].data);
                                    // console.log("_______________________________")

           //конец моего алгоритма для слов!!!!!!!!тупой Юра                     }*/
          });
          if (end) {
            link = "https://www.avito.ru" + self.find("a").attr("href");
            var title = title.replace("undefined", "");
            res_arr[ind] = {
              title: title,
              link: "https://www.avito.ru" + self.find("a").attr("href"),           //составляем обьект с товаром
              img1: self.find("img").attr("src"),
              img2: self.find("img").attr("data-srcpath"),
              content: "",
            };
            //случайная пауза перед заходом в объявление
              //::TODO убрать или нет??
            const postpause = min + Math.random() * (max - min);
            setTimeout(get_post_content, postpause, link, ind);
            //
            ind++;
          }
        });
        //console.log(res_arr);
      } else {
        console.log("Произошла ошибка: " + error);
      }
    });
  }
  // Получение контента
  function get_post_content(link, array_index) {
    request(link, function (error, response, body) {            //запрос на страницу товара
      if (res_arr[array_index])
        if (!error) {
          var $ = cheerio.load(body, {                  //парсим без декода
            decodeEntities: false,
          });
          //console.log($('.item-description').html())
          res_arr[array_index].content = $(".item-description").html(); //item-address__string
          res_arr[array_index].adress = $(".item-address__string").text();


        } else {
          console.log("Произошла ошибка: " + error);
        }
      /* console.log(count_posts)
             console.log(res_arr.length)*/
      if (count_posts++ == res_arr.length) {
        res.send(res_arr);
        //write_parse_res( file_json, JSON.stringify(res_arr) );
      }
    });
  }
});

function iLoveDash(){
    console.log("yura+dasha=love");
}